"use client";

import React, { useState, useEffect } from "react";
import { X, Lock, Eye, EyeOff, ShieldAlert, ArrowRight, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ModalAuthProyectosProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalAuthProyectos({
  isOpen,
  onClose,
  onSuccess,
}: ModalAuthProyectosProps) {
  const { loginProyectos } = useAuth();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError(false);
      setShowPassword(false);
    }
  }, [isOpen]);

  // Listener para cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    if (!password.trim()) {
      setError(true);
      return;
    }

    const ok = loginProyectos(password);
    if (ok) {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Fondo oscuro clickeable */}
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Modal */}
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Barra superior de acento */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-[#0038A8] to-indigo-700" />

        <div className="p-6 sm:p-7 space-y-5">
          {/* Cabecera con botón de cierre */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#0038A8] border border-blue-200 flex items-center justify-center shrink-0 shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0038A8] block">
                  Seguridad de Acceso &bull; Nivel 2
                </span>
                <h3 className="text-lg sm:text-xl font-black text-[#0B1938] leading-tight">
                  Acceso Restringido - Área de Alteraciones Contractuales
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Texto explicativo institucional */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            Este módulo permite la redacción de proyectos de normas legales y adendas. Ingresá la clave de autorización interna para acceder.
          </p>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="password-proyectos"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Clave de Autorización Interna
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="password-proyectos"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  autoFocus
                  placeholder="Ingresá la clave de proyectos..."
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

            {/* Alerta de Error */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  Contraseña incorrecta. Acceso denegado para el área de redacción de normas y adendas.
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0038A8] hover:bg-[#002b80] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer group"
              >
                <span>Acceder a Generación</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
