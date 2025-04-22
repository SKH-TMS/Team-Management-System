"use client";

import React, { createContext, useState, useEffect } from "react";

interface AuthContextType {
  userStatus: any;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  userStatus: null,
  refreshAuth: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userStatus, setUserStatus] = useState(null);

  const refreshAuth = async () => {
    try {
      const response = await fetch("/api/auth/UserStatus", {
        method: "POST",
      });
      const data = await response.json();
      setUserStatus(data);
    } catch (error) {
      console.error("Error refreshing auth", error);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ userStatus, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
