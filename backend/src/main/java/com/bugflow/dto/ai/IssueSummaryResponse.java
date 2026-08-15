package com.bugflow.dto.ai;

public class IssueSummaryResponse {
    private String summaryTitle;
    private String problemSummary;
    private String expectedBehavior;
    private String actualBehavior;
    private String stepsToReproduce;
    private String technicalDetails;

    public IssueSummaryResponse() {
    }

    public IssueSummaryResponse(String summaryTitle, String problemSummary, String expectedBehavior, String actualBehavior, String stepsToReproduce, String technicalDetails) {
        this.summaryTitle = summaryTitle;
        this.problemSummary = problemSummary;
        this.expectedBehavior = expectedBehavior;
        this.actualBehavior = actualBehavior;
        this.stepsToReproduce = stepsToReproduce;
        this.technicalDetails = technicalDetails;
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
}
