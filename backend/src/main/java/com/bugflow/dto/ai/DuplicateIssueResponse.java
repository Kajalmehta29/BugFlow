package com.bugflow.dto.ai;

public class DuplicateIssueResponse {
    private Long id;
    private String title;
    private double similarity;
    private String status;

    public DuplicateIssueResponse() {
    }

    public DuplicateIssueResponse(Long id, String title, double similarity, String status) {
        this.id = id;
        this.title = title;
        this.similarity = similarity;
        this.status = status;
    }

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

    public double getSimilarity() {
        return similarity;
    }

    public void setSimilarity(double similarity) {
        this.similarity = similarity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
