"use client";

import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginGlobalCard() {
  const { loginGlobal } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    if (!password.trim()) {
      setError(true);
      return;
    }

    const ok = loginGlobal(password);
    if (!ok) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/50 p-4 sm:p-6 relative overflow-hidden">
      {/* Círculos decorativos de fondo */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Barra superior de acento institucional */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0038A8] via-[#00B4D8] to-[#0038A8]" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Logo y Encabezado Institucional */}
          <div className="text-center space-y-3">
            <div className="inline-block p-2 bg-white rounded-2xl border border-slate-100 shadow-xs mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/neuquen_capital_logo.png"
                alt="Municipalidad de Neuquén Capital"
                className="h-14 w-auto mx-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0038A8] border border-blue-200 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-[#0038A8]" />
                Acceso Oficial al Portal
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-[#0B1938] tracking-tight leading-tight">
                Sistema Integral de Gestión de Alteraciones Contractuales (SIGAC)
              </h1>
              <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                Subsecretaría de Gestión de Contrataciones de Obras Públicas &bull; Municipalidad de Neuquén
              </p>
            </div>
          </div>

          {/* Globo y saludo de Alty */}
          <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-blue-50/50 p-4 rounded-2xl border border-orange-200 flex items-start gap-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-orange-100 border border-orange-300 p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/alty.png"
                alt="Alty"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FF7A00] block">
                Asistente Institucional
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                ¡Hola! Ingresá la clave de acceso oficial para continuar.
              </p>
            </div>
          </div>

          {/* Formulario de Ingreso */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="password-global"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Clave de Acceso
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="password-global"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  autoFocus
                  placeholder="Ingresá la contraseña oficial..."
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm font-medium transition-all outline-hidden ${
                    error
                      ? "border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                      : "border-slate-300 bg-white text-slate-900 focus:border-[#0038A8] focus:ring-2 focus:ring-blue-500/20"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? "Ocultar clave" : "Mostrar clave"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  Contraseña incorrecta. Verificá con el área emisora.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg shadow-blue-900/15 flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Ingresar al Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>

          {/* Pie de seguridad */}
          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium">
              Uso exclusivo para personal técnico y administrativo municipal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
