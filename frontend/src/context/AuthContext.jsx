import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, loginUser, registerUser } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await fetchMe();
      setUser(data);
    } catch {
      localStorage.removeItem("access_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser(email, password);
    localStorage.setItem("access_token", data.access_token);
    await loadUser();
  };

  const register = async (payload) => {
    const { data } = await registerUser(payload);
    localStorage.setItem("access_token", data.access_token);
    await loadUser();
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
