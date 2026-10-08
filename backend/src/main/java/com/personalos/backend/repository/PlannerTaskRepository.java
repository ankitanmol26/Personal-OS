package com.personalos.backend.repository;

import com.personalos.backend.entity.PlannerTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlannerTaskRepository extends JpaRepository<PlannerTask, Long> {
}
