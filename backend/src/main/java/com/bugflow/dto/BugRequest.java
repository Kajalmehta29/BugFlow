package com.bugflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class BugRequest {

    @NotBlank
    @Size(max = 150)
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String priority; // "LOW", "MEDIUM", "HIGH", "CRITICAL"

    @NotBlank
    private String severity; // "LOW", "MEDIUM", "HIGH", "CRITICAL"

    private Long assigneeId;

    @NotNull
    private Long projectId;

    private Long sprintId;

    // Constructors
    public BugRequest() {
    }

    public BugRequest(String title, String description, String priority, String severity, Long assigneeId, Long projectId, Long sprintId) {
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.severity = severity;
        this.assigneeId = assigneeId;
        this.projectId = projectId;
        this.sprintId = sprintId;
    }

    // Getters and Setters
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

    public Long getAssigneeId() {
        return assigneeId;
    }

    public void setAssigneeId(Long assigneeId) {
        this.assigneeId = assigneeId;
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public Long getSprintId() {
        return sprintId;
    }

    public void setSprintId(Long sprintId) {
        this.sprintId = sprintId;
    }
}
