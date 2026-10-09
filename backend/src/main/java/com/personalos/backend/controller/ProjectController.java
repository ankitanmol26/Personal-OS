package com.personalos.backend.controller;

import com.personalos.backend.dto.ProjectDTO;
import com.personalos.backend.dto.ProjectTaskDTO;
import com.personalos.backend.service.ProjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody ProjectDTO projectDTO) {
        ProjectDTO created = projectService.createProject(projectDTO);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectDTO projectDTO) {
        return ResponseEntity.ok(projectService.updateProject(id, projectDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projectId}/tasks")
    public ResponseEntity<ProjectDTO> addProjectTask(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectTaskDTO taskDTO) {
        ProjectDTO updatedProject = projectService.addProjectTask(projectId, taskDTO);
        return new ResponseEntity<>(updatedProject, HttpStatus.CREATED);
    }

    @PutMapping("/{projectId}/tasks/{taskId}")
    public ResponseEntity<ProjectDTO> updateProjectTask(
            @PathVariable Long projectId,
            @PathVariable Long taskId,
            @Valid @RequestBody ProjectTaskDTO taskDTO) {
        return ResponseEntity.ok(projectService.updateProjectTask(projectId, taskId, taskDTO));
    }
}
