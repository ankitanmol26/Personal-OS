import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export async function getProjects() {
  return await apiGet('/api/projects');
}

export async function createProject(data) {
  return await apiPost('/api/projects', data);
}

export async function updateProject(id, data) {
  return await apiPut(`/api/projects/${id}`, data);
}

export async function deleteProject(id) {
  return await apiDelete(`/api/projects/${id}`);
}

export async function addProjectTask(projectId, task) {
  return await apiPost(`/api/projects/${projectId}/tasks`, task);
}

export async function updateProjectTask(projectId, taskId, task) {
  return await apiPut(`/api/projects/${projectId}/tasks/${taskId}`, task);
}
