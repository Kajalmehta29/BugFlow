package com.bugflow.dto;

import com.bugflow.model.Attachment;

import java.time.LocalDateTime;

public class AttachmentResponse {

    private Long id;
    private String filename;
    private String fileType;
    private String url;
    private LocalDateTime createdAt;

    public AttachmentResponse() {
    }

    public AttachmentResponse(Long id, String filename, String fileType, String url, LocalDateTime createdAt) {
        this.id = id;
        this.filename = filename;
        this.fileType = fileType;
        this.url = url;
        this.createdAt = createdAt;
    }

    public static AttachmentResponse fromAttachment(Attachment attachment) {
        if (attachment == null) {
            return null;
        }
        // Expose a relative URL download endpoint
        String downloadUrl = "/api/v1/attachments/" + attachment.getId() + "/download";
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getFilename(),
                attachment.getFileType(),
                downloadUrl,
                attachment.getCreatedAt()
        );
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
