package com.bugflow.dto.ai;

import java.util.List;

public class AiIssueAnalysisResponse {
    private IssueClassificationResponse classification;
    private List<DuplicateIssueResponse> duplicates;
    private IssueSummaryResponse summary;

    public AiIssueAnalysisResponse() {
    }

    public AiIssueAnalysisResponse(IssueClassificationResponse classification, List<DuplicateIssueResponse> duplicates, IssueSummaryResponse summary) {
        this.classification = classification;
        this.duplicates = duplicates;
        this.summary = summary;
    }

    public IssueClassificationResponse getClassification() {
        return classification;
    }

    public void setClassification(IssueClassificationResponse classification) {
        this.classification = classification;
    }

    public List<DuplicateIssueResponse> getDuplicates() {
        return duplicates;
    }

    public void setDuplicates(List<DuplicateIssueResponse> duplicates) {
        this.duplicates = duplicates;
    }

    public IssueSummaryResponse getSummary() {
        return summary;
    }

    public void setSummary(IssueSummaryResponse summary) {
        this.summary = summary;
    }
}
