package com.bugflow.dto;

import com.bugflow.model.ActivityLog;

import java.time.LocalDateTime;

public class ActivityLogResponse {

    private Long id;
    private String action;
    private String oldValue;
    private String newValue;
    private UserResponse user;
    private LocalDateTime createdAt;

    public ActivityLogResponse() {
    }

    public ActivityLogResponse(Long id, String action, String oldValue, String newValue, UserResponse user, LocalDateTime createdAt) {
        this.id = id;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.user = user;
        this.createdAt = createdAt;
    }

    public static ActivityLogResponse fromActivityLog(ActivityLog log) {
        if (log == null) {
            return null;
        }
        return new ActivityLogResponse(
                log.getId(),
                log.getAction(),
                log.getOldValue(),
                log.getNewValue(),
                UserResponse.fromUser(log.getUser()),
                log.getCreatedAt()
        );
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getOldValue() {
        return oldValue;
    }

    public void setOldValue(String oldValue) {
        this.oldValue = oldValue;
    }

    public String getNewValue() {
        return newValue;
    }

    public void setNewValue(String newValue) {
        this.newValue = newValue;
    }

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
