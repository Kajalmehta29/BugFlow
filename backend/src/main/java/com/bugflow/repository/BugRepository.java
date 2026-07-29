package com.bugflow.repository;

import com.bugflow.model.Bug;
import com.bugflow.model.BugPriority;
import com.bugflow.model.BugStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BugRepository extends JpaRepository<Bug, Long> {
    List<Bug> findByProjectId(Long projectId);
    List<Bug> findBySprintId(Long sprintId);
    List<Bug> findByAssigneeId(Long assigneeId);

    @Query("SELECT b FROM Bug b " +
           "LEFT JOIN FETCH b.assignee " +
           "LEFT JOIN FETCH b.reporter " +
           "WHERE b.project.id = :projectId " +
           "AND (:status IS NULL OR b.status = :status) " +
           "AND (:priority IS NULL OR b.priority = :priority) " +
           "AND (:assigneeId IS NULL OR b.assignee.id = :assigneeId) " +
           "AND (:sprintId IS NULL OR b.sprint.id = :sprintId) " +
           "AND (:search IS NULL OR LOWER(b.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
           "    OR LOWER(b.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    List<Bug> searchBugs(@Param("projectId") Long projectId,
                         @Param("status") BugStatus status,
                         @Param("priority") BugPriority priority,
                         @Param("assigneeId") Long assigneeId,
                         @Param("sprintId") Long sprintId,
                         @Param("search") String search,
                         Sort sort);

    @Query("SELECT COUNT(b) FROM Bug b WHERE b.project.id = :projectId AND b.status = :status")
    long countByProjectIdAndStatus(@Param("projectId") Long projectId, @Param("status") BugStatus status);

    @Query("SELECT COUNT(b) FROM Bug b WHERE b.project.id = :projectId AND b.priority = :priority")
    long countByProjectIdAndPriority(@Param("projectId") Long projectId, @Param("priority") BugPriority priority);
}
