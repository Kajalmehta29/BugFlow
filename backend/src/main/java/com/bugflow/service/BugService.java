package com.bugflow.service;

import com.bugflow.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BugService {
    BugResponse createBug(BugRequest request, String currentUsername);

    List<BugResponse> searchBugs(Long projectId, String status, String priority, Long assigneeId,
                                 Long sprintId, String search, String sortBy, Boolean semantic, String currentUsername);

    BugResponse getBugById(Long bugId, String currentUsername);

    BugResponse updateBug(Long bugId, BugRequest request, String currentUsername);

    BugResponse transitionBugStatus(Long bugId, String newStatus, String currentUsername);

    CommentResponse addComment(Long bugId, CommentRequest request, String currentUsername);

    List<CommentResponse> getComments(Long bugId, String currentUsername);

    AttachmentResponse addAttachment(Long bugId, MultipartFile file, String currentUsername);

    List<AttachmentResponse> getAttachments(Long bugId, String currentUsername);

    AttachmentResponse getAttachmentById(Long attachmentId, String currentUsername);

    java.nio.file.Path getAttachmentStoragePath(Long attachmentId, String currentUsername);

    List<ActivityLogResponse> getActivityLogs(Long bugId, String currentUsername);
}
