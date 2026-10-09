package com.personalos.backend.service;

import com.personalos.backend.dto.TaskDTO;
import com.personalos.backend.entity.Task;
import com.personalos.backend.exception.ResourceNotFoundException;
import com.personalos.backend.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CurrentUserService currentUserService;

    @Autowired
    public TaskService(TaskRepository taskRepository, CurrentUserService currentUserService) {
        this.taskRepository = taskRepository;
        this.currentUserService = currentUserService;
    }

    public List<TaskDTO> getAllTasks() {
        return taskRepository.findByUserId(currentUserService.getCurrentUserId()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public TaskDTO getTaskById(Long id) {
        Task task = taskRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return mapToDTO(task);
    }

    public TaskDTO createTask(TaskDTO taskDTO) {
        Task task = mapToEntity(taskDTO);
        Task savedTask = taskRepository.save(task);
        return mapToDTO(savedTask);
    }

    public TaskDTO updateTask(Long id, TaskDTO taskDTO) {
        Task existingTask = taskRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        existingTask.setText(taskDTO.getText());
        existingTask.setCategory(taskDTO.getCategory());
        existingTask.setPriority(taskDTO.getPriority());
        existingTask.setDueDate(taskDTO.getDueDate());
        existingTask.setCompleted(taskDTO.isCompleted());

        Task updatedTask = taskRepository.save(existingTask);
        return mapToDTO(updatedTask);
    }

    public void deleteTask(Long id) {
        Task task = taskRepository.findByIdAndUserId(id, currentUserService.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        taskRepository.delete(task);
    }

    private TaskDTO mapToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setText(task.getText());
        dto.setCategory(task.getCategory());
        dto.setPriority(task.getPriority());
        dto.setDueDate(task.getDueDate());
        dto.setCompleted(task.isCompleted());
        return dto;
    }

    private Task mapToEntity(TaskDTO dto) {
        Task task = new Task();
        task.setText(dto.getText());
        task.setCategory(dto.getCategory());
        task.setPriority(dto.getPriority());
        task.setDueDate(dto.getDueDate());
        task.setCompleted(dto.isCompleted());
        task.setUser(currentUserService.getCurrentUser()); // Isolated temporary mechanism for Stage 5A
        return task;
    }
}
