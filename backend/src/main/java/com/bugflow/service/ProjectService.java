package com.bugflow.service;

import com.bugflow.dto.ProjectRequest;
import com.bugflow.dto.ProjectResponse;

import java.util.List;

public interface ProjectService {
    ProjectResponse createProject(ProjectRequest request, String currentUsername);
    List<ProjectResponse> getProjectsForUser(String currentUsername);
    ProjectResponse getProjectById(Long id, String currentUsername);
    ProjectResponse addMemberToProject(Long projectId, Long userId, String currentUsername);
    ProjectResponse removeMemberFromProject(Long projectId, Long userId, String currentUsername);
    ProjectResponse updateProjectStatus(Long projectId, String status, String currentUsername);
    ProjectResponse updateProject(Long projectId, com.bugflow.dto.ProjectUpdateRequest request, String currentUsername);
}
