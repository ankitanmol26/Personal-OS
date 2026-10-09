package com.personalos.backend.repository;

import com.personalos.backend.entity.ProjectTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, Long> {

    @Query("SELECT pt FROM ProjectTask pt WHERE pt.id = :id AND pt.project.id = :projectId AND pt.project.user.id = :userId")
    Optional<ProjectTask> findProjectTaskByOwnership(@Param("id") Long id, @Param("projectId") Long projectId, @Param("userId") Long userId);
}
