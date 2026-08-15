package com.bugflow.dto.ai;

public class AssigneeRecommendationResponse {
    private String suggestedAssignee;
    private String assigneeRationale;

    public AssigneeRecommendationResponse() {
    }

    public AssigneeRecommendationResponse(String suggestedAssignee, String assigneeRationale) {
        this.suggestedAssignee = suggestedAssignee;
        this.assigneeRationale = assigneeRationale;
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
}
