package com.bugflow.dto;

import com.bugflow.model.Project;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public class ProjectResponse {

    private Long id;
    private String name;
    private String key;
    private String description;
    private UserResponse manager;
    private Set<UserResponse> members;
    private String status;
    private LocalDateTime createdAt;
    private String domainUrl;
    private String resourceLinks;

    public ProjectResponse() {
    }

    public ProjectResponse(Long id, String name, String key, String description, UserResponse manager, Set<UserResponse> members, LocalDateTime createdAt, String status, String domainUrl, String resourceLinks) {
        this.id = id;
        this.name = name;
        this.key = key;
        this.description = description;
        this.manager = manager;
        this.members = members;
        this.createdAt = createdAt;
        this.status = status;
        this.domainUrl = domainUrl;
        this.resourceLinks = resourceLinks;
    }

    public static ProjectResponse fromProject(Project project) {
        if (project == null) {
            return null;
        }

        Set<UserResponse> memberResponses = null;
        if (project.getMembers() != null) {
            memberResponses = project.getMembers().stream()
                    .map(UserResponse::fromUser)
                    .collect(Collectors.toSet());
        }

        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getKey(),
                project.getDescription(),
                UserResponse.fromUser(project.getManager()),
                memberResponses,
                project.getCreatedAt(),
                project.getStatus() != null ? project.getStatus().name() : "ACTIVE",
                project.getDomainUrl(),
                project.getResourceLinks()
        );
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public UserResponse getManager() {
        return manager;
    }

    public void setManager(UserResponse manager) {
        this.manager = manager;
    }

    public Set<UserResponse> getMembers() {
        return members;
    }

    public void setMembers(Set<UserResponse> members) {
        this.members = members;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDomainUrl() {
        return domainUrl;
    }

    public void setDomainUrl(String domainUrl) {
        this.domainUrl = domainUrl;
    }

    public String getResourceLinks() {
        return resourceLinks;
    }

    public void setResourceLinks(String resourceLinks) {
        this.resourceLinks = resourceLinks;
    }
}
