package com.personalos.backend.controller;

import com.personalos.backend.dto.PlannerTaskDTO;
import com.personalos.backend.service.PlannerTaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/planner-tasks")
public class PlannerTaskController {

    private final PlannerTaskService plannerTaskService;

    @Autowired
    public PlannerTaskController(PlannerTaskService plannerTaskService) {
        this.plannerTaskService = plannerTaskService;
    }

    @GetMapping
    public ResponseEntity<List<PlannerTaskDTO>> getAllTasks() {
        return ResponseEntity.ok(plannerTaskService.getAllTasks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlannerTaskDTO> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(plannerTaskService.getTaskById(id));
    }

    @PostMapping
    public ResponseEntity<PlannerTaskDTO> createTask(@RequestBody PlannerTaskDTO taskDTO) {
        if (taskDTO.getTitle() == null || taskDTO.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (taskDTO.getDate() == null) {
            return ResponseEntity.badRequest().build();
        }
        PlannerTaskDTO created = plannerTaskService.createTask(taskDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PlannerTaskDTO> updateTask(@PathVariable Long id, @RequestBody PlannerTaskDTO taskDTO) {
        if (taskDTO.getTitle() == null || taskDTO.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (taskDTO.getDate() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(plannerTaskService.updateTask(id, taskDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        plannerTaskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
