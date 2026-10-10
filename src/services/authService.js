import { apiPost, apiGet } from "./apiClient";

export const registerUser = async (data) => {
  return await apiPost("/api/auth/register", data);
};

export const loginUser = async (credentials) => {
  return await apiPost("/api/auth/login", credentials);
};

export const getCurrentUser = async () => {
  return await apiGet("/api/auth/me");
};

export const getGoogleOAuthState = async () => {
  return await apiGet("/api/auth/google/state", { credentials: "include" });
};

export const loginWithGoogle = async (payload) => {
  return await apiPost("/api/auth/google", payload, { credentials: "include" });
};
