const TOKEN_KEY = "personalos_access_token";
const USER_KEY = "personalos_user";

export const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const removeAccessToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  const userString = localStorage.getItem(USER_KEY);
  if (!userString) return null;
  try {
    return JSON.parse(userString);
  } catch (error) {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
};

export const removeStoredUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const clearAuth = () => {
  removeAccessToken();
  removeStoredUser();
};
