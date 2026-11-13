"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
  isAuthenticated: boolean;
  isProyectosAuthenticated: boolean;
  isVerificacionAuthenticated: boolean;
  isLoading: boolean;
  loginGlobal: (password: string) => boolean;
  loginProyectos: (password: string) => boolean;
  loginVerificacion: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isProyectosAuthenticated: false,
  isVerificacionAuthenticated: false,
  isLoading: true,
  loginGlobal: () => false,
  loginProyectos: () => false,
  loginVerificacion: () => false,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProviderInternal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isProyectosAuthenticated, setIsProyectosAuthenticated] =
    useState<boolean>(false);
  const [isVerificacionAuthenticated, setIsVerificacionAuthenticated] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicialización desde sessionStorage
  useEffect(() => {
    try {
      const authGlobal = sessionStorage.getItem("sigac_auth");
      const authProyectos = sessionStorage.getItem("sigac_proyectos_auth");
      const authVerificacion = sessionStorage.getItem("sigac_verificacion_auth");

      if (authGlobal === "ok") {
        setIsAuthenticated(true);
      }
      if (authProyectos === "ok") {
        setIsProyectosAuthenticated(true);
      }
      if (authVerificacion === "ok") {
        setIsVerificacionAuthenticated(true);
      }
    } catch (e) {
      console.error("Error al acceder a sessionStorage:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginGlobal = (password: string): boolean => {
    if (password.trim().toLowerCase() === "obras") {
      try {
        sessionStorage.setItem("sigac_auth", "ok");
      } catch (e) {
        console.error("Error al escribir sigac_auth:", e);
      }
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const loginProyectos = (password: string): boolean => {
    if (password.trim().toLowerCase() === "contrata") {
      try {
        sessionStorage.setItem("sigac_proyectos_auth", "ok");
      } catch (e) {
        console.error("Error al escribir sigac_proyectos_auth:", e);
      }
      setIsProyectosAuthenticated(true);
      return true;
    }
    return false;
  };

  const loginVerificacion = (password: string): boolean => {
    if (password.trim().toLowerCase() === "contrata") {
      try {
        sessionStorage.setItem("sigac_verificacion_auth", "ok");
      } catch (e) {
        console.error("Error al escribir sigac_verificacion_auth:", e);
      }
      setIsVerificacionAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem("sigac_auth");
      sessionStorage.removeItem("sigac_proyectos_auth");
      sessionStorage.removeItem("sigac_verificacion_auth");
    } catch (e) {
      console.error("Error al limpiar sessionStorage:", e);
    }
    setIsAuthenticated(false);
    setIsProyectosAuthenticated(false);
    setIsVerificacionAuthenticated(false);
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isProyectosAuthenticated,
        isVerificacionAuthenticated,
        isLoading,
        loginGlobal,
        loginProyectos,
        loginVerificacion,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
