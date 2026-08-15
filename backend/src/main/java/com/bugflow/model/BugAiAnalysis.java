package com.bugflow.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bug_ai_analyses")
public class BugAiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bug_id", unique = true, nullable = false)
    private Bug bug;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "suggested_severity", length = 50)
    private String suggestedSeverity;

    @Column(name = "suggested_priority", length = 50)
    private String suggestedPriority;

    @Column(name = "component", length = 100)
    private String component;

    @Column(name = "keywords", columnDefinition = "TEXT")
    private String keywords; // Comma-separated list of keywords

    @Column(name = "summary_title", length = 200)
    private String summaryTitle;

    @Column(name = "problem_summary", columnDefinition = "TEXT")
    private String problemSummary;

    @Column(name = "expected_behavior", columnDefinition = "TEXT")
    private String expectedBehavior;

    @Column(name = "actual_behavior", columnDefinition = "TEXT")
    private String actualBehavior;

    @Column(name = "steps_to_reproduce", columnDefinition = "TEXT")
    private String stepsToReproduce;

    @Column(name = "technical_details", columnDefinition = "TEXT")
    private String technicalDetails;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "code_fix_suggestion", columnDefinition = "TEXT")
    private String codeFixSuggestion;

    @Column(name = "suggested_assignee", length = 100)
    private String suggestedAssignee;

    @Column(name = "assignee_rationale", columnDefinition = "TEXT")
    private String assigneeRationale;

    @Column(name = "comment_summary", columnDefinition = "TEXT")
    private String commentSummary;

    @Column(name = "qa_test_cases", columnDefinition = "TEXT")
    private String qaTestCases;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public BugAiAnalysis() {
    }

    public BugAiAnalysis(Bug bug) {
        this.bug = bug;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Bug getBug() {
        return bug;
    }

    public void setBug(Bug bug) {
        this.bug = bug;
    }

    public Long getBugId() {
        return bug != null ? bug.getId() : null;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getSuggestedSeverity() {
        return suggestedSeverity;
    }

    public void setSuggestedSeverity(String suggestedSeverity) {
        this.suggestedSeverity = suggestedSeverity;
    }

    public String getSuggestedPriority() {
        return suggestedPriority;
    }

    public void setSuggestedPriority(String suggestedPriority) {
        this.suggestedPriority = suggestedPriority;
    }

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public String getSummaryTitle() {
        return summaryTitle;
    }

    public void setSummaryTitle(String summaryTitle) {
        this.summaryTitle = summaryTitle;
    }

    public String getProblemSummary() {
        return problemSummary;
    }

    public void setProblemSummary(String problemSummary) {
        this.problemSummary = problemSummary;
    }

    public String getExpectedBehavior() {
        return expectedBehavior;
    }

    public void setExpectedBehavior(String expectedBehavior) {
        this.expectedBehavior = expectedBehavior;
    }

    public String getActualBehavior() {
        return actualBehavior;
    }

    public void setActualBehavior(String actualBehavior) {
        this.actualBehavior = actualBehavior;
    }

    public String getStepsToReproduce() {
        return stepsToReproduce;
    }

    public void setStepsToReproduce(String stepsToReproduce) {
        this.stepsToReproduce = stepsToReproduce;
    }

    public String getTechnicalDetails() {
        return technicalDetails;
    }

    public void setTechnicalDetails(String technicalDetails) {
        this.technicalDetails = technicalDetails;
    }

    public String getRootCause() {
        return rootCause;
    }

    public void setRootCause(String rootCause) {
        this.rootCause = rootCause;
    }

    public String getCodeFixSuggestion() {
        return codeFixSuggestion;
    }

    public void setCodeFixSuggestion(String codeFixSuggestion) {
        this.codeFixSuggestion = codeFixSuggestion;
    }

    public String getSuggestedAssignee() {
        return suggestedAssignee;
    }

    public void setSuggestedAssignee(String suggestedAssignee) {
        this.suggestedAssignee = suggestedAssignee;
    }

    public String getAssigneeRationale() {
        return assigneeRationale;
    }

    public void setAssigneeRationale(String assigneeRationale) {
        this.assigneeRationale = assigneeRationale;
    }

    public String getCommentSummary() {
        return commentSummary;
    }

    public void setCommentSummary(String commentSummary) {
        this.commentSummary = commentSummary;
    }

    public String getQaTestCases() {
        return qaTestCases;
    }

    public void setQaTestCases(String qaTestCases) {
        this.qaTestCases = qaTestCases;
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
