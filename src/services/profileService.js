import { apiGet, apiPut } from './apiClient';

export async function getProfile() {
  return await apiGet("/api/profile/me");
}

export async function updateProfile(data) {
  return await apiPut("/api/profile/me", data);
}

export async function changePassword(data) {
  return await apiPut("/api/profile/me/password", data);
}
