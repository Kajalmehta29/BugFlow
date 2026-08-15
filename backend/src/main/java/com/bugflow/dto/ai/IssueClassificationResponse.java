package com.bugflow.dto.ai;

import java.util.List;

public class IssueClassificationResponse {
    private String category;
    private String severity;
    private String priority;
    private String component;
    private List<String> keywords;

    public IssueClassificationResponse() {
    }

    public IssueClassificationResponse(String category, String severity, String priority, String component, List<String> keywords) {
        this.category = category;
        this.severity = severity;
        this.priority = priority;
        this.component = component;
        this.keywords = keywords;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public List<String> getKeywords() {
        return keywords;
    }

    public void setKeywords(List<String> keywords) {
        this.keywords = keywords;
    }
}
