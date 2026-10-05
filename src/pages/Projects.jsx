import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../utils/storage";
import { isProjectOverdue } from "../utils/project";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, GitBranch, ExternalLink, Calendar, Code, CheckCircle, Circle, Trash2, ArrowLeft, Plus } from "lucide-react";
import "./Projects.css";

function getStatusBadge(status) {
  switch (status) {
    case "Planning": return "badge badge-info";
    case "In Progress": return "badge badge-warning";
    case "Completed": return "badge badge-success";
    case "On Hold": return "badge";
    default: return "badge";
  }
}

function Projects() {
  const [projects, setProjects] = useState(() => getStorage("projects"));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [status, setStatus] = useState("Planning");
  const [progress, setProgress] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [liveLink, setLiveLink] = useState("");
  const [taskInputs, setTaskInputs] = useState({});
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  useEffect(() => {
    setStorage("projects", projects);
  }, [projects]);

  function addProject(event) {
    event.preventDefault();
    if (name.trim() === "") return;

    const newProject = {
      id: Date.now(),
      name, description, techStack, status,
      progress: Number(progress), deadline, githubLink, liveLink, tasks: [],
    };

    setProjects([...projects, newProject]);
    setName(""); setDescription(""); setTechStack(""); setStatus("Planning");
    setProgress(0); setDeadline(""); setGithubLink(""); setLiveLink("");
  }

  function deleteProject(id) {
    setProjects(projects.filter((project) => project.id !== id));
  }

  function addProjectTask(projectId) {
    const taskText = taskInputs[projectId]?.trim();
    if (!taskText) return;

    setProjects(
      projects.map((project) => {
        if (project.id !== projectId) return project;
        return { ...project, tasks: [...(project.tasks || []), { id: Date.now(), title: taskText, completed: false }] };
      })
    );
    setTaskInputs({ ...taskInputs, [projectId]: "" });
  }

  function toggleProjectTask(projectId, taskId) {
    setProjects(
      projects.map((project) => {
        if (project.id !== projectId) return project;
        return {
          ...project,
          tasks: (project.tasks || []).map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
        };
      })
    );
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  return (
    <main className="projects-page">
      <div className="projects-header">
        <h2>Projects</h2>
        <p>Track your development projects and progress.</p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedProject ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <form className="projects-form" onSubmit={addProject}>
              <h3 className="projects-form-header">Add New Project</h3>
              <div className="projects-form-grid">
                <div className="projects-input-group full-width">
                  <label className="projects-input-label">Project Name</label>
                  <input type="text" className="projects-input" placeholder="e.g. Personal OS" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="projects-input-group full-width">
                  <label className="projects-input-label">Description</label>
                  <textarea className="projects-textarea" placeholder="What does this project do?" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="projects-input-group">
                  <label className="projects-input-label">Tech Stack</label>
                  <input type="text" className="projects-input" placeholder="React, Node.js" value={techStack} onChange={(e) => setTechStack(e.target.value)} />
                </div>
                <div className="projects-input-group">
                  <label className="projects-input-label">Status</label>
                  <select className="projects-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div className="projects-input-group">
                  <label className="projects-input-label">Progress (%)</label>
                  <input type="number" min="0" max="100" className="projects-input" placeholder="0" value={progress} onChange={(e) => setProgress(e.target.value)} />
                </div>
                <div className="projects-input-group">
                  <label className="projects-input-label">Deadline</label>
                  <input type="date" className="projects-input" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
                <div className="projects-input-group">
                  <label className="projects-input-label">GitHub URL</label>
                  <input type="url" className="projects-input" placeholder="https://github.com/..." value={githubLink} onChange={(e) => setGithubLink(e.target.value)} />
                </div>
                <div className="projects-input-group">
                  <label className="projects-input-label">Live URL</label>
                  <input type="url" className="projects-input" placeholder="https://..." value={liveLink} onChange={(e) => setLiveLink(e.target.value)} />
                </div>
                
                <div className="projects-input-group full-width" style={{ alignItems: 'flex-end', marginTop: '8px' }}>
                  <button type="submit" className="projects-btn-primary">
                    <Plus size={16} /> Add Project
                  </button>
                </div>
              </div>
            </form>

            <div className="projects-list">
              {projects.length === 0 ? (
                <div className="projects-empty">
                  <Folder size={48} className="projects-empty-icon" />
                  <span className="projects-empty-title">No projects added yet</span>
                  <span className="projects-empty-desc">Track your projects and see your development progress here.</span>
                </div>
              ) : (
                <AnimatePresence>
                  {projects.map((project, idx) => {
                    const overdue = isProjectOverdue(project);
                    return (
                      <motion.div 
                        layout 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="project-card" 
                        key={project.id}
                      >
                        <div className="project-header">
                          <div className="project-title-group">
                            <h3 className="project-title">{project.name}</h3>
                            <span className={getStatusBadge(project.status)}>{project.status}</span>
                          </div>
                        </div>

                        <p className="project-description">
                          {project.description || "No description provided."}
                        </p>

                        <div className="project-meta">
                          <div className="project-meta-item">
                            <Code size={14} className="icon" /> 
                            <span style={{ color: 'var(--text-primary)' }}>{project.techStack || "Not specified"}</span>
                          </div>
                          {project.deadline && (
                            <div className={`project-meta-item ${overdue ? "overdue" : ""}`}>
                              <Calendar size={14} className="icon" /> 
                              <span>{project.deadline} {overdue && "• Overdue"}</span>
                            </div>
                          )}
                        </div>

                        <div className="project-progress-section">
                          <div className="project-progress-header">
                            <span className="project-progress-label">Progress</span>
                            <span className="project-progress-value">{project.progress}%</span>
                          </div>
                          <div className="project-progress-bar">
                            <motion.div 
                              className="project-progress-fill" 
                              initial={{ width: "0%" }} 
                              whileInView={{ width: `${project.progress}%` }} 
                              viewport={{ once: true }} 
                              transition={{ duration: 0.8 }} 
                            />
                          </div>
                        </div>

                        <div className="project-links">
                          {project.githubLink && (
                            <a href={project.githubLink} target="_blank" rel="noreferrer" className="project-link">
                              <GitBranch size={14} /> GitHub
                            </a>
                          )}
                          {project.liveLink && (
                            <a href={project.liveLink} target="_blank" rel="noreferrer" className="project-link accent">
                              <ExternalLink size={14} /> Live Demo
                            </a>
                          )}
                        </div>

                        <div className="project-card-actions">
                          <button type="button" className="projects-btn-secondary" onClick={() => setSelectedProjectId(project.id)}>
                            Open Details
                          </button>
                          <button type="button" className="project-btn-icon delete" onClick={() => deleteProject(project.id)} aria-label="Delete project">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="detail"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            transition={{ duration: 0.2 }}
            className="project-detail-view"
          >
            <div className="project-detail-header">
              <button type="button" className="projects-btn-secondary" onClick={() => setSelectedProjectId(null)}>
                <ArrowLeft size={16} /> Back to Projects
              </button>
              <span className={getStatusBadge(selectedProject.status)}>{selectedProject.status}</span>
            </div>

            <h2 className="project-detail-title">{selectedProject.name}</h2>
            <p className="project-detail-description">
              {selectedProject.description || "No description provided."}
            </p>

            <div className="project-detail-meta">
               <div className="project-detail-meta-group">
                  <span className="project-detail-meta-label">Tech Stack</span>
                  <div className="project-detail-meta-value">
                    <Code size={16} style={{ color: 'var(--text-muted)' }} /> {selectedProject.techStack || "Not specified"}
                  </div>
               </div>
               
               {selectedProject.deadline && (
                 <div className="project-detail-meta-group">
                    <span className="project-detail-meta-label">Deadline</span>
                    <div className="project-detail-meta-value">
                      <Calendar size={16} style={{ color: 'var(--text-muted)' }} /> {selectedProject.deadline}
                    </div>
                 </div>
               )}
            </div>

            <div className="project-detail-progress">
              <div className="project-progress-section">
                <div className="project-progress-header">
                  <span className="project-progress-label" style={{ fontSize: '15px' }}>Overall Progress</span>
                  <span className="project-progress-value" style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>{selectedProject.progress}%</span>
                </div>
                <div className="project-progress-bar" style={{ height: '12px' }}>
                  <motion.div 
                    className="project-progress-fill" 
                    initial={{ width: "0%" }} 
                    animate={{ width: `${selectedProject.progress}%` }} 
                    transition={{ duration: 0.8 }} 
                  />
                </div>
              </div>
            </div>

            <div className="project-tasks-section">
              <div className="project-tasks-header">
                <h3 className="project-tasks-title">Project Tasks</h3>
                <span className="badge">
                  {(selectedProject.tasks || []).filter((t) => t.completed).length} / {(selectedProject.tasks || []).length} Completed
                </span>
              </div>

              <div className="project-add-task">
                <input
                  type="text"
                  className="projects-input"
                  placeholder="What needs to be done?"
                  value={taskInputs[selectedProject.id] || ""}
                  onChange={(e) => setTaskInputs({ ...taskInputs, [selectedProject.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addProjectTask(selectedProject.id)}
                />
                <button type="button" className="projects-btn-primary" onClick={() => addProjectTask(selectedProject.id)}>
                  <Plus size={16} /> Add Task
                </button>
              </div>

              {(selectedProject.tasks || []).length === 0 ? (
                <div className="projects-empty" style={{ padding: '32px 16px' }}>
                  <p className="projects-empty-title">No project tasks yet</p>
                  <p className="projects-empty-desc">Break down your project into manageable tasks!</p>
                </div>
              ) : (
                <div className="project-task-list">
                  <AnimatePresence>
                    {(selectedProject.tasks || []).map((task) => (
                       <motion.div 
                         layout
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         className={`project-task-item ${task.completed ? 'completed' : ''}`} 
                         key={task.id}
                        >
                          <button 
                            className={`project-task-checkbox ${task.completed ? "checked" : ""}`} 
                            onClick={() => toggleProjectTask(selectedProject.id, task.id)}
                          >
                            <AnimatePresence mode="wait">
                              {task.completed ? (
                                <motion.div key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                                  <CheckCircle size={22} />
                                </motion.div>
                              ) : (
                                <motion.div key="circle" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                                  <Circle size={22} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                          <span className="project-task-title">
                            {task.title}
                          </span>
                       </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="project-detail-actions">
              {selectedProject.githubLink && (
                <a href={selectedProject.githubLink} target="_blank" rel="noreferrer" className="projects-btn-secondary" style={{ backgroundColor: '#24292e', color: '#fff', borderColor: '#24292e' }}>
                  <GitBranch size={16} /> View Source
                </a>
              )}
              {selectedProject.liveLink && (
                <a href={selectedProject.liveLink} target="_blank" rel="noreferrer" className="projects-btn-primary">
                  <ExternalLink size={16} /> Open App
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default Projects;