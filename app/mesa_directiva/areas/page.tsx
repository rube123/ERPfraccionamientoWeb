"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://apifraccionamiento.onrender.com";

// ===== Tipos / helpers de sesión =====

type StoredUser = {
  id_usuario: number;
  id_persona: number;
  correo: string;
  nombre_completo: string;
  roles: string[];
};

function readStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("fracc_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function clearStoredUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("fracc_user");
}

function userIsMesa(user: StoredUser | null) {
  if (!user) return false;
  return user.roles.map((r) => r.toLowerCase()).includes("mesa_directiva");
}

// ===== Tipos API / vista =====

type ReservaAPI = {
  no_reserva: number;
  area_nombre: string;
  fecha_reserva: string; // "YYYY-MM-DD"
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string; // "HH:MM:SS"
  estado: string;
  nombre_persona: string;
};

type ReservaRow = {
  no_reserva: number;
  area: string;
  residente: string;
  fecha: string; // 2025-12-21
  horario: string; // 15:00 - 23:00
  estado: string;
};

export default function MesaDirectivaAreasPage() {
  const router = useRouter();
  const pathname = usePathname();

  // sesión / layout
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // datos reservas
  const [reservas, setReservas] = useState<ReservaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // proteger ruta
  useEffect(() => {
    const u = readStoredUser();
    if (!u || !userIsMesa(u)) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // cargar reservas
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/reservas/historial`);
        if (!res.ok) {
          throw new Error("Error cargando historial de reservas.");
        }
        const json = (await res.json()) as ReservaAPI[];

        const rows: ReservaRow[] = json.map((r) => {
          const fechaLabel = r.fecha_reserva; // si quieres, aquí puedes formatear a dd/mes/aaaa

          const horario = `${r.hora_inicio.slice(0, 5)} - ${r.hora_fin.slice(
            0,
            5
          )}`;

          return {
            no_reserva: r.no_reserva,
            area: r.area_nombre,
            residente: r.nombre_persona.trim(),
            fecha: fechaLabel,
            horario,
            estado: r.estado.toLowerCase(),
          };
        });

        // opcional: ordenar por fecha DESC
        rows.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

        setReservas(rows);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message ?? "No se pudo cargar la información de las reservas."
        );
        setReservas([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleLogout = () => {
    clearStoredUser();
    router.push("/login");
  };

  const displayName = user?.nombre_completo ?? "Mesa Directiva";
  const displayEmail = user?.correo ?? "mesa@fracc.com";
  const avatarLetter =
    displayName.trim().length > 0
      ? displayName.trim().charAt(0).toUpperCase()
      : "M";

  // menú lateral (mismo que en residentes y pagos)
  const navItems = [
    { label: "Dashboard", path: "/mesa_directiva" },
    { label: "Residentes", path: "/mesa_directiva/residentes" },
    { label: "Administración de pagos", path: "/mesa_directiva/pagos" },
    { label: "Áreas comunes", path: "/mesa_directiva/areas" },
    { label: "Avisos", path: "/mesa_directiva/avisos" },
  ];

  const handleNav = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  const isActivePath = (path: string) => {
    if (!pathname) return false;
    if (path === "/mesa_directiva") {
      return pathname === "/mesa_directiva";
    }
    return pathname.startsWith(path);
  };

  // filtro por búsqueda (residente o área)
  const filteredReservas = reservas.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.residente.toLowerCase().includes(q) ||
      r.area.toLowerCase().includes(q)
    );
  });

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Cargando panel…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Overlay móviles */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-16 px-5 flex items-center border-b border-slate-100 gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
            M
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-800">
              Mesa Directiva
            </span>
            <span className="text-[11px] text-sky-500 font-medium">
              Panel administrativo
            </span>
          </div>
        </div>

        <nav className="mt-4 px-3 space-y-1 text-sm">
          {navItems.map((item) => {
            const active = isActivePath(item.path);
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-left transition ${
                  active
                    ? "bg-sky-50 text-sky-700 border border-sky-200"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Contenedor principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Barra superior */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Botón menú móvil + título */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600"
                onClick={() => setSidebarOpen((prev) => !prev)}
              >
                <span className="sr-only">Abrir menú</span>
                <div className="space-y-1">
                  <span className="block h-0.5 w-4 bg-current" />
                  <span className="block h-0.5 w-4 bg-current" />
                  <span className="block h-0.5 w-4 bg-current" />
                </div>
              </button>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">
                  Mesa Directiva
                  <span className="text-sky-500 ml-1">
                    Gestión de reservas de áreas
                  </span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Historial de reservas de áreas comunes
                </span>
              </div>
            </div>

            {/* Perfil + logout */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="hidden sm:inline-flex text-xs font-semibold text-red-600 border border-red-200 rounded-full px-3 py-1 bg-red-50 hover:bg-red-100"
              >
                Cerrar sesión
              </button>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold max-w-[150px] truncate">
                    {displayName}
                  </span>
                  <span className="text-[11px] text-slate-500 max-w-[150px] truncate">
                    {displayEmail}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-semibold text-white">
                  {avatarLetter}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            {/* Título + botón registrar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                Gestión de Reservas de Áreas
              </h1>
            </div>

            {/* Buscador y filtros */}
            <section className="bg-white rounded-2xl border border-slate-200 px-4 sm:px-6 py-4 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por área o residente..."
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Tabla de reservas */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-6 text-sm text-slate-500">
                  Cargando reservas…
                </div>
              ) : error && reservas.length === 0 ? (
                <div className="p-6 text-sm text-red-600">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs text-slate-500">
                        <th className="text-left font-semibold px-6 py-3">
                          Área
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Residente
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Fecha
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Horario
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservas.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-6 py-6 text-xs text-slate-500 text-center"
                          >
                            No se encontraron reservas que coincidan con la
                            búsqueda.
                          </td>
                        </tr>
                      ) : (
                        filteredReservas.map((r, idx) => (
                          <tr
                            key={r.no_reserva}
                            className={`border-b border-slate-100 ${
                              idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                            }`}
                          >
                            {/* Área */}
                            <td className="px-6 py-3">
                              <span className="text-xs sm:text-sm text-slate-800 font-medium">
                                {r.area}
                              </span>
                            </td>

                            {/* Residente */}
                            <td className="px-6 py-3">
                              <span className="text-xs sm:text-sm text-slate-700">
                                {r.residente}
                              </span>
                            </td>

                            {/* Fecha */}
                            <td className="px-6 py-3">
                              <span className="text-xs sm:text-sm text-slate-700">
                                {r.fecha}
                              </span>
                            </td>

                            {/* Horario */}
                            <td className="px-6 py-3">
                              <span className="text-xs sm:text-sm text-slate-700">
                                {r.horario}
                              </span>
                            </td>

                            {/* Estado */}
                            <td className="px-6 py-3">
                              <EstadoReservaPill estado={r.estado} />
                            </td>

                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// ===== mini UI =====

function DropdownPill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] sm:text-xs text-slate-600 hover:bg-slate-50"
    >
      <span>{label}</span>
      <span className="text-[10px]">▼</span>
    </button>
  );
}

function EstadoReservaPill({ estado }: { estado: string }) {
  const e = estado.toLowerCase();
  if (e === "confirmada" || e === "confirmado") {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
        Confirmada
      </span>
    );
  }
  if (e === "pendiente") {
    return (
      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
        Pendiente
      </span>
    );
  }
  if (e === "cancelada" || e === "cancelado") {
    return (
      <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-700">
        Cancelada
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
      {estado}
    </span>
  );
}
