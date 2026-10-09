import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export async function getPlannerTasks() {
  return await apiGet('/api/planner-tasks');
}

export async function createPlannerTask(data) {
  return await apiPost('/api/planner-tasks', data);
}

export async function updatePlannerTask(id, data) {
  return await apiPut(`/api/planner-tasks/${id}`, data);
}

export async function deletePlannerTask(id) {
  return await apiDelete(`/api/planner-tasks/${id}`);
}
