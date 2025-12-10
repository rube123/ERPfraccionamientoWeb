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

// ===== Tipos de la API personas =====

type PersonaAPI = {
  id_persona: number;
  nombre: string;
  primer_apellido: string | null;
  segundo_apellido: string | null;
  correo: string | null;
  telefono: string | null;
  no_residencia: number | null;
};

type ResidentRow = {
  id_persona: number;
  nombre_completo: string;
  propiedad: string;
  telefono: string;
  estado: "ACTIVO" | "INACTIVO";
};

export default function MesaDirectivaResidentesPage() {
  const router = useRouter();
  const pathname = usePathname();

  // sesión / layout
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // datos residentes
  const [residentes, setResidentes] = useState<ResidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // modal añadir residente
  const [showModal, setShowModal] = useState(false);
  const [formNombre, setFormNombre] = useState("");
  const [formPrimerApellido, setFormPrimerApellido] = useState("");
  const [formSegundoApellido, setFormSegundoApellido] = useState("");
  const [formCorreo, setFormCorreo] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formNoResidencia, setFormNoResidencia] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // proteger ruta
  useEffect(() => {
    const u = readStoredUser();
    if (!u || !userIsMesa(u)) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // ===== función para cargar residentes (la usaremos en useEffect y después de POST) =====
  const loadResidents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/personas`);
      if (!res.ok) {
        throw new Error("Error cargando residentes.");
      }

      const data = (await res.json()) as PersonaAPI[];

      // quitar admin (id_persona = 1)
      const sinAdmin = data.filter((p) => p.id_persona !== 1);

      const rows: ResidentRow[] = sinAdmin.map((p) => {
        const nombreCompleto = [
          p.nombre,
          p.primer_apellido ?? "",
          p.segundo_apellido ?? "",
        ]
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        const propiedad =
          p.no_residencia != null
            ? `Casa #${p.no_residencia}`
            : "Sin residencia asignada";

        const telefono = p.telefono ?? "Sin teléfono";

        const estado: "ACTIVO" | "INACTIVO" =
          p.no_residencia != null ? "ACTIVO" : "INACTIVO";

        return {
          id_persona: p.id_persona,
          nombre_completo: nombreCompleto,
          propiedad,
          telefono,
          estado,
        };
      });

      setResidentes(rows);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudo cargar la lista de residentes.");
      setResidentes([]);
    } finally {
      setLoading(false);
    }
  };

  // cargar residentes al montar
  useEffect(() => {
    loadResidents();
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

  // items menú lateral (mismas rutas que en el dashboard)
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

  const filteredResidents = residentes.filter((r) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      r.nombre_completo.toLowerCase().includes(q) ||
      r.propiedad.toLowerCase().includes(q) ||
      r.telefono.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setFormNombre("");
    setFormPrimerApellido("");
    setFormSegundoApellido("");
    setFormCorreo("");
    setFormTelefono("");
    setFormNoResidencia("");
    setFormError(null);
  };

  // ===== registrar residente y refrescar tabla =====
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    try {
      const payload = {
        nombre: formNombre.trim(),
        primer_apellido: formPrimerApellido.trim() || null,
        segundo_apellido: formSegundoApellido.trim() || null,
        correo: formCorreo.trim() || null,
        telefono: formTelefono.trim() || null,
        no_residencia: formNoResidencia
          ? Number(formNoResidencia)
          : null,
      };

      const res = await fetch(`${API_BASE}/persona`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error API persona:", text);

        if (text.toLowerCase().includes("duplicate key value")) {
          setFormError("Ya existe un usuario con ese correo electrónico.");
        } else {
          setFormError(
            "No se pudo registrar al residente. Intenta de nuevo."
          );
        }
        return;
      }

      // opcional: si quieres usar los datos devueltos
      const _created = (await res.json()) as PersonaAPI;

      // 👇 AQUÍ refrescamos la tabla con los datos del backend
      await loadResidents();

      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setFormError(
        "Ocurrió un error inesperado al registrar al residente."
      );
    } finally {
      setFormLoading(false);
    }
  };

  if (!user) {
    // mientras se valida sesión
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

      {/* Sidebar (igual que en el dashboard) */}
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
                  <span className="text-sky-500 ml-1">Residentes</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Panel de gestión de residentes
                </span>
              </div>
            </div>

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
            {/* Título + botón añadir */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                Panel de Gestión de Residentes
              </h1>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2"
              >
                <span className="text-base leading-none">+</span>
                <span>Añadir Residente</span>
              </button>
            </div>

            {/* Buscador */}
            <section className="bg-white rounded-2xl border border-slate-200 px-4 sm:px-6 py-4 shadow-sm space-y-4">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs">
                  🔍
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nombre, casa, etc..."
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>
            </section>

            {/* Tabla */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-6 text-sm text-slate-500">
                  Cargando residentes…
                </div>
              ) : error && residentes.length === 0 ? (
                <div className="p-6 text-sm text-red-600">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-xs text-slate-500">
                        <th className="text-left font-semibold px-6 py-3">
                          Residente
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Propiedad
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Contacto
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Estado
                        </th>

                      </tr>
                    </thead>
                    <tbody>
                      {filteredResidents.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-6 text-xs text-slate-500 text-center"
                          >
                            No se encontraron residentes que coincidan con la
                            búsqueda.
                          </td>
                        </tr>
                      ) : (
                        filteredResidents.map((r, idx) => (
                          <tr
                            key={r.id_persona}
                            className={`border-b border-slate-100 ${
                              idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                            }`}
                          >
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center text-[11px] font-semibold text-white">
                                  {r.nombre_completo.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs sm:text-sm text-slate-800 font-medium">
                                  {r.nombre_completo}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-xs sm:text-sm text-slate-700">
                                {r.propiedad}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <span className="text-xs sm:text-sm text-slate-700">
                                {r.telefono}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <EstadoPill estado={r.estado} />
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

      {/* MODAL añadir residente */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Registrar nuevo residente
            </h2>

            <form onSubmit={handleAddResident} className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nombre
                  </label>
                  <input
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Primer apellido
                  </label>
                  <input
                    value={formPrimerApellido}
                    onChange={(e) => setFormPrimerApellido(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Segundo apellido
                  </label>
                  <input
                    value={formSegundoApellido}
                    onChange={(e) => setFormSegundoApellido(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Teléfono
                  </label>
                  <input
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Número de casa
                </label>
                <input
                  type="number"
                  min={1}
                  value={formNoResidencia}
                  onChange={(e) => setFormNoResidencia(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 mt-1">{formError}</p>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!formLoading) {
                      setShowModal(false);
                    }
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 px-4 py-2 text-xs font-semibold text-white"
                >
                  {formLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== mini componentes UI =====

function EstadoPill({ estado }: { estado: "ACTIVO" | "INACTIVO" }) {
  if (estado === "ACTIVO") {
    return (
      <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
      Inactivo
    </span>
  );
}
