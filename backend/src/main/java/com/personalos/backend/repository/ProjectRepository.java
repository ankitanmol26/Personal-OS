package com.personalos.backend.repository;

import com.personalos.backend.entity.Project;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    @EntityGraph(attributePaths = {"tasks"})
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Project p WHERE p.user.id = :userId")
    List<Project> findByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @EntityGraph(attributePaths = {"tasks"})
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Project p WHERE p.id = :id AND p.user.id = :userId")
    Optional<Project> findByIdAndUserId(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("userId") Long userId);
}
