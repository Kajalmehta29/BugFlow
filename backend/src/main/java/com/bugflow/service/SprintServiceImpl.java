package com.bugflow.service;

import com.bugflow.dto.SprintRequest;
import com.bugflow.dto.SprintResponse;
import com.bugflow.exception.BadRequestException;
import com.bugflow.exception.ResourceNotFoundException;
import com.bugflow.model.*;
import com.bugflow.repository.BugRepository;
import com.bugflow.repository.ProjectRepository;
import com.bugflow.repository.SprintRepository;
import com.bugflow.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SprintServiceImpl implements SprintService {

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final BugRepository bugRepository;

    public SprintServiceImpl(SprintRepository sprintRepository, 
                             ProjectRepository projectRepository, 
                             UserRepository userRepository,
                             BugRepository bugRepository) {
        this.sprintRepository = sprintRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.bugRepository = bugRepository;
    }

    private void validateManagerOrAdmin(Project project, User user) {
        if (user.getRole() != UserRole.ADMIN && !project.getManager().getId().equals(user.getId())) {
            throw new BadRequestException("Access denied: Only the project manager or an Admin can manage sprints");
        }
    }

    @Override
    @Transactional
    public SprintResponse createSprint(Long projectId, SprintRequest request, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateManagerOrAdmin(project, currentUser);

        Sprint sprint = Sprint.builder()
                .name(request.getName())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(SprintStatus.PLANNED)
                .project(project)
                .build();

        Sprint savedSprint = sprintRepository.save(sprint);
        return SprintResponse.fromSprint(savedSprint);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SprintResponse> getSprintsForProject(Long projectId, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        // Membership check
        if (currentUser.getRole() != UserRole.ADMIN &&
                !project.getManager().getId().equals(currentUser.getId()) &&
                project.getMembers().stream().noneMatch(member -> member.getId().equals(currentUser.getId()))) {
            throw new BadRequestException("Access denied: You are not a member of this project");
        }

        List<Sprint> sprints = sprintRepository.findByProjectId(projectId);
        return sprints.stream()
                .map(SprintResponse::fromSprint)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {"bugSearch", "dashboardStats", "bugDetails"}, allEntries = true)
    public SprintResponse updateSprintStatus(Long sprintId, String status, String currentUsername) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint not found with ID: " + sprintId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateManagerOrAdmin(sprint.getProject(), currentUser);

        SprintStatus sprintStatus;
        try {
            sprintStatus = SprintStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid status: Allowed values are PLANNED, ACTIVE, COMPLETED");
        }

        sprint.setStatus(sprintStatus);

        // If sprint is started (ACTIVE), transition unfinished bugs (OPEN/ASSIGNED) to IN_PROGRESS
        if (sprintStatus == SprintStatus.ACTIVE) {
            List<Bug> sprintBugs = bugRepository.findBySprintId(sprintId);
            for (Bug bug : sprintBugs) {
                if (bug.getStatus() == BugStatus.OPEN || bug.getStatus() == BugStatus.ASSIGNED) {
                    bug.setStatus(BugStatus.IN_PROGRESS);
                    bugRepository.save(bug);
                }
            }
        }

        // If sprint is marked as COMPLETED, automatically transition all unfinished bugs to RESOLVED
        if (sprintStatus == SprintStatus.COMPLETED) {
            List<Bug> sprintBugs = bugRepository.findBySprintId(sprintId);
            for (Bug bug : sprintBugs) {
                if (bug.getStatus() != BugStatus.RESOLVED && bug.getStatus() != BugStatus.CLOSED) {
                    bug.setStatus(BugStatus.RESOLVED);
                    bugRepository.save(bug);
                }
            }
        }

        Sprint savedSprint = sprintRepository.save(sprint);
        return SprintResponse.fromSprint(savedSprint);
    }
}
