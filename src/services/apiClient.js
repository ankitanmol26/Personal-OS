import { getAccessToken, clearAuth } from "../utils/authStorage";

// Production-grade authentication may use stronger browser session/token strategies 
// (e.g., http-only cookies) depending on the threat model, but localStorage is used here for simplicity.

const BASE_URL = "http://localhost:8080";

export const apiRequest = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (!path.includes("/auth/login") && !path.includes("/auth/register")) {
        clearAuth();
        window.dispatchEvent(new Event("auth:unauthorized"));
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || "An error occurred");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const apiGet = (path) => apiRequest(path, { method: "GET" });
export const apiPost = (path, body) => apiRequest(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = (path, body) => apiRequest(path, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = (path) => apiRequest(path, { method: "DELETE" });
