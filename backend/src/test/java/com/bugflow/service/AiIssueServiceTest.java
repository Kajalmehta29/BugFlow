package com.bugflow.service;

import com.bugflow.dto.ai.IssueClassificationResponse;
import com.bugflow.dto.ai.IssueSummaryResponse;
import com.bugflow.service.ai.AiIssueService;
import com.bugflow.service.ai.LocalAiProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.junit.jupiter.api.Assertions.*;

public class AiIssueServiceTest {

    private AiIssueService aiIssueService;

    @BeforeEach
    public void setUp() {
        LocalAiProvider localAiProvider = new LocalAiProvider();
        aiIssueService = new AiIssueService(
                Mockito.mock(com.bugflow.repository.BugRepository.class),
                Mockito.mock(com.bugflow.repository.BugEmbeddingRepository.class),
                Mockito.mock(com.bugflow.repository.BugAiAnalysisRepository.class),
                Mockito.mock(com.bugflow.repository.ProjectRepository.class),
                Mockito.mock(com.bugflow.repository.SprintRepository.class),
                Mockito.mock(com.bugflow.service.ai.GeminiAiProvider.class),
                localAiProvider,
                new com.fasterxml.jackson.databind.ObjectMapper(),
                Mockito.mock(com.bugflow.repository.CommentRepository.class)
        );
    }

    @Test
    public void testCosineSimilarity() {
        double[] v1 = {1.0, 0.0, 0.0};
        double[] v2 = {0.0, 1.0, 0.0};
        double[] v3 = {1.0, 1.0, 0.0};

        assertEquals(1.0, aiIssueService.cosineSimilarity(v1, v1), 1e-6);
        assertEquals(0.0, aiIssueService.cosineSimilarity(v1, v2), 1e-6);
        
        double sim = aiIssueService.cosineSimilarity(v1, v3);
        assertEquals(1.0 / Math.sqrt(2.0), sim, 1e-6);
    }

    @Test
    public void testClassificationHeuristics() {
        IssueClassificationResponse authResult = aiIssueService.suggestClassification(
                "Login failure with JWT expiration",
                "The application throws a 401 when token expires."
        );
        assertEquals("Authentication", authResult.getCategory());
        assertEquals("Authentication Module", authResult.getComponent());

        IssueClassificationResponse uiResult = aiIssueService.suggestClassification(
                "Align CSS button on global dashboard",
                "The submit button is shifted left on dashboard view."
        );
        assertEquals("User Interface", uiResult.getCategory());
        assertEquals("Frontend Client", uiResult.getComponent());
    }

    @Test
    public void testSummaryHeuristics() {
        IssueSummaryResponse summary = aiIssueService.suggestSummary(
                "Database connection fails on dashboard load",
                "When loading dashboard page, pgConnection times out after 10 seconds."
        );
        assertNotNull(summary);
        assertTrue(summary.getSummaryTitle().contains("Database connection fails"));
        assertTrue(summary.getProblemSummary().contains("pgConnection times out"));
    }
}
