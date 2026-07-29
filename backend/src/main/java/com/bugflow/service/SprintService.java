package com.bugflow.service;

import com.bugflow.dto.SprintRequest;
import com.bugflow.dto.SprintResponse;

import java.util.List;

public interface SprintService {
    SprintResponse createSprint(Long projectId, SprintRequest request, String currentUsername);
    List<SprintResponse> getSprintsForProject(Long projectId, String currentUsername);
    SprintResponse updateSprintStatus(Long sprintId, String status, String currentUsername);
}
