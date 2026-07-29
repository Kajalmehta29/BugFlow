package com.bugflow.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_logs")
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String action;

    @Column(name = "old_value", length = 500)
    private String oldValue;

    @Column(name = "new_value", length = 500)
    private String newValue;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bug_id", nullable = false)
    private Bug bug;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public ActivityLog() {
    }

    public ActivityLog(Long id, String action, String oldValue, String newValue, Bug bug, User user, LocalDateTime createdAt) {
        this.id = id;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.bug = bug;
        this.user = user;
        this.createdAt = createdAt;
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

    public Bug getBug() {
        return bug;
    }

    public void setBug(Bug bug) {
        this.bug = bug;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "ActivityLog{" +
                "id=" + id +
                ", action='" + action + '\'' +
                ", oldValue='" + oldValue + '\'' +
                ", newValue='" + newValue + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    // Builder
    public static ActivityLogBuilder builder() {
        return new ActivityLogBuilder();
    }

    public static class ActivityLogBuilder {
        private Long id;
        private String action;
        private String oldValue;
        private String newValue;
        private Bug bug;
        private User user;
        private LocalDateTime createdAt;

        public ActivityLogBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public ActivityLogBuilder action(String action) {
            this.action = action;
            return this;
        }

        public ActivityLogBuilder oldValue(String oldValue) {
            this.oldValue = oldValue;
            return this;
        }

        public ActivityLogBuilder newValue(String newValue) {
            this.newValue = newValue;
            return this;
        }

        public ActivityLogBuilder bug(Bug bug) {
            this.bug = bug;
            return this;
        }

        public ActivityLogBuilder user(User user) {
            this.user = user;
            return this;
        }

        public ActivityLogBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public ActivityLog build() {
            return new ActivityLog(id, action, oldValue, newValue, bug, user, createdAt);
        }
    }
}
