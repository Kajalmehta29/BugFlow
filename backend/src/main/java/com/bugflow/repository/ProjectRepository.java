package com.bugflow.repository;

import com.bugflow.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    boolean existsByKey(String key);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.manager LEFT JOIN FETCH p.members m WHERE p.manager.id = :userId OR m.id = :userId")
    List<Project> findProjectsByUserId(@Param("userId") Long userId);
}
