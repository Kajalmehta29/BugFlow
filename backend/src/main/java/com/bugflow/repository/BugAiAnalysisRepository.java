package com.bugflow.repository;

import com.bugflow.model.BugAiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BugAiAnalysisRepository extends JpaRepository<BugAiAnalysis, Long> {

    @Query("SELECT a FROM BugAiAnalysis a WHERE a.bug.id = :bugId")
    Optional<BugAiAnalysis> findByBugId(@Param("bugId") Long bugId);
}
