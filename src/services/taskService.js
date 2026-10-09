import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export async function getTasks() {
  return await apiGet('/api/tasks');
}

export async function createTask(data) {
  return await apiPost('/api/tasks', data);
}

export async function updateTask(id, data) {
  return await apiPut(`/api/tasks/${id}`, data);
}

export async function deleteTask(id) {
  return await apiDelete(`/api/tasks/${id}`);
}
