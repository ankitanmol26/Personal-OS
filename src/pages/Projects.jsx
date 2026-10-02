import { useEffect, useState } from "react";
import {
  getStorage,
  setStorage,
} from "../utils/storage";
import { isProjectOverdue } from "../utils/project";

function Projects() {
const [projects, setProjects] = useState(() => {
  return getStorage("projects");
});

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

    if (name.trim() === "") {
      return;
    }

    const newProject = {
      id: Date.now(),
      name: name,
      description: description,
      techStack: techStack,
      status: status,
      progress: Number(progress),
      deadline: deadline,
      githubLink: githubLink,
      liveLink: liveLink,
      tasks: [],
    };

    setProjects([...projects, newProject]);

    setName("");
    setDescription("");
    setTechStack("");
    setStatus("Planning");
    setProgress(0);
    setDeadline("");
    setGithubLink("");
    setLiveLink("");
  }

  function deleteProject(id) {
    setProjects(
      projects.filter((project) => project.id !== id)
    );
  }

  function addProjectTask(projectId) {
    const taskText = taskInputs[projectId]?.trim();

    if (!taskText) {
      return;
    }

    setProjects(
      projects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        const newTask = {
          id: Date.now(),
          title: taskText,
          completed: false,
        };

        return {
          ...project,
          tasks: [
            ...(project.tasks || []),
            newTask,
          ],
        };
      })
    );

    setTaskInputs({
      ...taskInputs,
      [projectId]: "",
    });
  }

  function toggleProjectTask(
    projectId,
    taskId
  ) {
    setProjects(
      projects.map((project) => {
        if (project.id !== projectId) {
          return project;
        }

        return {
          ...project,

          tasks: (project.tasks || []).map(
            (task) =>
              task.id === taskId
                ? {
                    ...task,
                    completed:
                      !task.completed,
                  }
                : task
          ),
        };
      })
    );
  }

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );

  return (
    <main className="dashboard">
      <h2>Projects</h2>

      <p className="page-description">
        Track your development projects and progress.
      </p>

      {!selectedProject && (
        <>
          {/* Add Project */}

          <form className="project-form" onSubmit={addProject}>

        <input
          type="text"
          placeholder="Project name"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
        />

        <textarea
          placeholder="Project description"
          value={description}
          onChange={(event) =>
            setDescription(event.target.value)
          }
        />

        <input
          type="text"
          placeholder="Tech stack e.g. React, Java, MySQL"
          value={techStack}
          onChange={(event) =>
            setTechStack(event.target.value)
          }
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
        >
          <option>Planning</option>
          <option>In Progress</option>
          <option>Completed</option>
          <option>On Hold</option>
        </select>

        <input
          type="number"
          min="0"
          max="100"
          placeholder="Progress %"
          value={progress}
          onChange={(event) =>
            setProgress(event.target.value)
          }
        />

        <input
          type="date"
          value={deadline}
          onChange={(event) =>
            setDeadline(event.target.value)
          }
        />

        <input
          type="url"
          placeholder="GitHub URL"
          value={githubLink}
          onChange={(event) =>
            setGithubLink(event.target.value)
          }
        />

        <input
          type="url"
          placeholder="Live / Demo URL"
          value={liveLink}
          onChange={(event) =>
            setLiveLink(event.target.value)
          }
        />

        <button type="submit">
          Add Project
        </button>

      </form>

      {/* Project List */}

      <div className="project-list">

        {projects.length === 0 ? (
          <p className="empty-message">
            No projects added yet.
          </p>
        ) : (
          projects.map((project) => {
            const overdue = isProjectOverdue(project);

            return (
              <div
                className="project-card"
                key={project.id}
              >

              <div className="project-header">
                <div>
                  <h3>{project.name}</h3>
                  <span className="project-status">
                    {project.status}
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProjectId(project.id)
                    }
                  >
                    Open Project
                  </button>
                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteProject(project.id)
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="project-description">
                {project.description}
              </p>

              <p>
                <strong>Tech Stack:</strong>{" "}
                {project.techStack || "Not specified"}
              </p>

              {project.deadline && (
                <p className={overdue ? "project-overdue" : ""}>
                  <strong>Deadline:</strong>{" "}
                  {project.deadline}
                  {overdue && " • Overdue"}
                </p>
              )}

              <div className="project-progress">

                <div className="progress-header">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${project.progress}%`,
                    }}
                  ></div>
                </div>

              </div>

              <div className="project-links">

                {project.githubLink && (
                  <a
                    href={project.githubLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub →
                  </a>
                )}

                {project.liveLink && (
                  <a
                    href={project.liveLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Live Demo →
                  </a>
                )}

              </div>

              <div className="project-tasks">

                <div className="project-tasks-header">
                  <h4>Project Tasks</h4>

                  <span>
                    {(project.tasks || []).filter(
                      (task) => task.completed
                    ).length}
                    /
                    {(project.tasks || []).length}
                  </span>
                </div>

                <div className="add-project-task">

                  <input
                    type="text"
                    placeholder="Add project task..."
                    value={
                      taskInputs[project.id] || ""
                    }
                    onChange={(event) =>
                      setTaskInputs({
                        ...taskInputs,
                        [project.id]:
                          event.target.value,
                      })
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      addProjectTask(project.id)
                    }
                  >
                    Add
                  </button>

                </div>

                <div className="project-task-list">

                  {(project.tasks || []).map((task) => (
                    <label
                      className="project-task"
                      key={task.id}
                    >

                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() =>
                          toggleProjectTask(
                            project.id,
                            task.id
                          )
                        }
                      />

                      <span
                        className={
                          task.completed
                            ? "completed-task"
                            : ""
                        }
                      >
                        {task.title}
                      </span>

                    </label>
                  ))}

                </div>

              </div>

            </div>
            );
          })
        )}

      </div>
      </>
      )}

      {selectedProject && (
        <section className="project-detail">
          <div className="project-detail-header">
            <button
              type="button"
              onClick={() =>
                setSelectedProjectId(null)
              }
            >
              ← Back to Projects
            </button>

            <span className="project-status">
              {selectedProject.status}
            </span>
          </div>

          <h2>{selectedProject.name}</h2>

          <p className="project-description">
            {selectedProject.description}
          </p>

          <p>
            <strong>Tech Stack:</strong>{" "}
            {selectedProject.techStack ||
              "Not specified"}
          </p>

          {selectedProject.deadline && (
            <p>
              <strong>Deadline:</strong>{" "}
              {selectedProject.deadline}
            </p>
          )}

          <div className="project-progress">
            <div className="progress-header">
              <span>Progress</span>
              <span>
                {selectedProject.progress}%
              </span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${selectedProject.progress}%`,
                }}
              />
            </div>
          </div>

          <div className="project-detail-tasks">
            <h3>Project Tasks</h3>

            {(selectedProject.tasks || []).length === 0 ? (
              <p className="empty-message">
                No project tasks yet.
              </p>
            ) : (
              (selectedProject.tasks || []).map(
                (task) => (
                  <label
                    className="project-task"
                    key={task.id}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() =>
                        toggleProjectTask(
                          selectedProject.id,
                          task.id
                        )
                      }
                    />

                    <span
                      className={
                        task.completed
                          ? "completed-task"
                          : ""
                      }
                    >
                      {task.title}
                    </span>
                  </label>
                )
              )
            )}
          </div>

          <div className="project-links">
            {selectedProject.githubLink && (
              <a
                href={selectedProject.githubLink}
                target="_blank"
                rel="noreferrer"
              >
                GitHub →
              </a>
            )}

            {selectedProject.liveLink && (
              <a
                href={selectedProject.liveLink}
                target="_blank"
                rel="noreferrer"
              >
                Live Demo →
              </a>
            )}
          </div>
        </section>
      )}

    </main>
  );
}

export default Projects;