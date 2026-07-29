package com.bugflow.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final RedisTemplate<String, Object> redisTemplate;

    public RateLimitingFilter(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        String rateLimitKey;
        int maxLimit;
        long timeoutSeconds;

        if (path.contains("/api/v1/auth/login")) {
            // Strict limit for logins: 10 attempts per minute
            rateLimitKey = "rate:limit:login:" + clientIp;
            maxLimit = 10;
            timeoutSeconds = 60;
        } else if (path.startsWith("/api/v1/")) {
            // General API limit: 100 requests per minute
            rateLimitKey = "rate:limit:api:" + clientIp;
            maxLimit = 100;
            timeoutSeconds = 60;
        } else {
            // Skip non-API paths (swagger, docs, static pages)
            filterChain.doFilter(request, response);
            return;
        }

        Long currentCount = 0L;
        try {
            currentCount = redisTemplate.opsForValue().increment(rateLimitKey);
            if (currentCount != null && currentCount == 1) {
                redisTemplate.expire(rateLimitKey, timeoutSeconds, TimeUnit.SECONDS);
            }
        } catch (Exception e) {
            // Fail open if Redis is down, to ensure high availability
            filterChain.doFilter(request, response);
            return;
        }

        if (currentCount != null && currentCount > maxLimit) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            Map<String, Object> errorDetails = new HashMap<>();
            errorDetails.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            errorDetails.put("error", "Too Many Requests");
            errorDetails.put("message", "API request limit exceeded. Please try again after a minute.");
            errorDetails.put("path", path);

            new ObjectMapper().writeValue(response.getOutputStream(), errorDetails);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
