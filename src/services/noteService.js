import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export async function getNotes() {
  return await apiGet('/api/notes');
}

export async function createNote(data) {
  return await apiPost('/api/notes', data);
}

export async function updateNote(id, data) {
  return await apiPut(`/api/notes/${id}`, data);
}

export async function deleteNote(id) {
  return await apiDelete(`/api/notes/${id}`);
}
