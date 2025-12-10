// app/login/page.tsx
"use client";

import React from "react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      {/* Marco azul como en tu captura */}
      <div className="w-full max-w-5xl rounded-[32px] border-2 border-blue-500 bg-slate-50 px-4 py-10 md:px-10 md:py-12">
        <div className="flex justify-center">
          {/* Tarjeta de login */}
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-8 py-10">
            <h1 className="text-xl font-semibold text-slate-900 text-center">
              Fraccionamiento Manager
            </h1>
            <p className="mt-1 text-sm text-slate-500 text-center">
              Bienvenido de nuevo, por favor inicia sesión.
            </p>

            <form className="mt-8 space-y-5">
              {/* Usuario */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Usuario
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                    👤
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin_fracc"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                    🔒
                  </span>
                  <input
                    type="password"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••••"
                  />
                </div>
              </div>

              {/* Olvidé mi contraseña */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Olvidé mi contraseña
                </button>
              </div>

              {/* Botón de login */}
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 text-sm shadow-sm transition-colors"
              >
                Iniciar Sesión
              </button>
            </form>

            {/* Registro */}
            <p className="mt-6 text-center text-xs text-slate-500">
              ¿No tienes una cuenta?{" "}
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Regístrate
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
