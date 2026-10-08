package com.personalos.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "project_tasks")
public class ProjectTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private boolean completed;

    @ManyToOne
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    public ProjectTask() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }
}
