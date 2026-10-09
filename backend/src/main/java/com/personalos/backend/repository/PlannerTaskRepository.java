package com.personalos.backend.repository;

import com.personalos.backend.entity.PlannerTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlannerTaskRepository extends JpaRepository<PlannerTask, Long> {
    List<PlannerTask> findByUserId(Long userId);
    Optional<PlannerTask> findByIdAndUserId(Long id, Long userId);
}
