import { createContext, useContext, useState, useEffect } from "react";
import { getAccessToken, setAccessToken, getStoredUser, setStoredUser, clearAuth } from "../utils/authStorage";
import { getCurrentUser, loginUser, registerUser as registerApiService, loginWithGoogle } from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        if (error.status === 401) {
          clearAuth();
          setIsAuthenticated(false);
          setUser(null);
        } else {
          const storedUser = getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          } else {
            clearAuth();
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const handleUnauthorized = () => {
      clearAuth();
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    
    return () => {
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

  const logout = () => {
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
