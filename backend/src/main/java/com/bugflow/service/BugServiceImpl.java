package com.bugflow.service;

import com.bugflow.dto.*;
import com.bugflow.exception.BadRequestException;
import com.bugflow.exception.ResourceNotFoundException;
import com.bugflow.model.*;
import com.bugflow.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BugServiceImpl implements BugService {

    private final BugRepository bugRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final SprintRepository sprintRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final ActivityLogRepository activityLogRepository;
    private final NotificationService notificationService;

    private final Path fileStorageLocation;

    public BugServiceImpl(BugRepository bugRepository,
                          UserRepository userRepository,
                          ProjectRepository projectRepository,
                          SprintRepository sprintRepository,
                          CommentRepository commentRepository,
                          AttachmentRepository attachmentRepository,
                          ActivityLogRepository activityLogRepository,
                          NotificationService notificationService) {
        this.bugRepository = bugRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.sprintRepository = sprintRepository;
        this.commentRepository = commentRepository;
        this.attachmentRepository = attachmentRepository;
        this.activityLogRepository = activityLogRepository;
        this.notificationService = notificationService;

        // Define files storage location relative to runtime root (inside project directory)
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    private void logActivity(Bug bug, User user, String action, String oldValue, String newValue) {
        ActivityLog log = ActivityLog.builder()
                .bug(bug)
                .user(user)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .build();
        activityLogRepository.save(log);
    }

    private void validateUserMembership(Project project, User user) {
        if (user.getRole() != UserRole.ADMIN &&
                !project.getManager().getId().equals(user.getId()) &&
                project.getMembers().stream().noneMatch(member -> member.getId().equals(user.getId()))) {
            throw new BadRequestException("Access denied: You are not a member of this project");
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = {"bugSearch", "dashboardStats"}, allEntries = true)
    public BugResponse createBug(BugRequest request, String currentUsername) {
        User reporter = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Reporter not found: " + currentUsername));

        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + request.getProjectId()));

        validateUserMembership(project, reporter);

        BugPriority priority;
        BugSeverity severity;
        try {
            priority = BugPriority.valueOf(request.getPriority().toUpperCase());
            severity = BugSeverity.valueOf(request.getSeverity().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid priority or severity value.");
        }

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found: " + request.getAssigneeId()));
            validateUserMembership(project, assignee);
        }

        Sprint sprint = null;
        if (request.getSprintId() != null) {
            sprint = sprintRepository.findById(request.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found: " + request.getSprintId()));
            if (!sprint.getProject().getId().equals(project.getId())) {
                throw new BadRequestException("Sprint does not belong to the selected project");
            }
        }

        BugStatus initialStatus = (assignee != null) ? BugStatus.ASSIGNED : BugStatus.OPEN;

        Bug bug = Bug.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(priority)
                .severity(severity)
                .status(initialStatus)
                .reporter(reporter)
                .assignee(assignee)
                .project(project)
                .sprint(sprint)
                .build();

        Bug savedBug = bugRepository.save(bug);

        logActivity(savedBug, reporter, "CREATED", null, "Status set to " + initialStatus);
        if (assignee != null) {
            logActivity(savedBug, reporter, "ASSIGNEE_CHANGED", null, assignee.getUsername());
            notificationService.sendNotification(
                    assignee.getId(),
                    "New Bug Assigned",
                    "You have been assigned to bug: " + savedBug.getTitle() + " (" + project.getKey() + ")"
            );
        }

        return BugResponse.fromBug(savedBug);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "bugSearch", key = "#projectId + '-' + #status + '-' + #priority + '-' + #assigneeId + '-' + #sprintId + '-' + #search + '-' + #sortBy")
    public List<BugResponse> searchBugs(Long projectId, String status, String priority, Long assigneeId,
                                         Long sprintId, String search, String sortBy, String currentUsername) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(project, currentUser);

        BugStatus bugStatus = null;
        if (status != null && !status.isEmpty()) {
            bugStatus = BugStatus.valueOf(status.toUpperCase());
        }

        BugPriority bugPriority = null;
        if (priority != null && !priority.isEmpty()) {
            bugPriority = BugPriority.valueOf(priority.toUpperCase());
        }

        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sortBy != null && !sortBy.isEmpty()) {
            String[] parts = sortBy.split(",");
            Sort.Direction direction = parts.length > 1 && parts[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
            sort = Sort.by(direction, parts[0]);
        }

        List<Bug> bugs = bugRepository.searchBugs(projectId, bugStatus, bugPriority, assigneeId, sprintId, search, sort);
        return bugs.stream()
                .map(BugResponse::fromBug)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "bugDetails", key = "#bugId")
    public BugResponse getBugById(Long bugId, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        return BugResponse.fromBug(bug);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "bugDetails", key = "#bugId"),
        @CacheEvict(value = {"bugSearch", "dashboardStats"}, allEntries = true)
    })
    public BugResponse updateBug(Long bugId, BugRequest request, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        // Access: Only PM, Admin, or reporter can edit details
        boolean isPMOrAdmin = (currentUser.getRole() == UserRole.ADMIN ||
                bug.getProject().getManager().getId().equals(currentUser.getId()));
        boolean isReporter = bug.getReporter().getId().equals(currentUser.getId());

        if (!isPMOrAdmin && !isReporter) {
            throw new BadRequestException("Access denied: Only the reporter, project manager, or an Admin can edit bug details");
        }

        // Check updates & log activity
        if (!bug.getTitle().equals(request.getTitle())) {
            logActivity(bug, currentUser, "TITLE_CHANGED", bug.getTitle(), request.getTitle());
            bug.setTitle(request.getTitle());
        }

        if (!bug.getDescription().equals(request.getDescription())) {
            logActivity(bug, currentUser, "DESCRIPTION_CHANGED", "[Modified]", "[Modified]");
            bug.setDescription(request.getDescription());
        }

        BugPriority newPriority = BugPriority.valueOf(request.getPriority().toUpperCase());
        if (bug.getPriority() != newPriority) {
            logActivity(bug, currentUser, "PRIORITY_CHANGED", bug.getPriority().name(), newPriority.name());
            bug.setPriority(newPriority);
        }

        BugSeverity newSeverity = BugSeverity.valueOf(request.getSeverity().toUpperCase());
        if (bug.getSeverity() != newSeverity) {
            logActivity(bug, currentUser, "SEVERITY_CHANGED", bug.getSeverity().name(), newSeverity.name());
            bug.setSeverity(newSeverity);
        }

        // Assignee update
        User newAssignee = null;
        if (request.getAssigneeId() != null) {
            newAssignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found: " + request.getAssigneeId()));
            validateUserMembership(bug.getProject(), newAssignee);
        }

        boolean assigneeChanged = false;
        String oldAssigneeName = bug.getAssignee() != null ? bug.getAssignee().getUsername() : "Unassigned";
        String newAssigneeName = newAssignee != null ? newAssignee.getUsername() : "Unassigned";

        if ((bug.getAssignee() == null && newAssignee != null) ||
                (bug.getAssignee() != null && !bug.getAssignee().equals(newAssignee))) {
            bug.setAssignee(newAssignee);
            assigneeChanged = true;
            logActivity(bug, currentUser, "ASSIGNEE_CHANGED", oldAssigneeName, newAssigneeName);

            // Automatically set status to ASSIGNED if currently OPEN and new assignee added
            if (bug.getStatus() == BugStatus.OPEN && newAssignee != null) {
                bug.setStatus(BugStatus.ASSIGNED);
                logActivity(bug, currentUser, "STATUS_CHANGED", "OPEN", "ASSIGNED");
            }
            // Automatically set status back to OPEN if currently ASSIGNED and unassigned
            if (bug.getStatus() == BugStatus.ASSIGNED && newAssignee == null) {
                bug.setStatus(BugStatus.OPEN);
                logActivity(bug, currentUser, "STATUS_CHANGED", "ASSIGNED", "OPEN");
            }
        }

        // Sprint update
        Sprint newSprint = null;
        if (request.getSprintId() != null) {
            newSprint = sprintRepository.findById(request.getSprintId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sprint not found: " + request.getSprintId()));
            if (!newSprint.getProject().getId().equals(bug.getProject().getId())) {
                throw new BadRequestException("Sprint does not belong to this project");
            }
        }

        String oldSprintName = bug.getSprint() != null ? bug.getSprint().getName() : "None";
        String newSprintName = newSprint != null ? newSprint.getName() : "None";

        if ((bug.getSprint() == null && newSprint != null) ||
                (bug.getSprint() != null && !bug.getSprint().equals(newSprint))) {
            bug.setSprint(newSprint);
            logActivity(bug, currentUser, "SPRINT_CHANGED", oldSprintName, newSprintName);
        }

        Bug savedBug = bugRepository.save(bug);

        if (assigneeChanged) {
            if (newAssignee != null) {
                notificationService.sendNotification(
                        newAssignee.getId(),
                        "Bug Assigned",
                        "You have been assigned to bug: " + savedBug.getTitle()
                );
            }
            if (savedBug.getReporter() != null) {
                notificationService.sendNotification(
                        savedBug.getReporter().getId(),
                        "Bug Assignee Updated",
                        "Bug '" + savedBug.getTitle() + "' was assigned to " + newAssigneeName
                );
            }
        } else {
            if (savedBug.getAssignee() != null && !savedBug.getAssignee().getId().equals(currentUser.getId())) {
                notificationService.sendNotification(
                        savedBug.getAssignee().getId(),
                        "Bug Details Updated",
                        "Bug '" + savedBug.getTitle() + "' details were updated by " + currentUser.getUsername()
                );
            }
            if (savedBug.getReporter() != null && !savedBug.getReporter().getId().equals(currentUser.getId())) {
                notificationService.sendNotification(
                        savedBug.getReporter().getId(),
                        "Bug Details Updated",
                        "Bug '" + savedBug.getTitle() + "' details were updated by " + currentUser.getUsername()
                );
            }
        }

        return BugResponse.fromBug(savedBug);
    }

    @Override
    @Transactional
    @Caching(evict = {
        @CacheEvict(value = "bugDetails", key = "#bugId"),
        @CacheEvict(value = {"bugSearch", "dashboardStats"}, allEntries = true)
    })
    public BugResponse transitionBugStatus(Long bugId, String newStatus, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        BugStatus targetStatus;
        try {
            targetStatus = BugStatus.valueOf(newStatus.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new BadRequestException("Invalid status: '" + newStatus + "'");
        }

        validateWorkflowTransition(bug, targetStatus, currentUser);

        BugStatus oldStatus = bug.getStatus();
        bug.setStatus(targetStatus);

        Bug savedBug = bugRepository.save(bug);

        logActivity(savedBug, currentUser, "STATUS_CHANGED", oldStatus.name(), targetStatus.name());

        String statusMsg = "Bug '" + savedBug.getTitle() + "' status changed from " + oldStatus.name() + " to " + targetStatus.name() + " by " + currentUser.getUsername();
        if (savedBug.getAssignee() != null && !savedBug.getAssignee().getId().equals(currentUser.getId())) {
            notificationService.sendNotification(savedBug.getAssignee().getId(), "Bug Status Updated", statusMsg);
        }
        if (savedBug.getReporter() != null && !savedBug.getReporter().getId().equals(currentUser.getId())) {
            notificationService.sendNotification(savedBug.getReporter().getId(), "Bug Status Updated", statusMsg);
        }

        return BugResponse.fromBug(savedBug);
    }

    private void validateWorkflowTransition(Bug bug, BugStatus target, User user) {
        BugStatus current = bug.getStatus();
        UserRole role = user.getRole();

        if (current == target) {
            return;
        }

        boolean isManagerOrAdmin = (role == UserRole.ADMIN ||
                bug.getProject().getManager().getId().equals(user.getId()));
        boolean isAssignee = bug.getAssignee() != null && bug.getAssignee().getId().equals(user.getId());
        boolean isTester = (role == UserRole.TESTER);

        switch (current) {
            case OPEN:
                if (target == BugStatus.ASSIGNED) {
                    if (!isManagerOrAdmin) {
                        throw new BadRequestException("Only a Project Manager or Admin can assign/allocate a bug");
                    }
                } else {
                    throw new BadRequestException("Invalid transition from OPEN to " + target + ". Must assign first.");
                }
                break;
            case ASSIGNED:
                if (target == BugStatus.IN_PROGRESS) {
                    if (!isAssignee && !isManagerOrAdmin) {
                        throw new BadRequestException("Only the assignee or PM/Admin can start work on this bug");
                    }
                } else if (target == BugStatus.OPEN) {
                    if (!isManagerOrAdmin) {
                        throw new BadRequestException("Only a PM or Admin can transition bug back to OPEN (unassigned)");
                    }
                } else {
                    throw new BadRequestException("Invalid transition from ASSIGNED to " + target);
                }
                break;
            case IN_PROGRESS:
                if (target == BugStatus.CODE_REVIEW) {
                    if (!isAssignee && !isManagerOrAdmin) {
                        throw new BadRequestException("Only the assignee or PM/Admin can submit this bug for code review");
                    }
                } else {
                    throw new BadRequestException("Invalid transition from IN_PROGRESS to " + target);
                }
                break;
            case CODE_REVIEW:
                if (target == BugStatus.TESTING) {
                    if (!isAssignee && !isManagerOrAdmin) {
                        throw new BadRequestException("Only the assignee or PM/Admin can advance this bug to testing");
                    }
                } else {
                    throw new BadRequestException("Invalid transition from CODE_REVIEW to " + target);
                }
                break;
            case TESTING:
                if (target == BugStatus.RESOLVED) {
                    if (!isTester && !isManagerOrAdmin) {
                        throw new BadRequestException("Only a Tester or PM/Admin can mark a bug as resolved");
                    }
                } else if (target == BugStatus.OPEN || target == BugStatus.ASSIGNED) {
                    if (!isTester && !isManagerOrAdmin) {
                        throw new BadRequestException("Only a Tester or PM/Admin can reopen/reassign a bug from testing");
                    }
                } else {
                    throw new BadRequestException("Invalid transition from TESTING to " + target);
                }
                break;
            case RESOLVED:
                if (target == BugStatus.CLOSED) {
                    if (!isTester && !isManagerOrAdmin) {
                        throw new BadRequestException("Only a Tester or PM/Admin can close a resolved bug");
                    }
                } else if (target == BugStatus.OPEN || target == BugStatus.ASSIGNED) {
                    if (!isTester && !isManagerOrAdmin) {
                        throw new BadRequestException("Only a Tester or PM/Admin can reopen a resolved bug");
                    }
                } else {
                    throw new BadRequestException("Invalid transition from RESOLVED to " + target);
                }
                break;
            case CLOSED:
                if (target == BugStatus.OPEN || target == BugStatus.ASSIGNED) {
                    if (!isTester && !isManagerOrAdmin) {
                        throw new BadRequestException("Only a Tester or PM/Admin can reopen a closed bug");
                    }
                } else {
                    throw new BadRequestException("Invalid transition from CLOSED to " + target);
                }
                break;
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = "bugDetails", key = "#bugId")
    public CommentResponse addComment(Long bugId, CommentRequest request, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        Comment comment = Comment.builder()
                .content(request.getContent())
                .bug(bug)
                .author(currentUser)
                .build();

        Comment savedComment = commentRepository.save(comment);

        logActivity(bug, currentUser, "COMMENT_ADDED", null, currentUser.getUsername() + " commented on this bug");

        String commentMsg = currentUser.getUsername() + " commented on bug: '" + bug.getTitle() + "'";
        if (bug.getAssignee() != null && !bug.getAssignee().getId().equals(currentUser.getId())) {
            notificationService.sendNotification(bug.getAssignee().getId(), "New Comment Added", commentMsg);
        }
        if (bug.getReporter() != null && !bug.getReporter().getId().equals(currentUser.getId())) {
            notificationService.sendNotification(bug.getReporter().getId(), "New Comment Added", commentMsg);
        }

        return CommentResponse.fromComment(savedComment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> getComments(Long bugId, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        List<Comment> comments = commentRepository.findByBugIdOrderByCreatedAtAsc(bugId);
        return comments.stream()
                .map(CommentResponse::fromComment)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    @CacheEvict(value = {"bugDetails", "bugSearch"}, allEntries = true)
    public AttachmentResponse addAttachment(Long bugId, MultipartFile file, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        // Normalize file name
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.contains("..")) {
            throw new BadRequestException("Sorry! Filename contains invalid path sequence " + originalFilename);
        }

        // Store file locally with unique UUID prefix
        String storedFilename = UUID.randomUUID().toString() + "_" + originalFilename;
        Path targetLocation = this.fileStorageLocation.resolve(storedFilename);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", ex);
        }

        Attachment attachment = Attachment.builder()
                .filename(originalFilename)
                .fileType(file.getContentType())
                .storagePath(targetLocation.toString())
                .bug(bug)
                .build();

        Attachment savedAttachment = attachmentRepository.save(attachment);

        logActivity(bug, currentUser, "ATTACHMENT_ADDED", null, originalFilename);

        return AttachmentResponse.fromAttachment(savedAttachment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentResponse> getAttachments(Long bugId, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        List<Attachment> attachments = attachmentRepository.findByBugId(bugId);
        return attachments.stream()
                .map(AttachmentResponse::fromAttachment)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AttachmentResponse getAttachmentById(Long attachmentId, String currentUsername) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(attachment.getBug().getProject(), currentUser);

        return AttachmentResponse.fromAttachment(attachment);
    }

    @Override
    @Transactional(readOnly = true)
    public Path getAttachmentStoragePath(Long attachmentId, String currentUsername) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found with ID: " + attachmentId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(attachment.getBug().getProject(), currentUser);

        return Paths.get(attachment.getStoragePath());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getActivityLogs(Long bugId, String currentUsername) {
        Bug bug = bugRepository.findById(bugId)
                .orElseThrow(() -> new ResourceNotFoundException("Bug not found with ID: " + bugId));

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUsername));

        validateUserMembership(bug.getProject(), currentUser);

        List<ActivityLog> logs = activityLogRepository.findByBugIdOrderByCreatedAtDesc(bugId);
        return logs.stream()
                .map(ActivityLogResponse::fromActivityLog)
                .collect(Collectors.toList());
    }
}
