const API_URL = 'http://localhost:8080/api/projects';

export async function getProjects() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  return response.json();
}

export async function createProject(project) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Create project failed:", response.status, errorBody);
    throw new Error(`Failed to create project: ${response.status} ${errorBody}`);
  }

  return response.json();
}

export async function deleteProject(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete project');
  }
}

export async function addProjectTask(projectId, task) {
  const response = await fetch(`${API_URL}/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error('Failed to add project task');
  }

  return response.json();
}

export async function updateProjectTask(projectId, taskId, task) {
  const response = await fetch(`${API_URL}/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    throw new Error('Failed to update project task');
  }

  return response.json();
}
