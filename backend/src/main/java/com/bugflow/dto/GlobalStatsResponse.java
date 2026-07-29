package com.bugflow.dto;

public class GlobalStatsResponse {

    private long totalProjects;
    private long totalUsers;
    private long totalBugs;

    public GlobalStatsResponse() {
    }

    public GlobalStatsResponse(long totalProjects, long totalUsers, long totalBugs) {
        this.totalProjects = totalProjects;
        this.totalUsers = totalUsers;
        this.totalBugs = totalBugs;
    }

    public long getTotalProjects() {
        return totalProjects;
    }

    public void setTotalProjects(long totalProjects) {
        this.totalProjects = totalProjects;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalBugs() {
        return totalBugs;
    }

    public void setTotalBugs(long totalBugs) {
        this.totalBugs = totalBugs;
    }
}
