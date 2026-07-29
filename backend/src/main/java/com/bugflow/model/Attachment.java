package com.bugflow.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "attachments")
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String filename;

    @NotBlank
    @Column(name = "file_type", nullable = false)
    private String fileType;

    @NotBlank
    @Column(name = "storage_path", nullable = false)
    private String storagePath;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bug_id", nullable = false)
    private Bug bug;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public Attachment() {
    }

    public Attachment(Long id, String filename, String fileType, String storagePath, Bug bug, LocalDateTime createdAt) {
        this.id = id;
        this.filename = filename;
        this.fileType = fileType;
        this.storagePath = storagePath;
        this.bug = bug;
        this.createdAt = createdAt;
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

    public String getStoragePath() {
        return storagePath;
    }

    public void setStoragePath(String storagePath) {
        this.storagePath = storagePath;
    }

    public Bug getBug() {
        return bug;
    }

    public void setBug(Bug bug) {
        this.bug = bug;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Attachment{" +
                "id=" + id +
                ", filename='" + filename + '\'' +
                ", fileType='" + fileType + '\'' +
                ", storagePath='" + storagePath + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }

    // Builder
    public static AttachmentBuilder builder() {
        return new AttachmentBuilder();
    }

    public static class AttachmentBuilder {
        private Long id;
        private String filename;
        private String fileType;
        private String storagePath;
        private Bug bug;
        private LocalDateTime createdAt;

        public AttachmentBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public AttachmentBuilder filename(String filename) {
            this.filename = filename;
            return this;
        }

        public AttachmentBuilder fileType(String fileType) {
            this.fileType = fileType;
            return this;
        }

        public AttachmentBuilder storagePath(String storagePath) {
            this.storagePath = storagePath;
            return this;
        }

        public AttachmentBuilder bug(Bug bug) {
            this.bug = bug;
            return this;
        }

        public AttachmentBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Attachment build() {
            return new Attachment(id, filename, fileType, storagePath, bug, createdAt);
        }
    }
}
