package com.bugflow.service;

import com.bugflow.dto.NotificationResponse;
import com.bugflow.exception.ResourceNotFoundException;
import com.bugflow.model.User;
import com.bugflow.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationServiceImpl.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public NotificationServiceImpl(RedisTemplate<String, Object> redisTemplate,
                                   UserRepository userRepository) {
        this.redisTemplate = redisTemplate;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public void sendNotification(Long userId, String title, String message) {
        String key = "user:" + userId + ":notifications";

        NotificationResponse notification = new NotificationResponse(
                UUID.randomUUID().toString(),
                title,
                message,
                LocalDateTime.now().toString()
        );

        try {
            String jsonVal = objectMapper.writeValueAsString(notification);
            // Push to top of list
            redisTemplate.opsForList().leftPush(key, jsonVal);
            // Limit to max 50 recent notifications
            redisTemplate.opsForList().trim(key, 0, 49);
        } catch (Exception e) {
            logger.error("Failed to store notification in Redis for user ID {}: {}", userId, e.getMessage());
        }
    }

    @Override
    public List<NotificationResponse> getNotificationsForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        String key = "user:" + user.getId() + ":notifications";

        try {
            List<Object> rawList = redisTemplate.opsForList().range(key, 0, -1);
            if (rawList == null || rawList.isEmpty()) {
                return Collections.emptyList();
            }

            List<NotificationResponse> notifications = new ArrayList<>();
            for (Object obj : rawList) {
                if (obj instanceof String) {
                    NotificationResponse notif = objectMapper.readValue((String) obj, NotificationResponse.class);
                    notifications.add(notif);
                }
            }
            return notifications;
        } catch (Exception e) {
            logger.error("Failed to read notifications from Redis for user {}: {}", username, e.getMessage());
            return Collections.emptyList();
        }
    }
}
