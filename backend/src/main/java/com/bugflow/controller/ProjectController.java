package com.bugflow.controller;

import com.bugflow.dto.ProjectRequest;
import com.bugflow.dto.ProjectResponse;
import com.bugflow.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        ProjectResponse response = projectService.createProject(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getProjectsForUser(@AuthenticationPrincipal UserDetails userDetails) {
        List<ProjectResponse> response = projectService.getProjectsForUser(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        ProjectResponse response = projectService.getProjectById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<ProjectResponse> addMemberToProject(@PathVariable Long id,
                                                               @RequestParam Long userId,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        ProjectResponse response = projectService.addMemberToProject(id, userId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<ProjectResponse> removeMemberFromProject(@PathVariable Long id,
                                                                  @PathVariable Long userId,
                                                                  @AuthenticationPrincipal UserDetails userDetails) {
        ProjectResponse response = projectService.removeMemberFromProject(id, userId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
