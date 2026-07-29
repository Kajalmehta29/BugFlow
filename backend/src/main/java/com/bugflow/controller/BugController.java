package com.bugflow.controller;

import com.bugflow.dto.*;
import com.bugflow.service.BugService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/v1")
public class BugController {

    private final BugService bugService;

    public BugController(BugService bugService) {
        this.bugService = bugService;
    }

    @PostMapping("/bugs")
    public ResponseEntity<BugResponse> createBug(@Valid @RequestBody BugRequest request,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        BugResponse response = bugService.createBug(request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bugs/{id}")
    public ResponseEntity<BugResponse> getBugById(@PathVariable Long id,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        BugResponse response = bugService.getBugById(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/bugs/{id}")
    public ResponseEntity<BugResponse> updateBug(@PathVariable Long id,
                                                 @Valid @RequestBody BugRequest request,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        BugResponse response = bugService.updateBug(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/bugs/{id}/status")
    public ResponseEntity<BugResponse> transitionBugStatus(@PathVariable Long id,
                                                           @RequestParam String status,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        BugResponse response = bugService.transitionBugStatus(id, status, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/projects/{projectId}/bugs")
    public ResponseEntity<List<BugResponse>> searchBugs(@PathVariable Long projectId,
                                                        @RequestParam(required = false) String status,
                                                        @RequestParam(required = false) String priority,
                                                        @RequestParam(required = false) Long assigneeId,
                                                        @RequestParam(required = false) Long sprintId,
                                                        @RequestParam(required = false) String search,
                                                        @RequestParam(required = false) String sortBy,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        List<BugResponse> response = bugService.searchBugs(projectId, status, priority, assigneeId, sprintId, search, sortBy, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bugs/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long id,
                                                      @Valid @RequestBody CommentRequest request,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponse response = bugService.addComment(id, request, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bugs/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long id,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        List<CommentResponse> response = bugService.getComments(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/bugs/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> addAttachment(@PathVariable Long id,
                                                            @RequestParam("file") MultipartFile file,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        AttachmentResponse response = bugService.addAttachment(id, file, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/bugs/{id}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getAttachments(@PathVariable Long id,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        List<AttachmentResponse> response = bugService.getAttachments(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/attachments/{id}/download")
    public ResponseEntity<Resource> downloadAttachment(@PathVariable Long id,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        Path path = bugService.getAttachmentStoragePath(id, userDetails.getUsername());
        try {
            Resource resource = new UrlResource(path.toUri());
            if (resource.exists() || resource.isReadable()) {
                // Extract filename without UUID prefix for download friendliness
                String originalFilename = resource.getFilename();
                if (originalFilename != null && originalFilename.contains("_")) {
                    originalFilename = originalFilename.substring(originalFilename.indexOf("_") + 1);
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFilename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/bugs/{id}/timeline")
    public ResponseEntity<List<ActivityLogResponse>> getActivityLogs(@PathVariable Long id,
                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        List<ActivityLogResponse> response = bugService.getActivityLogs(id, userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
