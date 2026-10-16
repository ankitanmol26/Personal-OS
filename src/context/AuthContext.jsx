import { createContext, useContext, useState, useEffect } from "react";
import { getAccessToken, setAccessToken, getStoredUser, setStoredUser, clearAuth } from "../utils/authStorage";
import { getCurrentUser, loginUser, registerUser as registerApiService, loginWithGoogle, refreshTokenApi, logoutUser } from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = getAccessToken();
      const storedUser = getStoredUser();

      if (token) {
        try {
          const userData = await getCurrentUser();
          if (isMounted) {
            setUser(userData);
            setStoredUser(userData);
            setIsAuthenticated(true);
            setIsLoading(false);
          }
          return;
        } catch (error) {
          if (error.status !== 401) {
            // Transient network error - don't logout if we have stored user
            if (storedUser && isMounted) {
              setUser(storedUser);
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          }
        }
      }

      // If token is missing or returned 401, try restoring via HttpOnly refresh token cookie
      try {
        const refreshResponse = await refreshTokenApi();
        if (refreshResponse && refreshResponse.accessToken) {
          setAccessToken(refreshResponse.accessToken);
          const restoredUser = {
            id: refreshResponse.userId,
            name: refreshResponse.name,
            email: refreshResponse.email,
            avatarUrl: refreshResponse.avatarUrl,
          };
          setStoredUser(restoredUser);
          if (isMounted) {
            setUser(restoredUser);
            setIsAuthenticated(true);
            setIsLoading(false);
          }
          return;
        }
      } catch (refreshErr) {
        // Refresh token invalid or absent
        if (!refreshErr.status && storedUser && isMounted) {
          // Offline / transient network failure during refresh - keep optimistic session
          setUser(storedUser);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      }

      // Both access token and refresh token failed
      if (isMounted) {
        clearAuth();
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
      }
    };

    restoreSession();

    const handleUnauthorized = () => {
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = async (credentials) => {
    const response = await loginUser(credentials);

    setAccessToken(response.accessToken);
    const safeUser = {
      id: response.userId,
      name: response.name,
      email: response.email,
      avatarUrl: response.avatarUrl,
    };
    setStoredUser(safeUser);

    setUser(safeUser);
    setIsAuthenticated(true);
    return response;
  };

  const googleLogin = async (payload) => {
    const response = await loginWithGoogle(payload);

    setAccessToken(response.accessToken);
    const safeUser = {
      id: response.userId,
      name: response.name,
      email: response.email,
      avatarUrl: response.avatarUrl,
    };
    setStoredUser(safeUser);

    setUser(safeUser);
    setIsAuthenticated(true);
    return response;
  };

  const register = async (data) => {
    return await registerApiService(data);
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // ignore
    }
    clearAuth();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setStoredUser(newUser);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, googleLogin, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
