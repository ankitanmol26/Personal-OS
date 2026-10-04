import { useEffect, useState } from "react";
import { getStorage, setStorage } from "../utils/storage";
import { isProjectOverdue } from "../utils/project";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, GitBranch, ExternalLink, Calendar, Code, CheckCircle, Circle, Trash2, ArrowLeft } from "lucide-react";

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
    <main className="dashboard">
      <div className="dashboard-header">
        <h2>Projects</h2>
        <p className="page-description">Track your development projects and progress.</p>
      </div>

      {!selectedProject ? (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <form className="project-form card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '24px', marginBottom: '32px' }} onSubmit={addProject}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Project Name</label>
                <input type="text" className="input-field" placeholder="e.g. Personal OS" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Description</label>
                <textarea className="input-field" placeholder="What does this project do?" value={description} onChange={(e) => setDescription(e.target.value)} style={{ resize: 'vertical', minHeight: '80px' }} />
              </div>
              <div className="form-group">
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Tech Stack</label>
                <input type="text" className="input-field" placeholder="React, Node.js" value={techStack} onChange={(e) => setTechStack(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Status</label>
                <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option>Planning</option><option>In Progress</option><option>Completed</option><option>On Hold</option>
                </select>
              </div>
              <div className="form-group">
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Progress (%)</label>
                <input type="number" min="0" max="100" className="input-field" placeholder="0" value={progress} onChange={(e) => setProgress(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Deadline</label>
                <input type="date" className="input-field" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>GitHub URL</label>
                <input type="url" className="input-field" placeholder="https://github.com/..." value={githubLink} onChange={(e) => setGithubLink(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="muted-text" style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>Live URL</label>
                <input type="url" className="input-field" placeholder="https://..." value={liveLink} onChange={(e) => setLiveLink(e.target.value)} />
              </div>
              
              <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn-primary">Add Project</button>
              </div>
            </form>

            <div className="project-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {projects.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <Folder size={48} className="text-muted" style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No projects added yet.</p>
                  <span className="muted-text" style={{ fontSize: '14px', marginTop: '8px', display: 'block' }}>Track your projects and see your development progress here.</span>
                </div>
              ) : (
                projects.map((project) => {
                  const overdue = isProjectOverdue(project);
                  return (
                    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="project-card card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }} key={project.id}>
                      <div className="project-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{project.name}</h3>
                          <span className={getStatusBadge(project.status)}>{project.status}</span>
                        </div>
                      </div>

                      <p className="project-description" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, flex: 1 }}>
                        {project.description}
                      </p>

                      <div className="project-meta" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                        <div className="flex items-center gap-xs text-muted" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Code size={14} /> <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{project.techStack || "Not specified"}</span>
                        </div>
                        {project.deadline && (
                          <div className={`flex items-center gap-xs ${overdue ? "text-danger" : "text-muted"}`} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <Calendar size={14} /> <span>{project.deadline} {overdue && "• Overdue"}</span>
                          </div>
                        )}
                      </div>

                      <div className="project-progress">
                        <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span className="font-medium">Progress</span>
                          <span className="muted-text">{project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <motion.div className="progress-fill" initial={{ width: "0%" }} whileInView={{ width: `${project.progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                        </div>
                      </div>

                      <div className="project-links" style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                        {project.githubLink && (
                          <a href={project.githubLink} target="_blank" rel="noreferrer" className="flex items-center gap-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px', transition: 'color var(--transition-fast)' }} onMouseOver={(e)=>e.currentTarget.style.color='var(--text-primary)'} onMouseOut={(e)=>e.currentTarget.style.color='var(--text-secondary)'}>
                            <GitBranch size={14} /> GitHub
                          </a>
                        )}
                        {project.liveLink && (
                          <a href={project.liveLink} target="_blank" rel="noreferrer" className="flex items-center gap-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
                            <ExternalLink size={14} /> Live Demo
                          </a>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                         <button type="button" className="btn-primary" style={{ backgroundColor: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 12px', fontSize: '12px' }} onClick={() => setSelectedProjectId(project.id)}>
                          Open Details
                        </button>
                        <button className="icon-button delete-button" onClick={() => deleteProject(project.id)} aria-label="Delete project">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence>
          <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="project-detail card" style={{ padding: '32px' }}>
            <div className="project-detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <button type="button" className="btn-primary flex items-center gap-xs" style={{ backgroundColor: 'transparent', color: 'var(--text-secondary)', padding: '6px 12px', fontSize: '13px' }} onClick={() => setSelectedProjectId(null)}>
                <ArrowLeft size={16} /> Back to Projects
              </button>
              <span className={getStatusBadge(selectedProject.status)}>{selectedProject.status}</span>
            </div>

            <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>{selectedProject.name}</h2>
            <p className="project-description" style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, marginBottom: '24px' }}>
              {selectedProject.description}
            </p>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="muted-text" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tech Stack</span>
                  <div className="flex items-center gap-xs" style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '500' }}>
                    <Code size={16} /> {selectedProject.techStack || "Not specified"}
                  </div>
               </div>
               
               {selectedProject.deadline && (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="muted-text" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</span>
                    <div className="flex items-center gap-xs" style={{ display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '500' }}>
                      <Calendar size={16} /> {selectedProject.deadline}
                    </div>
                 </div>
               )}
            </div>

            <div className="project-progress" style={{ marginBottom: '40px', padding: '24px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
              <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span className="font-medium">Overall Progress</span>
                <span className="font-bold text-accent">{selectedProject.progress}%</span>
              </div>
              <div className="progress-bar" style={{ height: '12px', borderRadius: '12px' }}>
                <motion.div className="progress-fill" initial={{ width: "0%" }} whileInView={{ width: `${selectedProject.progress}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ borderRadius: '12px' }} />
              </div>
            </div>

            <div className="project-detail-tasks">
              <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>Project Tasks</h3>
                <span className="badge">
                  {(selectedProject.tasks || []).filter((t) => t.completed).length} / {(selectedProject.tasks || []).length} Completed
                </span>
              </div>

              <div className="add-project-task" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="What needs to be done?"
                  value={taskInputs[selectedProject.id] || ""}
                  onChange={(e) => setTaskInputs({ ...taskInputs, [selectedProject.id]: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addProjectTask(selectedProject.id)}
                />
                <button type="button" className="btn-primary" onClick={() => addProjectTask(selectedProject.id)}>Add Task</button>
              </div>

              {(selectedProject.tasks || []).length === 0 ? (
                <div className="empty-state" style={{ padding: '24px' }}>
                  <p>No project tasks yet. Break down your project!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(selectedProject.tasks || []).map((task) => (
                     <div className={`planner-task ${task.completed ? 'task-completed' : ''}`} key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: task.completed ? 'var(--bg-primary)' : 'var(--bg-card)' }}>
                        <button className="task-checkbox" onClick={() => toggleProjectTask(selectedProject.id, task.id)}>
                          {task.completed ? <CheckCircle size={20} className="text-success" /> : <Circle size={20} className="text-muted" />}
                        </button>
                        <span className={`task-title flex-1 ${task.completed ? "muted-text strike-through" : ""}`} style={{ margin: 0, fontSize: '15px' }}>
                          {task.title}
                        </span>
                     </div>
                  ))}
                </div>
              )}
            </div>

            <div className="project-links" style={{ display: 'flex', gap: '16px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
              {selectedProject.githubLink && (
                <a href={selectedProject.githubLink} target="_blank" rel="noreferrer" className="btn-primary flex items-center gap-xs" style={{ backgroundColor: '#24292e' }}>
                  <GitBranch size={16} /> View Source
                </a>
              )}
              {selectedProject.liveLink && (
                <a href={selectedProject.liveLink} target="_blank" rel="noreferrer" className="btn-primary flex items-center gap-xs">
                  <ExternalLink size={16} /> Open App
                </a>
              )}
            </div>
          </motion.section>
        </AnimatePresence>
      )}
    </main>
  );
}

export default Projects;