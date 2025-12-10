// app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

type LoginResponse = {
  id_usuario: number;
  id_persona: number;
  correo: string;
  nombre_completo: string;
  roles: string[];
};

export default function LoginPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login normal usuario/contraseña
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correo: usuario,
          contrasena,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Error al iniciar sesión");
      }

      const data: LoginResponse = await res.json();

      if (typeof window !== "undefined") {
        localStorage.setItem("fracc_user", JSON.stringify(data));
      }

      const rolesLower = data.roles.map((r) => r.toLowerCase());

      if (rolesLower.includes("admin")) {
        router.push("/admin");
      } else if (rolesLower.includes("mesa_directiva")) {
        router.push("/mesa_directiva");
      } else if (rolesLower.includes("residente")) {
        router.push("/residente");
      } else {
        throw new Error("El usuario no tiene un rol asignado.");
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ?? "No se pudo iniciar sesión. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Login con Google → Firebase muestra selector de cuentas
  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const email = result.user.email;
      if (!email) {
        throw new Error("No se pudo obtener el correo de Google.");
      }

      // Llamar a tu API /login/google con el correo
      const res = await fetch(`${API_BASE}/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(
          msg || "No se pudo iniciar sesión con Google."
        );
      }

      const data: LoginResponse = await res.json();

      if (typeof window !== "undefined") {
        localStorage.setItem("fracc_user", JSON.stringify(data));
      }

      // Con Google siempre vas a la vista de residente
      router.push("/residente");
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message ??
          "No se pudo iniciar sesión con Google. Intenta nuevamente."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      {/* Marco azul */}
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

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              {/* Usuario */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Usuario (correo)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-sm">
                    👤
                  </span>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@fracc.com"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
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
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
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

              {/* Error */}
              {error && (
                <p className="text-xs text-red-600 text-center">{error}</p>
              )}

              {/* Botón login normal */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 text-sm shadow-sm transition-colors"
              >
                {loading ? "Ingresando..." : "Iniciar Sesión"}
              </button>
            </form>

            {/* Separador */}
            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="px-3 text-[11px] text-slate-400">o</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Botón de Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 font-medium py-2.5 text-sm shadow-sm transition-colors"
            >
              {googleLoading
                ? "Conectando con Google..."
                : "Iniciar sesión con Google"}
            </button>

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
