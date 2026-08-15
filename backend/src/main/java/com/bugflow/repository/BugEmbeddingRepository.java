package com.bugflow.repository;

import com.bugflow.model.BugEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BugEmbeddingRepository extends JpaRepository<BugEmbedding, Long> {
    
    @Query("SELECT e FROM BugEmbedding e WHERE e.bug.id = :bugId")
    Optional<BugEmbedding> findByBugId(@Param("bugId") Long bugId);

    @Query("SELECT e FROM BugEmbedding e WHERE e.bug.project.id = :projectId")
    List<BugEmbedding> findAllByProjectId(@Param("projectId") Long projectId);
}
