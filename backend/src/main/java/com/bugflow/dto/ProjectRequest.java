package com.bugflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ProjectRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Size(min = 2, max = 10)
    private String key;

    @Size(max = 500)
    private String description;

    private Long managerId; // Can be set by Admin to assign PM, otherwise defaults to creator

    // Constructors
    public ProjectRequest() {
    }

    public ProjectRequest(String name, String key, String description, Long managerId) {
        this.name = name;
        this.key = key;
        this.description = description;
        this.managerId = managerId;
    }

    // Getters and Setters
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

    public Long getManagerId() {
        return managerId;
    }

    public void setManagerId(Long managerId) {
        this.managerId = managerId;
    }
}
