package com.bugflow.dto;

import com.bugflow.model.Bug;

import java.time.LocalDateTime;

public class BugResponse {

    private Long id;
    private String title;
    private String description;
    private String priority;
    private String severity;
    private String status;
    private UserResponse assignee;
    private UserResponse reporter;
    private Long projectId;
    private SprintResponse sprint;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BugResponse() {
    }

    public BugResponse(Long id, String title, String description, String priority, String severity, String status,
                       UserResponse assignee, UserResponse reporter, Long projectId, SprintResponse sprint,
                       LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.severity = severity;
        this.status = status;
        this.assignee = assignee;
        this.reporter = reporter;
        this.projectId = projectId;
        this.sprint = sprint;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static BugResponse fromBug(Bug bug) {
        if (bug == null) {
            return null;
        }

        return new BugResponse(
                bug.getId(),
                bug.getTitle(),
                bug.getDescription(),
                bug.getPriority().name(),
                bug.getSeverity().name(),
                bug.getStatus().name(),
                UserResponse.fromUser(bug.getAssignee()),
                UserResponse.fromUser(bug.getReporter()),
                bug.getProject().getId(),
                SprintResponse.fromSprint(bug.getSprint()),
                bug.getCreatedAt(),
                bug.getUpdatedAt()
        );
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public UserResponse getAssignee() {
        return assignee;
    }

    public void setAssignee(UserResponse assignee) {
        this.assignee = assignee;
    }

    public UserResponse getReporter() {
        return reporter;
    }

    public void setReporter(UserResponse reporter) {
        this.reporter = reporter;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public SprintResponse getSprint() {
        return sprint;
    }

    public void setSprint(SprintResponse sprint) {
        this.sprint = sprint;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
