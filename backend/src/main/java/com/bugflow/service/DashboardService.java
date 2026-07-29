package com.bugflow.service;

import com.bugflow.dto.DashboardStatsResponse;
import com.bugflow.dto.GlobalStatsResponse;

public interface DashboardService {
    DashboardStatsResponse getDashboardStats(Long projectId, String currentUsername);
    GlobalStatsResponse getGlobalStats();
}
