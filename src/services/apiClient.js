import { getAccessToken, setAccessToken, clearAuth, setStoredUser } from "../utils/authStorage.js";

export const BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) || "http://localhost:8080";

let refreshPromise = null;

const requestRefreshToken = async () => {
  try {
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    const refreshData = await refreshRes.json().catch(() => null);

    if (!refreshRes.ok || !refreshData?.accessToken) {
      const error = new Error(refreshData?.error || refreshData?.message || "Session refresh failed");
      error.status = refreshRes.status;
      error.data = refreshData;
      throw error;
    }

    setAccessToken(refreshData.accessToken);
    if (refreshData.userId) {
      setStoredUser({
        id: refreshData.userId,
        name: refreshData.name,
        email: refreshData.email,
        avatarUrl: refreshData.avatarUrl,
      });
    }

    return refreshData.accessToken;
  } catch (err) {
    clearAuth();
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    throw err;
  } finally {
    refreshPromise = null;
  }
};

const getSharedRefreshPromise = () => {
  if (!refreshPromise) {
    refreshPromise = requestRefreshToken();
  }
  return refreshPromise;
};

export const apiRequest = async (path, options = {}) => {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const token = getAccessToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: options.credentials || "include",
  };

  const response = await fetch(url, fetchOptions);

  if (response.status === 401) {
    const isAuthEndpoint =
      path.includes("/api/auth/login") ||
      path.includes("/api/auth/register") ||
      path.includes("/api/auth/google") ||
      path.includes("/api/auth/refresh") ||
      path.includes("/api/auth/logout");

    if (!isAuthEndpoint) {
      if (options._retry) {
        // A retried request encountered a second 401:
        // The refreshed session is invalid or rejected by the server.
        // Clear authentication immediately so the app is not left in a misleading authenticated state.
        clearAuth();
        if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
          window.dispatchEvent(new Event("auth:unauthorized"));
        }
      } else {
        try {
          const newToken = await getSharedRefreshPromise();

          // Retry original request with new access token
          const retryHeaders = {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          };

          return await apiRequest(path, {
            ...options,
            _retry: true,
            headers: retryHeaders,
          });
        } catch (refreshErr) {
          // Refresh failed for this coordinated cycle.
          // Consume the original response body to provide error context
          const originalData = await response.json().catch(() => null);
          const error = new Error(
            originalData?.error || originalData?.message || refreshErr.message || "Unauthorized"
          );
          error.status = response.status || 401;
          error.data = originalData || refreshErr.data;
          throw error;
        }
      }
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

export const apiGet = (path, options = {}) => apiRequest(path, { method: "GET", ...options });
export const apiPost = (path, body, options = {}) => apiRequest(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, ...options });
export const apiPut = (path, body, options = {}) => apiRequest(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, ...options });
export const apiDelete = (path, options = {}) => apiRequest(path, { method: "DELETE", ...options });
