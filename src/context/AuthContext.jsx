import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { login as loginRequest } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(() => localStorage.getItem("hb_username"));
  const [name, setName] = useState(() => localStorage.getItem("hb_name"));
  const [token, setToken] = useState(() => localStorage.getItem("hb_token"));

  const login = useCallback(async (usernameInput, password) => {
    const data = await loginRequest(usernameInput, password);
    localStorage.setItem("hb_token", data.token);
    localStorage.setItem("hb_username", data.username);
    localStorage.setItem("hb_name", data.name);
    setToken(data.token);
    setUsername(data.username);
    setName(data.name);
    return data;
  }, []);

  const setSession = useCallback((data) => {
    localStorage.setItem("hb_token", data.token);
    localStorage.setItem("hb_username", data.username);
    localStorage.setItem("hb_name", data.name);
    setToken(data.token);
    setUsername(data.username);
    setName(data.name);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("hb_token");
    localStorage.removeItem("hb_username");
    localStorage.removeItem("hb_name");
    setToken(null);
    setUsername(null);
    setName(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      username,
      name,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setSession,
    }),
    [token, username, name, login, logout, setSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
