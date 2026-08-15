package com.bugflow.service.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Component
public class GeminiAiProvider implements AiProvider {

    @Value("${GEMINI_API_KEY:}")
    private String apiKeyFromProperty;

    private final RestTemplate restTemplate = new RestTemplate();

    private String getApiKey() {
        if (apiKeyFromProperty != null && !apiKeyFromProperty.trim().isEmpty()) {
            return apiKeyFromProperty;
        }
        return System.getenv("GEMINI_API_KEY");
    }

    public boolean isConfigured() {
        String key = getApiKey();
        return key != null && !key.trim().isEmpty();
    }

    @Override
    public String generateText(String prompt) {
        String key = getApiKey();
        if (key == null || key.trim().isEmpty()) {
            throw new IllegalStateException("Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.");
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + key;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Build Gemini API Request JSON
        Map<String, Object> requestBody = new HashMap<>();
        
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", Collections.singletonList(part));
        
        requestBody.put("contents", Collections.singletonList(content));

        // Request structured JSON output if applicable
        if (prompt.contains("JSON") || prompt.contains("json") || prompt.contains("schema")) {
            Map<String, Object> generationConfig = new HashMap<>();
            generationConfig.put("responseMimeType", "application/json");
            requestBody.put("generationConfig", generationConfig);
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map body = response.getBody();
                List candidates = (List) body.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map contentMap = (Map) candidate.get("content");
                    if (contentMap != null) {
                        List parts = (List) contentMap.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map partMap = (Map) parts.get(0);
                            return (String) partMap.get("text");
                        }
                    }
                }
            }
            throw new RuntimeException("Unexpected response format from Gemini API");
        } catch (Exception e) {
            throw new RuntimeException("Error calling Gemini API: " + e.getMessage(), e);
        }
    }
}
