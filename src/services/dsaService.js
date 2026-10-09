import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export async function getProblems() {
  return await apiGet('/api/dsa');
}

export async function createProblem(data) {
  return await apiPost('/api/dsa', data);
}

export async function updateProblem(id, data) {
  return await apiPut(`/api/dsa/${id}`, data);
}

export async function deleteProblem(id) {
  return await apiDelete(`/api/dsa/${id}`);
}
