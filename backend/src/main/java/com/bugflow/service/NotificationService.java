package com.bugflow.service;

import com.bugflow.dto.NotificationResponse;

import java.util.List;

public interface NotificationService {
    void sendNotification(Long userId, String title, String message);
    List<NotificationResponse> getNotificationsForUser(String username);
}
