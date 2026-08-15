package com.bugflow.controller;

import com.bugflow.dto.ai.*;
import com.bugflow.model.BugAiAnalysis;
import com.bugflow.service.ai.AiIssueService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1")
public class AiIssueController {

    private final AiIssueService aiIssueService;

    public AiIssueController(AiIssueService aiIssueService) {
        this.aiIssueService = aiIssueService;
    }

    @PostMapping("/bugs/ai/analyze-draft")
    public ResponseEntity<AiIssueAnalysisResponse> analyzeDraft(@RequestBody AiDraftRequest request,
                                                                @AuthenticationPrincipal UserDetails userDetails) {
        AiIssueAnalysisResponse response = aiIssueService.analyzeDraft(
                request.getTitle(),
                request.getDescription(),
                request.getProjectId()
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bugs/{id}/ai/analysis")
    public ResponseEntity<BugAiAnalysis> getBugAiAnalysis(@PathVariable Long id,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        BugAiAnalysis response = aiIssueService.getOrAnalyzeBug(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/ai/analyze")
    public ResponseEntity<BugAiAnalysis> analyzeBug(@PathVariable Long id,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        BugAiAnalysis response = aiIssueService.reanalyzeBug(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/ai/code-fix")
    public ResponseEntity<BugAiAnalysis> generateCodeFix(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        BugAiAnalysis response = aiIssueService.generateCodeFix(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/ai/suggest-assignee")
    public ResponseEntity<BugAiAnalysis> suggestAssignee(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        BugAiAnalysis response = aiIssueService.suggestAssignee(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/ai/comments-summary")
    public ResponseEntity<BugAiAnalysis> summarizeComments(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        BugAiAnalysis response = aiIssueService.summarizeComments(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/ai/test-cases")
    public ResponseEntity<BugAiAnalysis> generateQaTestCases(@PathVariable Long id,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        BugAiAnalysis response = aiIssueService.generateQaTestCases(id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/ai/duplicates")
    public ResponseEntity<List<DuplicateIssueResponse>> findDuplicates(@PathVariable Long id,
                                                                       @RequestParam Long projectId,
                                                                       @RequestParam String title,
                                                                       @RequestParam String description,
                                                                       @AuthenticationPrincipal UserDetails userDetails) {
        List<DuplicateIssueResponse> response = aiIssueService.findDuplicates(id, title, description, projectId, 0.80);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/ai/summarize")
    public ResponseEntity<BugAiAnalysis> summarizeBug(@PathVariable Long id,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        // Summarize is handled as part of the re-analysis
        BugAiAnalysis response = aiIssueService.reanalyzeBug(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sprints/{sprintId}/ai/insights")
    public ResponseEntity<StringResponse> getSprintInsights(@PathVariable Long sprintId,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        String insights = aiIssueService.getSprintInsights(sprintId);
        return ResponseEntity.ok(new StringResponse(insights));
    }

    // Helper classes for request/response serialization
    public static class AiDraftRequest {
        private Long projectId;
        private String title;
        private String description;

        public AiDraftRequest() {}

        public Long getProjectId() { return projectId; }
        public void setProjectId(Long projectId) { this.projectId = projectId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class StringResponse {
        private String content;

        public StringResponse(String content) {
            this.content = content;
        }

        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
    }
}
