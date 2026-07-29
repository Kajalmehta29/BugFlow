package com.bugflow.service;

import com.bugflow.dto.DashboardStatsResponse;
import com.bugflow.dto.DashboardStatsResponse.DevWorkload;
import com.bugflow.dto.GlobalStatsResponse;
import com.bugflow.exception.BadRequestException;
import com.bugflow.exception.ResourceNotFoundException;
import com.bugflow.model.*;
import com.bugflow.repository.BugRepository;
import com.bugflow.repository.ProjectRepository;
import com.bugflow.repository.UserRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final BugRepository bugRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public DashboardServiceImpl(BugRepository bugRepository,
                                ProjectRepository projectRepository,
                                UserRepository userRepository) {
        this.bugRepository = bugRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    private void validateUserMembership(Project project, User user) {
        if (user.getRole() != UserRole.ADMIN &&
                !project.getManager().getId().equals(user.getId()) &&
                project.getMembers().stream().noneMatch(member -> member.getId().equals(user.getId()))) {
            throw new BadRequestException("Access denied: You are not a member of this project");
        }
    }

    @Override
    @Cacheable(value = "dashboardStats", key = "#projectId")
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(Long projectId, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(project, currentUser);

        List<Bug> bugs = bugRepository.findByProjectId(projectId);

        long totalBugs = bugs.size();

        // 1. Group by status (ensure all statuses exist in map with at least 0)
        Map<String, Long> statusMap = Arrays.stream(BugStatus.values())
                .collect(Collectors.toMap(BugStatus::name, status -> 0L));
        bugs.forEach(b -> statusMap.put(b.getStatus().name(), statusMap.get(b.getStatus().name()) + 1));

        // 2. Group by priority (ensure all priorities exist in map with at least 0)
        Map<String, Long> priorityMap = Arrays.stream(BugPriority.values())
                .collect(Collectors.toMap(BugPriority::name, priority -> 0L));
        bugs.forEach(b -> priorityMap.put(b.getPriority().name(), priorityMap.get(b.getPriority().name()) + 1));

        // 3. Developer Workload (assigned bugs count per developer)
        Map<String, Long> workloadMap = bugs.stream()
                .filter(b -> b.getAssignee() != null)
                .collect(Collectors.groupingBy(b -> b.getAssignee().getUsername(), Collectors.counting()));

        List<DevWorkload> workloads = workloadMap.entrySet().stream()
                .map(entry -> new DevWorkload(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());

        // 4. Average resolution time in hours for RESOLVED and CLOSED bugs
        double avgResolutionTime = bugs.stream()
                .filter(b -> b.getStatus() == BugStatus.RESOLVED || b.getStatus() == BugStatus.CLOSED)
                .mapToLong(b -> Duration.between(b.getCreatedAt(), b.getUpdatedAt()).toHours())
                .average()
                .orElse(0.0);

        // Keep it to two decimal places
        avgResolutionTime = Math.round(avgResolutionTime * 100.0) / 100.0;

        return new DashboardStatsResponse(totalBugs, statusMap, priorityMap, workloads, avgResolutionTime);
    }

    @Override
    @Cacheable(value = "dashboardStats", key = "'global'")
    @Transactional(readOnly = true)
    public GlobalStatsResponse getGlobalStats() {
        long totalProjects = projectRepository.count();
        long totalUsers = userRepository.count();
        long totalBugs = bugRepository.count();
        return new GlobalStatsResponse(totalProjects, totalUsers, totalBugs);
    }
}
