package com.bugflow.dto;

import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {

    private long totalBugs;
    private Map<String, Long> bugsByStatus;
    private Map<String, Long> bugsByPriority;
    private List<DevWorkload> devWorkload;
    private double averageResolutionTimeHours;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(long totalBugs, Map<String, Long> bugsByStatus, Map<String, Long> bugsByPriority,
                                  List<DevWorkload> devWorkload, double averageResolutionTimeHours) {
        this.totalBugs = totalBugs;
        this.bugsByStatus = bugsByStatus;
        this.bugsByPriority = bugsByPriority;
        this.devWorkload = devWorkload;
        this.averageResolutionTimeHours = averageResolutionTimeHours;
    }

    // Getters and Setters
    public long getTotalBugs() {
        return totalBugs;
    }

    public void setTotalBugs(long totalBugs) {
        this.totalBugs = totalBugs;
    }

    public Map<String, Long> getBugsByStatus() {
        return bugsByStatus;
    }

    public void setBugsByStatus(Map<String, Long> bugsByStatus) {
        this.bugsByStatus = bugsByStatus;
    }

    public Map<String, Long> getBugsByPriority() {
        return bugsByPriority;
    }

    public void setBugsByPriority(Map<String, Long> bugsByPriority) {
        this.bugsByPriority = bugsByPriority;
    }

    public List<DevWorkload> getDevWorkload() {
        return devWorkload;
    }

    public void setDevWorkload(List<DevWorkload> devWorkload) {
        this.devWorkload = devWorkload;
    }

    public double getAverageResolutionTimeHours() {
        return averageResolutionTimeHours;
    }

    public void setAverageResolutionTimeHours(double averageResolutionTimeHours) {
        this.averageResolutionTimeHours = averageResolutionTimeHours;
    }

    public static class DevWorkload {
        private String username;
        private long bugCount;

        public DevWorkload() {
        }

        public DevWorkload(String username, long bugCount) {
            this.username = username;
            this.bugCount = bugCount;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public long getBugCount() {
            return bugCount;
        }

        public void setBugCount(long bugCount) {
            this.bugCount = bugCount;
        }
    }
}
