package com.bugflow.controller;

import com.bugflow.dto.SprintRequest;
import com.bugflow.dto.SprintResponse;
import com.bugflow.service.SprintService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1")
public class SprintController {

    private final SprintService sprintService;

    public SprintController(SprintService sprintService) {
        this.sprintService = sprintService;
    }

    @PostMapping("/projects/{projectId}/sprints")
    public ResponseEntity<SprintResponse> createSprint(@PathVariable Long projectId,
                                                       @Valid @RequestBody SprintRequest request,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        SprintResponse response = sprintService.createSprint(projectId, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/{projectId}/sprints")
    public ResponseEntity<List<SprintResponse>> getSprintsForProject(@PathVariable Long projectId,
                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        List<SprintResponse> response = sprintService.getSprintsForProject(projectId, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/sprints/{sprintId}/status")
    public ResponseEntity<SprintResponse> updateSprintStatus(@PathVariable Long sprintId,
                                                             @RequestParam String status,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        SprintResponse response = sprintService.updateSprintStatus(sprintId, status, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
