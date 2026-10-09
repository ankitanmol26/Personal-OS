package com.personalos.backend.service;

import com.personalos.backend.dto.ProjectDTO;
import com.personalos.backend.dto.ProjectTaskDTO;
import com.personalos.backend.entity.Project;
import com.personalos.backend.entity.ProjectTask;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.ProjectRepository;
import com.personalos.backend.repository.ProjectTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final CurrentUserService currentUserService;

    @Autowired
    public ProjectService(ProjectRepository projectRepository, ProjectTaskRepository projectTaskRepository, CurrentUserService currentUserService) {
        this.projectRepository = projectRepository;
        this.projectTaskRepository = projectTaskRepository;
        this.currentUserService = currentUserService;
    }

    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findByUserId(currentUserService.getCurrentUserId()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return mapToDTO(project);
    }

    public ProjectDTO createProject(ProjectDTO projectDTO) {
        Project project = new Project();
        updateProjectEntityFromDTO(project, projectDTO);
        project.setUser(currentUserService.getCurrentUser()); // Isolated temporary mechanism for Stage 5A
        Project savedProject = projectRepository.save(project);
        return mapToDTO(savedProject);
    }

    public ProjectDTO updateProject(Long id, ProjectDTO projectDTO) {
        Project project = projectRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        
        updateProjectEntityFromDTO(project, projectDTO);
        Project updatedProject = projectRepository.save(project);
        return mapToDTO(updatedProject);
    }

    public void deleteProject(Long id) {
        Project project = projectRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    public ProjectDTO addProjectTask(Long projectId, ProjectTaskDTO taskDTO) {
        Project project = projectRepository.findByIdAndUserId(projectId, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        ProjectTask task = new ProjectTask();
        task.setTitle(taskDTO.getTitle());
        task.setCompleted(taskDTO.isCompleted());
        task.setProject(project);

        project.getTasks().add(task);
        projectRepository.save(project);

        return mapToDTO(project);
    }

    public ProjectDTO updateProjectTask(Long projectId, Long taskId, ProjectTaskDTO taskDTO) {
        Project project = projectRepository.findByIdAndUserId(projectId, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        ProjectTask task = projectTaskRepository.findProjectTaskByOwnership(taskId, projectId, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + taskId));

        if (!task.getProject().getId().equals(projectId)) {
            throw new IllegalArgumentException("Task does not belong to the specified project");
        }

        task.setTitle(taskDTO.getTitle());
        task.setCompleted(taskDTO.isCompleted());
        projectTaskRepository.save(task);

        return mapToDTO(project);
    }

    private void updateProjectEntityFromDTO(Project project, ProjectDTO dto) {
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setTechStack(dto.getTechStack());
        project.setStatus(dto.getStatus());
        project.setProgress(dto.getProgress());
        project.setDeadline(dto.getDeadline());
        project.setGithubLink(dto.getGithubLink());
        project.setLiveLink(dto.getLiveLink());
    }

    private ProjectDTO mapToDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setTechStack(project.getTechStack());
        dto.setStatus(project.getStatus());
        dto.setProgress(project.getProgress());
        dto.setDeadline(project.getDeadline());
        dto.setGithubLink(project.getGithubLink());
        dto.setLiveLink(project.getLiveLink());

        if (project.getTasks() != null) {
            List<ProjectTaskDTO> taskDTOs = project.getTasks().stream().map(task -> {
                ProjectTaskDTO tDto = new ProjectTaskDTO();
                tDto.setId(task.getId());
                tDto.setTitle(task.getTitle());
                tDto.setCompleted(task.isCompleted());
                return tDto;
            }).collect(Collectors.toList());
            dto.setTasks(taskDTOs);
        }
        return dto;
    }
}
