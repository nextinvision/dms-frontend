"use client";
import { createContext, useContext, useState, useEffect } from "react";

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [userRole, setUserRole] = useState("admin"); // Default to admin
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get role from localStorage or session
    const storedRole = localStorage.getItem("userRole") || "admin";
    const storedUser = JSON.parse(localStorage.getItem("userInfo") || "null");
    setUserRole(storedRole);
    setUserInfo(storedUser);
  }, []);

  const updateRole = (role, user) => {
    setUserRole(role);
    setUserInfo(user);
    localStorage.setItem("userRole", role);
    localStorage.setItem("userInfo", JSON.stringify(user));
  };

  return (
    <RoleContext.Provider value={{ userRole, userInfo, updateRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
};

