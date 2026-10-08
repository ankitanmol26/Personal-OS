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

    @Autowired
    public PlannerTaskService(PlannerTaskRepository plannerTaskRepository) {
        this.plannerTaskRepository = plannerTaskRepository;
    }

    public List<PlannerTaskDTO> getAllTasks() {
        return plannerTaskRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public PlannerTaskDTO getTaskById(Long id) {
        PlannerTask task = plannerTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Planner Task not found with id: " + id));
        return mapToDTO(task);
    }

    public PlannerTaskDTO createTask(PlannerTaskDTO taskDTO) {
        PlannerTask task = new PlannerTask();
        task.setTitle(taskDTO.getTitle());
        task.setDate(taskDTO.getDate());
        task.setPriority(taskDTO.getPriority());
        task.setCompleted(taskDTO.isCompleted());
        
        PlannerTask savedTask = plannerTaskRepository.save(task);
        return mapToDTO(savedTask);
    }

    public PlannerTaskDTO updateTask(Long id, PlannerTaskDTO taskDTO) {
        PlannerTask task = plannerTaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Planner Task not found with id: " + id));
        
        task.setTitle(taskDTO.getTitle());
        task.setDate(taskDTO.getDate());
        task.setPriority(taskDTO.getPriority());
        task.setCompleted(taskDTO.isCompleted());
        
        PlannerTask updatedTask = plannerTaskRepository.save(task);
        return mapToDTO(updatedTask);
    }

    public void deleteTask(Long id) {
        PlannerTask task = plannerTaskRepository.findById(id)
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
