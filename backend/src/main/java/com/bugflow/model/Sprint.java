package com.bugflow.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sprints")
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SprintStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Constructors
    public Sprint() {
    }

    public Sprint(Long id, String name, LocalDate startDate, LocalDate endDate, SprintStatus status, Project project, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.project = project;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public SprintStatus getStatus() {
        return status;
    }

    public void setStatus(SprintStatus status) {
        this.status = status;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Sprint{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", startDate=" + startDate +
                ", endDate=" + endDate +
                ", status=" + status +
                ", createdAt=" + createdAt +
                '}';
    }

    // Builder
    public static SprintBuilder builder() {
        return new SprintBuilder();
    }

    public static class SprintBuilder {
        private Long id;
        private String name;
        private LocalDate startDate;
        private LocalDate endDate;
        private SprintStatus status;
        private Project project;
        private LocalDateTime createdAt;

        public SprintBuilder id(Long id) {
            this.id = id;
            return this;
        }

        public SprintBuilder name(String name) {
            this.name = name;
            return this;
        }

        public SprintBuilder startDate(LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        public SprintBuilder endDate(LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public SprintBuilder status(SprintStatus status) {
            this.status = status;
            return this;
        }

        public SprintBuilder project(Project project) {
            this.project = project;
            return this;
        }

        public SprintBuilder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Sprint build() {
            return new Sprint(id, name, startDate, endDate, status, project, createdAt);
        }
    }
}
