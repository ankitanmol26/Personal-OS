package com.personalos.backend.dto;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ProjectDTO {
    private Long id;
    private String name;
    private String description;
    private String techStack;
    private String status;
    private int progress;
    private LocalDate deadline;
    private String githubLink;
    private String liveLink;
    private List<ProjectTaskDTO> tasks = new ArrayList<>();

    public ProjectDTO() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTechStack() { return techStack; }
    public void setTechStack(String techStack) { this.techStack = techStack; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getProgress() { return progress; }
    public void setProgress(int progress) { this.progress = progress; }

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public String getGithubLink() { return githubLink; }
    public void setGithubLink(String githubLink) { this.githubLink = githubLink; }

    public String getLiveLink() { return liveLink; }
    public void setLiveLink(String liveLink) { this.liveLink = liveLink; }

    public List<ProjectTaskDTO> getTasks() { return tasks; }
    public void setTasks(List<ProjectTaskDTO> tasks) { this.tasks = tasks; }
}
