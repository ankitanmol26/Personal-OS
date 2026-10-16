import { getAccessToken, setAccessToken, clearAuth, setStoredUser } from "../utils/authStorage";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

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

  const fetchOptions = {
    ...options,
    headers,
    credentials: options.credentials || "include",
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.status === 401) {
      const isAuthEndpoint =
        path.includes("/api/auth/login") ||
        path.includes("/api/auth/register") ||
        path.includes("/api/auth/google") ||
        path.includes("/api/auth/refresh");

      if (!isAuthEndpoint) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              if (refreshData.accessToken) {
                setAccessToken(refreshData.accessToken);
                if (refreshData.userId) {
                  setStoredUser({
                    id: refreshData.userId,
                    name: refreshData.name,
                    email: refreshData.email,
                    avatarUrl: refreshData.avatarUrl,
                  });
                }
                isRefreshing = false;
                onRefreshed(refreshData.accessToken);

                // Retry original request with new token
                const retryHeaders = {
                  ...headers,
                  Authorization: `Bearer ${refreshData.accessToken}`,
                };
                const retryRes = await fetch(url, { ...fetchOptions, headers: retryHeaders });
                const retryData = await retryRes.json().catch(() => null);
                if (!retryRes.ok) {
                  const error = new Error(retryData?.error || retryData?.message || "An error occurred");
                  error.status = retryRes.status;
                  error.data = retryData;
                  throw error;
                }
                return retryData;
              }
            }
          } catch (refreshErr) {
            // refresh failed
          } finally {
            isRefreshing = false;
          }

          clearAuth();
          window.dispatchEvent(new Event("auth:unauthorized"));
        } else {
          // Wait for the in-flight refresh to finish
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh(async (newToken) => {
              try {
                const retryHeaders = {
                  ...headers,
                  Authorization: `Bearer ${newToken}`,
                };
                const retryRes = await fetch(url, { ...fetchOptions, headers: retryHeaders });
                const retryData = await retryRes.json().catch(() => null);
                if (!retryRes.ok) {
                  const error = new Error(retryData?.error || retryData?.message || "An error occurred");
                  error.status = retryRes.status;
                  error.data = retryData;
                  reject(error);
                } else {
                  resolve(retryData);
                }
              } catch (err) {
                reject(err);
              }
            });
          });
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
  } catch (err) {
    throw err;
  }
};

export const apiGet = (path, options = {}) => apiRequest(path, { method: "GET", ...options });
export const apiPost = (path, body, options = {}) => apiRequest(path, { method: "POST", body: body ? JSON.stringify(body) : undefined, ...options });
export const apiPut = (path, body, options = {}) => apiRequest(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined, ...options });
export const apiDelete = (path, options = {}) => apiRequest(path, { method: "DELETE", ...options });
