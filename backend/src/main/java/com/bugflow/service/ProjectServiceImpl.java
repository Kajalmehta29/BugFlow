package com.bugflow.service;

import com.bugflow.dto.ProjectRequest;
import com.bugflow.dto.ProjectResponse;
import com.bugflow.exception.BadRequestException;
import com.bugflow.exception.ResourceNotFoundException;
import com.bugflow.model.Project;
import com.bugflow.model.ProjectStatus;
import com.bugflow.model.User;
import com.bugflow.model.UserRole;
import com.bugflow.repository.ProjectRepository;
import com.bugflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public ProjectServiceImpl(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ProjectResponse createProject(ProjectRequest request, String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        if (currentUser.getRole() != UserRole.ADMIN && currentUser.getRole() != UserRole.PROJECT_MANAGER) {
            throw new BadRequestException("Only Admins and Project Managers can create projects");
        }

        if (projectRepository.existsByKey(request.getKey())) {
            throw new BadRequestException("Project Key '" + request.getKey() + "' is already in use");
        }

        User manager = currentUser;
        if (currentUser.getRole() == UserRole.ADMIN && request.getManagerId() != null) {
            manager = userRepository.findById(request.getManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assigned manager not found with ID: " + request.getManagerId()));
            if (manager.getRole() != UserRole.PROJECT_MANAGER && manager.getRole() != UserRole.ADMIN) {
                throw new BadRequestException("Assigned manager must be a Project Manager or Admin");
            }
        }

        Project project = Project.builder()
                .name(request.getName())
                .key(request.getKey().toUpperCase())
                .description(request.getDescription())
                .manager(manager)
                .build();

        // The manager is implicitly a member of the project
        project.getMembers().add(manager);

        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromProject(savedProject);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectResponse> getProjectsForUser(String currentUsername) {
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        List<Project> projects;
        if (currentUser.getRole() == UserRole.ADMIN) {
            projects = projectRepository.findAll();
        } else {
            projects = projectRepository.findProjectsByUserId(currentUser.getId());
        }

        return projects.stream()
                .map(ProjectResponse::fromProject)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id, String currentUsername) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + id));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        if (currentUser.getRole() != UserRole.ADMIN &&
                !project.getManager().getId().equals(currentUser.getId()) &&
                project.getMembers().stream().noneMatch(member -> member.getId().equals(currentUser.getId()))) {
            throw new BadRequestException("Access denied: You are not a member or manager of this project");
        }

        return ProjectResponse.fromProject(project);
    }

    @Override
    @Transactional
    public ProjectResponse addMemberToProject(Long projectId, Long userId, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        // Validation: Only manager or Admin can add members
        if (currentUser.getRole() != UserRole.ADMIN && !project.getManager().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Access denied: Only the project manager or an Admin can manage members");
        }

        User userToAdd = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User to add not found with ID: " + userId));

        project.getMembers().add(userToAdd);
        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromProject(savedProject);
    }

    @Override
    @Transactional
    public ProjectResponse removeMemberFromProject(Long projectId, Long userId, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        // Validation: Only manager or Admin can remove members
        if (currentUser.getRole() != UserRole.ADMIN && !project.getManager().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Access denied: Only the project manager or an Admin can manage members");
        }

        User userToRemove = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User to remove not found with ID: " + userId));

        // Prevent removing the project manager
        if (project.getManager().getId().equals(userId)) {
            throw new BadRequestException("Cannot remove the Project Manager from the project");
        }

        project.getMembers().remove(userToRemove);
        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromProject(savedProject);
    }

    @Override
    @Transactional
    public ProjectResponse updateProjectStatus(Long projectId, String status, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        if (currentUser.getRole() != UserRole.ADMIN && !project.getManager().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Access denied: Only the project manager or an Admin can manage project status");
        }

        ProjectStatus projectStatus;
        try {
            projectStatus = ProjectStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid status: Allowed values are ACTIVE, COMPLETED");
        }

        project.setStatus(projectStatus);
        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromProject(savedProject);
    }

    @Override
    @Transactional
    public ProjectResponse updateProject(Long projectId, com.bugflow.dto.ProjectUpdateRequest request, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with ID: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        if (currentUser.getRole() != UserRole.ADMIN && !project.getManager().getId().equals(currentUser.getId())) {
            throw new BadRequestException("Access denied: Only the project manager or an Admin can manage project settings");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setDomainUrl(request.getDomainUrl());
        project.setResourceLinks(request.getResourceLinks());

        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromProject(savedProject);
    }
}
