package com.bugflow.service.ai;

import org.springframework.stereotype.Component;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class LocalAiProvider implements AiProvider {

    @Override
    public String generateText(String prompt) {
        if (prompt.contains("classification") || prompt.contains("category") || prompt.contains("suggested_severity")) {
            return generateMockClassification(prompt);
        } else if (prompt.contains("summary") || prompt.contains("expected_behavior") || prompt.contains("actual_behavior")) {
            return generateMockSummary(prompt);
        } else if (prompt.contains("sprint") || prompt.contains("bottleneck") || prompt.contains("imbalance")) {
            return generateMockSprintInsights(prompt);
        }
        return "{\"message\": \"Local AI Fallback active. No suitable handler found.\"}";
    }

    private String generateMockClassification(String prompt) {
        String title = extractValue(prompt, "Title:");
        String description = extractValue(prompt, "Description:");
        String combined = (title + " " + description).toLowerCase();

        String category = "General";
        String component = "Core / Backend";
        String keywords = "[\"issue\", \"bug\"]";

        if (combined.contains("login") || combined.contains("jwt") || combined.contains("auth") || combined.contains("session") || combined.contains("password") || combined.contains("token")) {
            category = "Authentication";
            component = "Authentication Module";
            keywords = "[\"auth\", \"session\", \"token\", \"security\"]";
        } else if (combined.contains("database") || combined.contains("sql") || combined.contains("postgres") || combined.contains("redis") || combined.contains("query") || combined.contains("connection")) {
            category = "Database";
            component = "Database Layer";
            keywords = "[\"database\", \"postgresql\", \"query\", \"redis\"]";
        } else if (combined.contains("ui") || combined.contains("css") || combined.contains("layout") || combined.contains("button") || combined.contains("screen") || combined.contains("align") || combined.contains("view") || combined.contains("dashboard")) {
            category = "User Interface";
            component = "Frontend Client";
            keywords = "[\"ui\", \"layout\", \"frontend\", \"react\"]";
        } else if (combined.contains("performance") || combined.contains("slow") || combined.contains("leak") || combined.contains("memory") || combined.contains("timeout") || combined.contains("speed")) {
            category = "Performance";
            component = "Core Server";
            keywords = "[\"performance\", \"latency\", \"memory-leak\"]";
        }

        String severity = "LOW";
        String priority = "LOW";
        if (combined.contains("crash") || combined.contains("blocker") || combined.contains("break") || combined.contains("critical") || combined.contains("security") || combined.contains("exploit")) {
            severity = "CRITICAL";
            priority = "CRITICAL";
        } else if (combined.contains("fail") || combined.contains("error") || combined.contains("bug") || combined.contains("prevent") || combined.contains("nullpointer")) {
            severity = "HIGH";
            priority = "HIGH";
        } else if (combined.contains("warning") || combined.contains("incorrect") || combined.contains("wrong") || combined.contains("issue")) {
            severity = "MEDIUM";
            priority = "MEDIUM";
        }

        return String.format(
            "{\n" +
            "  \"category\": \"%s\",\n" +
            "  \"severity\": \"%s\",\n" +
            "  \"priority\": \"%s\",\n" +
            "  \"component\": \"%s\",\n" +
            "  \"keywords\": %s\n" +
            "}", category, severity, priority, component, keywords
        );
    }

    private String generateMockSummary(String prompt) {
        String title = extractValue(prompt, "Title:");
        String description = extractValue(prompt, "Description:");

        String shortTitle = title.length() > 60 ? title.substring(0, 57) + "..." : title;
        String problemSummary = description.length() > 200 ? description.substring(0, 197) + "..." : description;

        return String.format(
            "{\n" +
            "  \"summaryTitle\": \"AI Summary: %s\",\n" +
            "  \"problemSummary\": \"%s\",\n" +
            "  \"expectedBehavior\": \"The system should process requests correctly without raising unexpected exceptions or failures.\",\n" +
            "  \"actualBehavior\": \"The application fails or behaves incorrectly as reported: '%s'\",\n" +
            "  \"stepsToReproduce\": \"1. Navigate to the affected module.\\n2. Trigger the action that causes: '%s'\\n3. Verify if error/behavior is reproduced.\",\n" +
            "  \"technicalDetails\": \"Analyzed offline using local heuristics rules engine. No external AI keys configured.\"\n" +
            "}", shortTitle.replace("\"", "\\\""), problemSummary.replace("\"", "\\\""), title.replace("\"", "\\\""), title.replace("\"", "\\\"")
        );
    }

    private String generateMockSprintInsights(String prompt) {
        return "### 🤖 AI Sprint Insights (Local Simulator)\n\n" +
               "**Sprint Status Overview**:\n" +
               "- The current sprint has unresolved tasks. A local workload analysis has been performed.\n\n" +
               "**Potential Bottlenecks & Risks**:\n" +
               "- **Resource Concentration**: Multiple high-severity issues are assigned to a single developer, which may cause a delay.\n" +
               "- **Unassigned Issues**: There are open issues in the sprint backlog that lack an assignee.\n\n" +
               "**Recommendations**:\n" +
               "1. Redistribute high-priority tickets to test and dev members to balance the load.\n" +
               "2. Verify status transitions and ensure resolved issues are closed.";
    }

    private String extractValue(String text, String prefix) {
        Pattern pattern = Pattern.compile(prefix + "\\s*(.*)");
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return "";
    }
}
