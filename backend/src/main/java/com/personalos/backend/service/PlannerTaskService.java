package com.personalos.backend.service;

import com.personalos.backend.dto.PlannerTaskDTO;
import com.personalos.backend.entity.PlannerTask;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.PlannerTaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlannerTaskService {

    private final PlannerTaskRepository plannerTaskRepository;
    private final CurrentUserService currentUserService;

    @Autowired
    public PlannerTaskService(PlannerTaskRepository plannerTaskRepository, CurrentUserService currentUserService) {
        this.plannerTaskRepository = plannerTaskRepository;
        this.currentUserService = currentUserService;
    }

    public List<PlannerTaskDTO> getAllTasks() {
        return plannerTaskRepository.findByUserId(currentUserService.getCurrentUserId()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PlannerTaskDTO getTaskById(Long id) {
        PlannerTask task = plannerTaskRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Planner Task not found with id: " + id));
        return mapToDTO(task);
    }

    public PlannerTaskDTO createTask(PlannerTaskDTO taskDTO) {
        PlannerTask task = new PlannerTask();
        task.setTitle(taskDTO.getTitle());
        task.setDate(taskDTO.getDate());
        task.setPriority(taskDTO.getPriority());
        task.setCompleted(taskDTO.isCompleted());
        task.setUser(currentUserService.getCurrentUser()); // Isolated temporary mechanism for Stage 5A
        
        PlannerTask savedTask = plannerTaskRepository.save(task);
        return mapToDTO(savedTask);
    }

    public PlannerTaskDTO updateTask(Long id, PlannerTaskDTO taskDTO) {
        PlannerTask task = plannerTaskRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Planner Task not found with id: " + id));
        
        task.setTitle(taskDTO.getTitle());
        task.setDate(taskDTO.getDate());
        task.setPriority(taskDTO.getPriority());
        task.setCompleted(taskDTO.isCompleted());
        
        PlannerTask updatedTask = plannerTaskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    public void deleteTask(Long id) {
        PlannerTask task = plannerTaskRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Planner Task not found with id: " + id));
        plannerTaskRepository.delete(task);
    }

    private PlannerTaskDTO mapToDTO(PlannerTask task) {
        PlannerTaskDTO dto = new PlannerTaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDate(task.getDate());
        dto.setPriority(task.getPriority());
        dto.setCompleted(task.isCompleted());
        return dto;
    }
}
