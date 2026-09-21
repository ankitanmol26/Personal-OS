import { useEffect, useState } from "react";

function Projects() {
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem("projects");

    return savedProjects
      ? JSON.parse(savedProjects)
      : [];
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [status, setStatus] = useState("Planning");
  const [progress, setProgress] = useState(0);
  const [githubLink, setGithubLink] = useState("");
  const [liveLink, setLiveLink] = useState("");

  useEffect(() => {
    localStorage.setItem(
      "projects",
      JSON.stringify(projects)
    );
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
      githubLink: githubLink,
      liveLink: liveLink,
    };

    setProjects([...projects, newProject]);

    setName("");
    setDescription("");
    setTechStack("");
    setStatus("Planning");
    setProgress(0);
    setGithubLink("");
    setLiveLink("");
  }

  function deleteProject(id) {
    setProjects(
      projects.filter((project) => project.id !== id)
    );
  }

  return (
    <main className="dashboard">
      <h2>Projects</h2>

      <p className="page-description">
        Track your development projects and progress.
      </p>

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
          projects.map((project) => (
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

                <button
                  className="delete-button"
                  onClick={() =>
                    deleteProject(project.id)
                  }
                >
                  Delete
                </button>
              </div>

              <p className="project-description">
                {project.description}
              </p>

              <p>
                <strong>Tech Stack:</strong>{" "}
                {project.techStack || "Not specified"}
              </p>

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

            </div>
          ))
        )}

      </div>
    </main>
  );
}

export default Projects;