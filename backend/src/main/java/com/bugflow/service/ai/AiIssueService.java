package com.bugflow.service.ai;

import com.bugflow.dto.ai.*;
import com.bugflow.model.*;
import com.bugflow.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import jakarta.annotation.PostConstruct;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiIssueService {

    private final BugRepository bugRepository;
    private final BugEmbeddingRepository bugEmbeddingRepository;
    private final BugAiAnalysisRepository bugAiAnalysisRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final GeminiAiProvider geminiAiProvider;
    private final LocalAiProvider localAiProvider;
    private final ObjectMapper objectMapper;

    private AllMiniLmL6V2EmbeddingModel embeddingModel;
    private boolean isEmbeddingModelReady = false;

    public AiIssueService(BugRepository bugRepository,
                           BugEmbeddingRepository bugEmbeddingRepository,
                           BugAiAnalysisRepository bugAiAnalysisRepository,
                           ProjectRepository projectRepository,
                           SprintRepository sprintRepository,
                           GeminiAiProvider geminiAiProvider,
                           LocalAiProvider localAiProvider,
                           ObjectMapper objectMapper) {
        this.bugRepository = bugRepository;
        this.bugEmbeddingRepository = bugEmbeddingRepository;
        this.bugAiAnalysisRepository = bugAiAnalysisRepository;
        this.projectRepository = projectRepository;
        this.sprintRepository = sprintRepository;
        this.geminiAiProvider = geminiAiProvider;
        this.localAiProvider = localAiProvider;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            // Load the ONNX model in JVM (runs locally on device, 100% free)
            this.embeddingModel = new AllMiniLmL6V2EmbeddingModel();
            this.isEmbeddingModelReady = true;
        } catch (Exception e) {
            System.err.println("[AiIssueService] Failed to load local ONNX sentence-transformer embedding model. Fallback active. Error: " + e.getMessage());
        }
    }

    private AiProvider getActiveAiProvider() {
        if (geminiAiProvider.isConfigured()) {
            return geminiAiProvider;
        }
        return localAiProvider;
    }

    /**
     * Compute 384-dimensional embedding for text locally.
     */
    public double[] getEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new double[384];
        }
        if (!isEmbeddingModelReady) {
            // Fallback: simple deterministic hash vector if JVM fails to load ONNX
            double[] fallbackVector = new double[384];
            int hash = text.hashCode();
            for (int i = 0; i < 384; i++) {
                fallbackVector[i] = Math.sin(hash + i);
            }
            return fallbackVector;
        }
        try {
            float[] floatVector = embeddingModel.embed(text).content().vector();
            double[] doubleVector = new double[floatVector.length];
            for (int i = 0; i < floatVector.length; i++) {
                doubleVector[i] = floatVector[i];
            }
            return doubleVector;
        } catch (Exception e) {
            System.err.println("[AiIssueService] Embedding generation failed: " + e.getMessage());
            return new double[384];
        }
    }

    /**
     * Save or update the embedding for a bug.
     */
    @Transactional
    public void saveBugEmbedding(Bug bug) {
        String contentToEmbed = bug.getTitle() + " " + bug.getDescription();
        double[] vector = getEmbedding(contentToEmbed);

        BugEmbedding bugEmbedding = bugEmbeddingRepository.findByBugId(bug.getId())
                .orElse(new BugEmbedding(bug, vector, "all-MiniLM-L6-v2"));
        bugEmbedding.setEmbedding(vector);
        bugEmbedding.setUpdatedAt(LocalDateTime.now());
        bugEmbeddingRepository.save(bugEmbedding);
    }

    /**
     * Calculate cosine similarity between two vectors.
     */
    public double cosineSimilarity(double[] vectorA, double[] vectorB) {
        if (vectorA == null || vectorB == null || vectorA.length != vectorB.length) {
            return 0.0;
        }
        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;
        for (int i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            normA += Math.pow(vectorA[i], 2);
            normB += Math.pow(vectorB[i], 2);
        }
        if (normA == 0.0 || normB == 0.0) {
            return 0.0;
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    /**
     * Find semantically similar issues in the same project.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "duplicateDetections", key = "#bugId == null ? 'draft-' + #title.hashCode() + '-' + #projectId : #bugId")
    public List<DuplicateIssueResponse> findDuplicates(Long bugId, String title, String description, Long projectId, double similarityThreshold) {
        String contentToEmbed = title + " " + description;
        double[] targetVector = getEmbedding(contentToEmbed);

        List<BugEmbedding> projectEmbeddings = bugEmbeddingRepository.findAllByProjectId(projectId);
        List<DuplicateIssueResponse> duplicates = new ArrayList<>();

        for (BugEmbedding current : projectEmbeddings) {
            // Do not match the bug against itself
            if (bugId != null && current.getBugId().equals(bugId)) {
                continue;
            }

            double similarity = cosineSimilarity(targetVector, current.getEmbedding());
            if (similarity >= similarityThreshold) {
                Bug bug = current.getBug();
                duplicates.add(new DuplicateIssueResponse(
                        bug.getId(),
                        bug.getTitle(),
                        similarity,
                        bug.getStatus().name()
                ));
            }
        }

        // Sort descending by similarity
        duplicates.sort((a, b) -> Double.compare(b.getSimilarity(), a.getSimilarity()));
        
        // Limit to top 5
        return duplicates.stream().limit(5).collect(Collectors.toList());
    }

    /**
     * Generate classification suggestions for a draft issue.
     */
    public IssueClassificationResponse suggestClassification(String title, String description) {
        String prompt = String.format(
                "You are an AI issue intelligence assistant. Analyze this bug report. " +
                "Respond ONLY with a valid JSON object matching this schema:\n" +
                "{\n" +
                "  \"category\": \"Suggested category name (e.g. Authentication, Database, UI, Performance)\",\n" +
                "  \"severity\": \"LOW, MEDIUM, HIGH, or CRITICAL\",\n" +
                "  \"priority\": \"LOW, MEDIUM, HIGH, or CRITICAL\",\n" +
                "  \"component\": \"Suggested project component (e.g. Login Screen, DB queries)\",\n" +
                "  \"keywords\": [\"keyword1\", \"keyword2\"]\n" +
                "}\n" +
                "Do NOT add any markdown formatting (like ```json), commentary, or extra text. Just raw JSON.\n\n" +
                "Title: %s\n" +
                "Description: %s\n",
                title, description
        );

        try {
            String rawJson = getActiveAiProvider().generateText(prompt);
            // Clean up possible markdown code blocks if the LLM ignored instructions
            rawJson = cleanJsonString(rawJson);
            return objectMapper.readValue(rawJson, IssueClassificationResponse.class);
        } catch (Exception e) {
            System.err.println("[AiIssueService] Suggest classification failed, falling back to local: " + e.getMessage());
            try {
                String rawJson = localAiProvider.generateText(prompt);
                return objectMapper.readValue(rawJson, IssueClassificationResponse.class);
            } catch (Exception ex) {
                return new IssueClassificationResponse("General", "MEDIUM", "MEDIUM", "Core", Arrays.asList("bug"));
            }
        }
    }

    /**
     * Generate structured summary for a draft issue.
     */
    public IssueSummaryResponse suggestSummary(String title, String description) {
        String prompt = String.format(
                "You are an AI bug tracking assistant. Generate a structured summary for this report. " +
                "Respond ONLY with a valid JSON object matching this schema:\n" +
                "{\n" +
                "  \"summaryTitle\": \"Short title\",\n" +
                "  \"problemSummary\": \"Brief description of the problem\",\n" +
                "  \"expectedBehavior\": \"What should have happened\",\n" +
                "  \"actualBehavior\": \"What actually happened\",\n" +
                "  \"stepsToReproduce\": \"Numbered steps to reproduce the issue\",\n" +
                "  \"technicalDetails\": \"Important technical context, e.g. stack traces, endpoints, browsers\"\n" +
                "}\n" +
                "Do NOT add any markdown formatting, commentary, or extra text. Just raw JSON.\n\n" +
                "Title: %s\n" +
                "Description: %s\n",
                title, description
        );

        try {
            String rawJson = getActiveAiProvider().generateText(prompt);
            rawJson = cleanJsonString(rawJson);
            return objectMapper.readValue(rawJson, IssueSummaryResponse.class);
        } catch (Exception e) {
            System.err.println("[AiIssueService] Suggest summary failed, falling back to local: " + e.getMessage());
            try {
                String rawJson = localAiProvider.generateText(prompt);
                return objectMapper.readValue(rawJson, IssueSummaryResponse.class);
            } catch (Exception ex) {
                return new IssueSummaryResponse("Summary: " + title, description, "Expected correct behavior", "Fails as reported", "Refer to description", "None");
            }
        }
    }

    /**
     * Analyze a draft issue prior to creation.
     */
    public AiIssueAnalysisResponse analyzeDraft(String title, String description, Long projectId) {
        IssueClassificationResponse classification = suggestClassification(title, description);
        List<DuplicateIssueResponse> duplicates = findDuplicates(null, title, description, projectId, 0.75);
        IssueSummaryResponse summary = suggestSummary(title, description);

        return new AiIssueAnalysisResponse(classification, duplicates, summary);
    }

    /**
     * Fetch existing AI analysis or trigger it.
     */
    @Transactional
    @Cacheable(value = "aiAnalysis", key = "#bugId")
    public BugAiAnalysis getOrAnalyzeBug(Long bugId) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new NoSuchElementException("Bug not found: " + bugId));

        return bugAiAnalysisRepository.findByBugId(bugId)
                .orElseGet(() -> analyzeAndSaveBug(bug));
    }

    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "aiAnalysis", key = "#bugId"),
        @CacheEvict(value = "duplicateDetections", key = "#bugId")
    })
    public BugAiAnalysis reanalyzeBug(Long bugId) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new NoSuchElementException("Bug not found: " + bugId));
        return analyzeAndSaveBug(bug);
    }

    private BugAiAnalysis analyzeAndSaveBug(Bug bug) {
        // Compute and store embedding first
        saveBugEmbedding(bug);

        IssueClassificationResponse classDTO = suggestClassification(bug.getTitle(), bug.getDescription());
        IssueSummaryResponse sumDTO = suggestSummary(bug.getTitle(), bug.getDescription());

        BugAiAnalysis analysis = bugAiAnalysisRepository.findByBugId(bug.getId())
                .orElse(new BugAiAnalysis(bug));

        analysis.setCategory(classDTO.getCategory());
        analysis.setSuggestedSeverity(classDTO.getSeverity());
        analysis.setSuggestedPriority(classDTO.getPriority());
        analysis.setComponent(classDTO.getComponent());
        if (classDTO.getKeywords() != null) {
            analysis.setKeywords(String.join(",", classDTO.getKeywords()));
        }

        analysis.setSummaryTitle(sumDTO.getSummaryTitle());
        analysis.setProblemSummary(sumDTO.getProblemSummary());
        analysis.setExpectedBehavior(sumDTO.getExpectedBehavior());
        analysis.setActualBehavior(sumDTO.getActualBehavior());
        analysis.setStepsToReproduce(sumDTO.getStepsToReproduce());
        analysis.setTechnicalDetails(sumDTO.getTechnicalDetails());
        analysis.setUpdatedAt(LocalDateTime.now());

        return bugAiAnalysisRepository.save(analysis);
    }

    /**
     * Generate Sprint Insights (bottlenecks, overdue risk, unassigned bugs).
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "sprintInsights", key = "#sprintId")
    public String getSprintInsights(Long sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new NoSuchElementException("Sprint not found: " + sprintId));

        List<Bug> sprintBugs = bugRepository.findBySprintId(sprintId);
        
        long totalBugs = sprintBugs.size();
        long openBugs = sprintBugs.stream().filter(b -> b.getStatus() != BugStatus.RESOLVED && b.getStatus() != BugStatus.CLOSED).count();
        long resolvedBugs = totalBugs - openBugs;
        long criticalBugs = sprintBugs.stream().filter(b -> (b.getSeverity() == BugSeverity.CRITICAL || b.getSeverity() == BugSeverity.HIGH) && b.getStatus() != BugStatus.RESOLVED && b.getStatus() != BugStatus.CLOSED).count();
        long unassignedBugs = sprintBugs.stream().filter(b -> b.getAssignee() == null).count();

        // Workload mapping: Assignee ID -> Active Bugs Count
        Map<String, Integer> developerWorkload = new HashMap<>();
        for (Bug bug : sprintBugs) {
            if (bug.getStatus() != BugStatus.RESOLVED && bug.getStatus() != BugStatus.CLOSED) {
                String devName = bug.getAssignee() != null ? bug.getAssignee().getUsername() : "Unassigned";
                developerWorkload.put(devName, developerWorkload.getOrDefault(devName, 0) + 1);
            }
        }

        // Find standard bottlenecks
        String maxWorkloadDev = "";
        int maxWorkloadCount = 0;
        for (Map.Entry<String, Integer> entry : developerWorkload.entrySet()) {
            if (!entry.getKey().equals("Unassigned") && entry.getValue() > maxWorkloadCount) {
                maxWorkloadCount = entry.getValue();
                maxWorkloadDev = entry.getKey();
            }
        }

        // Construct context for LLM
        StringBuilder context = new StringBuilder();
        context.append(String.format("Sprint Name: %s\n", sprint.getName()));
        context.append(String.format("Sprint Status: %s\n", sprint.getStatus().name()));
        context.append(String.format("Dates: %s to %s\n", sprint.getStartDate(), sprint.getEndDate()));
        context.append(String.format("Metrics: Total issues=%d, Unresolved issues=%d, Resolved issues=%d, Unassigned unresolved=%d, High/Critical unresolved=%d\n",
                totalBugs, openBugs, resolvedBugs, unassignedBugs, criticalBugs));
        context.append("Workload per assignee:\n");
        developerWorkload.forEach((dev, count) -> context.append(String.format("- %s: %d active issues\n", dev, count)));

        String prompt = "You are a professional Agile coach and project manager AI assistant.\n" +
                "Generate a clear, brief, structured Agile Sprint Insight summary report for the development team based on this sprint metrics context:\n\n" +
                context.toString() + "\n" +
                "Structure your response exactly with these sections (using Markdown format):\n" +
                "### 📊 Sprint Health Status\n" +
                "[Brief assessment of the general health of this sprint based on progress vs dates]\n\n" +
                "### ⚠️ Potential Risks & Bottlenecks\n" +
                "-[List any risks, such as workload imbalances, high count of unassigned or high-severity unresolved tickets, or date slipping]\n\n" +
                "### 💡 Recommendations\n" +
                "-[List 2-3 specific, actionable recommendations for project manager or team, like reassigning tickets, focusing on unresolved, or auto-assigning]";

        try {
            return getActiveAiProvider().generateText(prompt);
        } catch (Exception e) {
            System.err.println("[AiIssueService] Generate sprint insights failed, falling back to local: " + e.getMessage());
            return localAiProvider.generateText(prompt);
        }
    }

    private String cleanJsonString(String text) {
        if (text == null) return "";
        String cleaned = text.trim();
        // Remove markdown formatting like ```json ... ```
        if (cleaned.startsWith("```")) {
            int firstLineBreak = cleaned.indexOf("\n");
            int lastBackticks = cleaned.lastIndexOf("```");
            if (firstLineBreak != -1 && lastBackticks != -1 && lastBackticks > firstLineBreak) {
                cleaned = cleaned.substring(firstLineBreak, lastBackticks).trim();
            }
        }
        return cleaned;
    }
}
