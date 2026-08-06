import React, { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { identifier, password });
      const { user: userData, token: jwtToken } = response.data.data;

      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(jwtToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed. Please check your credentials.";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (formData) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/register-student", formData);
      const { user: userData, token: jwtToken, message } = response.data.data || {};

      if (jwtToken && userData) {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
      }
      return { success: true, message: message || response.data?.message || "Registered successfully", user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed. Please check input fields.";
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        registerStudent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
