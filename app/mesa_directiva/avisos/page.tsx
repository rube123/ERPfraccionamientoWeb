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

// ===== Tipos de la API avisos / personas =====

type AvisoAPI = {
  id_aviso: number;
  titulo: string;
  mensaje: string;
  a_todos: boolean;
  enviado_por: number;
  creado_en: string;
  nombre_emisor: string | null;
};

type PersonaAPI = {
  id_persona: number;
  nombre: string;
  primer_apellido: string | null;
  segundo_apellido: string | null;
};

type PersonaResumen = {
  id_persona: number;
  nombre_completo: string;
};

export default function MesaDirectivaAvisosPage() {
  const router = useRouter();
  const pathname = usePathname();

  // sesión / layout
  const [user, setUser] = useState<StoredUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // datos avisos
  const [avisos, setAvisos] = useState<AvisoAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // modal crear aviso
  const [showModal, setShowModal] = useState(false);
  const [formTitulo, setFormTitulo] = useState("");
  const [formMensaje, setFormMensaje] = useState("");
  const [formATodos, setFormATodos] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // destinatarios específicos
  const [residentes, setResidentes] = useState<PersonaResumen[]>([]);
  const [resLoading, setResLoading] = useState(false);
  const [resError, setResError] = useState<string | null>(null);
  const [resSearch, setResSearch] = useState("");
  const [destSeleccionados, setDestSeleccionados] = useState<number[]>([]);

  // proteger ruta
  useEffect(() => {
    const u = readStoredUser();
    if (!u || !userIsMesa(u)) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // ===== función para cargar avisos =====
  const loadAvisos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/avisos`);
      if (!res.ok) {
        throw new Error("Error cargando avisos.");
      }
      const data = (await res.json()) as AvisoAPI[];

      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
      );
      setAvisos(sorted);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudo cargar la lista de avisos.");
      setAvisos([]);
    } finally {
      setLoading(false);
    }
  };

  // cargar avisos al montar
  useEffect(() => {
    loadAvisos();
  }, []);

  // ===== cargar residentes para checklist (solo cuando se necesita) =====
  useEffect(() => {
    const shouldLoad =
      showModal && !formATodos && residentes.length === 0 && !resLoading;

    if (!shouldLoad) return;

    const loadResidentes = async () => {
      setResLoading(true);
      setResError(null);
      try {
        const res = await fetch(`${API_BASE}/personas`);
        if (!res.ok) {
          throw new Error("Error cargando residentes.");
        }
        const data = (await res.json()) as PersonaAPI[];

        const lista = data
          .filter((p) => p.id_persona !== 1) // quitar admin
          .map<PersonaResumen>((p) => {
            const nombreCompleto = [
              p.nombre,
              p.primer_apellido ?? "",
              p.segundo_apellido ?? "",
            ]
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
            return {
              id_persona: p.id_persona,
              nombre_completo: nombreCompleto,
            };
          });

        setResidentes(lista);
      } catch (e: any) {
        console.error(e);
        setResError(
          e?.message ?? "No se pudo cargar la lista de residentes."
        );
      } finally {
        setResLoading(false);
      }
    };

    loadResidentes();
  }, [showModal, formATodos, residentes.length, resLoading]);

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

  // items menú lateral
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

  const filteredAvisos = avisos.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.titulo.toLowerCase().includes(q) ||
      a.mensaje.toLowerCase().includes(q) ||
      (a.nombre_emisor ?? "").toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setFormTitulo("");
    setFormMensaje("");
    setFormATodos(true);
    setFormError(null);
    setResSearch("");
    setDestSeleccionados([]);
  };

  const handleToggleDestinatario = (id: number) => {
    setDestSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const residentesFiltrados = residentes.filter((r) =>
    r.nombre_completo.toLowerCase().includes(resSearch.toLowerCase())
  );

  // ===== crear aviso (POST /avisos) + refrescar lista =====
  const handleCreateAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError("Sesión no válida.");
      return;
    }

    if (!formATodos && destSeleccionados.length === 0) {
      setFormError("Selecciona al menos un residente destinatario.");
      return;
    }

    setFormError(null);
    setFormLoading(true);

    try {
      const payload = {
        titulo: formTitulo.trim(),
        mensaje: formMensaje.trim(),
        a_todos: formATodos,
        id_usuario_emisor: user.id_usuario,
        destinatarios: formATodos ? [] : destSeleccionados,
      };

      const res = await fetch(`${API_BASE}/avisos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Error API avisos:", text);
        setFormError(
          "No se pudo registrar el aviso. Verifica los datos e intenta de nuevo."
        );
        return;
      }

      await loadAvisos();

      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setFormError("Ocurrió un error inesperado al crear el aviso.");
    } finally {
      setFormLoading(false);
    }
  };

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
                  <span className="text-sky-500 ml-1">Avisos</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Historial y creación de avisos a residentes
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
            {/* Título + botón crear */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800">
                Gestión de Avisos
              </h1>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold px-4 py-2"
              >
                <span className="text-base leading-none">+</span>
                <span>Crear aviso</span>
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
                  placeholder="Buscar por título, mensaje o emisor..."
                  className="w-full rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                />
              </div>
            </section>

            {/* Lista de avisos */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-6 text-sm text-slate-500">
                  Cargando avisos…
                </div>
              ) : error && avisos.length === 0 ? (
                <div className="p-6 text-sm text-red-600">{error}</div>
              ) : filteredAvisos.length === 0 ? (
                <div className="p-6 text-sm text-slate-500 text-center">
                  No hay avisos que coincidan con la búsqueda.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {filteredAvisos.map((a) => (
                    <li key={a.id_aviso} className="px-6 py-4 flex gap-4">
                      <div className="mt-1 h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-semibold text-sky-700">
                        {a.nombre_emisor
                          ? a.nombre_emisor.charAt(0).toUpperCase()
                          : "A"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-800">
                              {a.titulo}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {a.nombre_emisor ?? "Desconocido"} ·{" "}
                              {new Date(a.creado_en).toLocaleString("es-MX", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${
                              a.a_todos
                                ? "border-sky-200 bg-sky-50 text-sky-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {a.a_todos
                              ? "Enviado a todos"
                              : "Enviado a destinatarios específicos"}
                          </span>
                        </div>
                        <p className="mt-2 text-xs sm:text-sm text-slate-700 whitespace-pre-line">
                          {a.mensaje}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* MODAL Crear aviso */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Crear nuevo aviso
            </h2>

            <form onSubmit={handleCreateAviso} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Título
                </label>
                <input
                  required
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                  placeholder="Ej. Aviso importante a residentes"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Mensaje
                </label>
                <textarea
                  required
                  rows={4}
                  value={formMensaje}
                  onChange={(e) => setFormMensaje(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 resize-none"
                  placeholder="Escribe el contenido del aviso…"
                />
              </div>

              <div className="flex items-start gap-2">
                <input
                  id="a_todos"
                  type="checkbox"
                  checked={formATodos}
                  onChange={(e) => {
                    setFormATodos(e.target.checked);
                    setFormError(null);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <label
                    htmlFor="a_todos"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Enviar a todos los residentes
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Si lo desmarcas, podrás elegir residentes específicos de la
                    lista.
                  </p>
                </div>
              </div>

              {/* Checklist de destinatarios cuando NO se envía a todos */}
              {!formATodos && (
                <div className="mt-2 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700">
                      Destinatarios específicos
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {destSeleccionados.length} seleccionado(s)
                    </span>
                  </div>

                  {resLoading ? (
                    <p className="text-[11px] text-slate-500">
                      Cargando residentes…
                    </p>
                  ) : resError ? (
                    <p className="text-[11px] text-red-600">{resError}</p>
                  ) : (
                    <>
                      <div className="relative mb-2">
                        <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-slate-400 text-[11px]">
                          🔍
                        </span>
                        <input
                          type="text"
                          value={resSearch}
                          onChange={(e) => setResSearch(e.target.value)}
                          placeholder="Buscar residente…"
                          className="w-full rounded-lg border border-slate-200 pl-6 pr-2 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                        />
                      </div>

                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {residentesFiltrados.length === 0 ? (
                          <p className="text-[11px] text-slate-500">
                            No se encontraron residentes.
                          </p>
                        ) : (
                          residentesFiltrados.map((r) => {
                            const checked = destSeleccionados.includes(
                              r.id_persona
                            );
                            return (
                              <label
                                key={r.id_persona}
                                className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer hover:bg-slate-50 rounded-lg px-1 py-0.5"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() =>
                                    handleToggleDestinatario(r.id_persona)
                                  }
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                <span className="truncate">
                                  {r.nombre_completo}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

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
                  {formLoading ? "Enviando..." : "Enviar aviso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
