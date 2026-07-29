package com.bugflow.controller;

import com.bugflow.dto.DashboardStatsResponse;
import com.bugflow.dto.GlobalStatsResponse;
import com.bugflow.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(@RequestParam Long projectId,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        DashboardStatsResponse response = dashboardService.getDashboardStats(projectId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/global-stats")
    public ResponseEntity<GlobalStatsResponse> getGlobalStats() {
        GlobalStatsResponse response = dashboardService.getGlobalStats();
        return ResponseEntity.ok(response);
    }
}
