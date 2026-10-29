"use client";

import React from "react";
import { AuthProviderInternal, useAuth } from "@/context/AuthContext";
import LoginGlobalCard from "./LoginGlobalCard";

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  // Estado de carga inicial mientras se lee sessionStorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-1.5 mb-4 animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/neuquen_capital_logo.png"
            alt="Municipalidad de Neuquén"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="w-6 h-6 border-2 border-[#0038A8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Si no está autenticado en Nivel 1 ("obras"), bloquea la pantalla completa con el Login Oficial
  if (!isAuthenticated) {
    return <LoginGlobalCard />;
  }

  // Si ya ingresó con la clave general, tiene acceso al portal y a /asistente-tramitacion
  return <>{children}</>;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviderInternal>
      <AuthGate>{children}</AuthGate>
    </AuthProviderInternal>
  );
}
