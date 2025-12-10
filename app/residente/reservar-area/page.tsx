// app/admin/areas/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

type ReservaHistorial = {
  no_reserva: number;
  area_nombre: string;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  nombre_persona: string;
};

type AreaComun = {
  cve_area: number;
  nombre: string;
  descripcion?: string | null;
  capacidad?: number | null;
};

type Persona = {
  id_persona: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido?: string | null;
};

type EstadoFiltro =
  | "todos"
  | "pendiente"
  | "confirmada"
  | "cancelada"
  | "rechazada";

const PAGE_SIZE = 10;

// ================= Helpers =================

function nombreCompletoPersona(p: Persona) {
  return `${p.nombre} ${p.primer_apellido}${
    p.segundo_apellido ? ` ${p.segundo_apellido}` : ""
  }`;
}

function formatFecha(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function formatHora(h: string) {
  if (!h) return "";
  const [hh, mm] = h.split(":");
  return `${hh}:${mm}`;
}

function normalizeTime(value: string) {
  if (!value) return value;
  if (value.length === 5) return `${value}:00`; // "HH:MM" -> "HH:MM:00"
  return value;
}

function EstadoBadge({ estado }: { estado: string }) {
  const s = estado.toLowerCase();
  let label = estado;
  let classes =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold";

  if (s === "confirmada" || s === "aprobada") {
    label = "Aprobada";
    classes += " bg-emerald-50 text-emerald-700";
  } else if (s === "pendiente") {
    label = "Pendiente";
    classes += " bg-amber-50 text-amber-700";
  } else if (s === "cancelada") {
    label = "Cancelada";
    classes += " bg-slate-100 text-slate-600";
  } else if (s === "rechazada") {
    label = "Rechazada";
    classes += " bg-rose-50 text-rose-700";
  } else {
    classes += " bg-slate-100 text-slate-600";
  }

  return <span className={classes}>{label}</span>;
}

// ================= Page =================

export default function AreasHistorialPage() {
  const router = useRouter();

  const [reservas, setReservas] = useState<ReservaHistorial[]>([]);
  const [areas, setAreas] = useState<AreaComun[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // pestaña activa: "areas" o "historial"
  const [activeTab, setActiveTab] = useState<"areas" | "historial">(
    "historial"
  );

  // filtros historial
  const [search, setSearch] = useState("");
  const [filtroResidente, setFiltroResidente] = useState<number | "todos">(
    "todos"
  );
  const [filtroArea, setFiltroArea] = useState<number | "todos">("todos");
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltro>("todos");
  const [currentPage, setCurrentPage] = useState(1);

  // modal nueva reserva
  const [showModal, setShowModal] = useState(false);
  const [areaNueva, setAreaNueva] = useState<number | "">("");
  const [personaNueva, setPersonaNueva] = useState<number | "">("");
  const [fechaNueva, setFechaNueva] = useState("");
  const [horaInicioNueva, setHoraInicioNueva] = useState("");
  const [horaFinNueva, setHoraFinNueva] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // ========= Carga inicial =========

  useEffect(() => {
    loadCatalogosYReservas();
  }, []);

  async function loadReservas() {
    const res = await fetch(`${API_BASE}/reservas/historial`);
    if (!res.ok) {
      throw new Error(
        (await res.text()) || "No se pudo obtener el historial de reservas"
      );
    }
    const data: ReservaHistorial[] = await res.json();
    setReservas(data);
  }

  async function loadCatalogosYReservas() {
    try {
      setLoading(true);
      setError(null);

      const [areasRes, personasRes] = await Promise.all([
        fetch(`${API_BASE}/areas`),
        fetch(`${API_BASE}/personas`),
      ]);

      if (!areasRes.ok) {
        throw new Error(
          (await areasRes.text()) || "No se pudo obtener listado de áreas"
        );
      }
      if (!personasRes.ok) {
        throw new Error(
          (await personasRes.text()) ||
            "No se pudo obtener listado de residentes"
        );
      }

      const areasData: AreaComun[] = await areasRes.json();
      const personasData: Persona[] = await personasRes.json();

      setAreas(areasData);
      setPersonas(personasData);

      await loadReservas();
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }

  // ========= Filtros / paginación historial =========

  const filteredReservas = useMemo(() => {
    const term = search.trim().toLowerCase();

    return reservas.filter((r) => {
      if (filtroArea !== "todos") {
        const area = areas.find((a) => a.nombre === r.area_nombre);
        if (!area || area.cve_area !== filtroArea) return false;
      }

      if (filtroResidente !== "todos") {
        const persona = personas.find((p) => p.id_persona === filtroResidente);
        if (!persona) return false;
        if (
          r.nombre_persona
            .toLowerCase()
            .indexOf(nombreCompletoPersona(persona).toLowerCase()) === -1
        ) {
          return false;
        }
      }

      if (filtroEstado !== "todos") {
        if (r.estado.toLowerCase() !== filtroEstado) return false;
      }

      if (!term) return true;

      return (
        r.area_nombre.toLowerCase().includes(term) ||
        r.nombre_persona.toLowerCase().includes(term) ||
        formatFecha(r.fecha_reserva).toLowerCase().includes(term)
      );
    });
  }, [reservas, search, filtroResidente, filtroArea, filtroEstado, areas, personas]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReservas.length / PAGE_SIZE)
  );
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filteredReservas.slice(startIndex, startIndex + PAGE_SIZE);

  // ========= Crear reserva =========

  async function handleSubmitNuevaReserva(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    if (
      !areaNueva ||
      !personaNueva ||
      !fechaNueva ||
      !horaInicioNueva ||
      !horaFinNueva
    ) {
      setCreateError("Completa todos los campos.");
      return;
    }

    if (horaFinNueva <= horaInicioNueva) {
      setCreateError("La hora de fin debe ser mayor que la de inicio.");
      return;
    }

    let idUsuarioRegistro = 1;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("fraccionamiento_session");
        if (raw) {
          const session = JSON.parse(raw);
          if (session?.id_usuario) {
            idUsuarioRegistro = Number(session.id_usuario);
          }
        }
      } catch {
        // ignorar errores de parseo
      }
    }

    try {
      setCreating(true);

      // Validar disponibilidad del área
      try {
        const urlDisp = `${API_BASE}/areas/${areaNueva}/disponibilidad?fecha=${fechaNueva}&inicio=${horaInicioNueva}&fin=${horaFinNueva}`;
        const respDisp = await fetch(urlDisp);
        if (respDisp.ok) {
          const json = await respDisp.json();
          if (json.disponible === false) {
            setCreating(false);
            setCreateError(
              "El área no está disponible en ese horario (ya existe una reserva)."
            );
            return;
          }
        }
      } catch {
        // si falla la validación, continuamos igual
      }

      const body = {
        cve_area: Number(areaNueva),
        id_persona_solicitante: Number(personaNueva),
        id_usuario_registro: idUsuarioRegistro,
        fecha_reserva: fechaNueva,
        hora_inicio: normalizeTime(horaInicioNueva),
        hora_fin: normalizeTime(horaFinNueva),
      };

      const res = await fetch(`${API_BASE}/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "No se pudo crear la reserva");
      }

      setCreateSuccess("Reserva creada correctamente.");
      setShowModal(false);
      await loadReservas();
    } catch (e: any) {
      setCreateError(e?.message ?? "Error al crear la reserva");
    } finally {
      setCreating(false);
    }
  }

  // ========= Render =========

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">
          Cargando historial de áreas…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow px-6 py-4 max-w-md text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <p className="text-xs text-slate-500">
            Verifica que tu API esté corriendo en <code>{API_BASE}</code>.
          </p>
        </div>
      </main>
    );
  }

  const residentesUnicos = Array.from(
    new Map(
      personas.map((p) => [p.id_persona, nombreCompletoPersona(p)])
    ).entries()
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header con botón para Dashboard */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
              L
            </div>
            <span className="text-sm font-semibold text-slate-800">
              AdminFraccionamiento
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium px-4 py-2 shadow-sm"
            >
              Volver al Dashboard
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-semibold text-white">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold">Gestión de Áreas</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra las áreas comunes y su historial de reservaciones.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 pt-4 pb-2">
          {/* Tabs + botón crear (solo en historial) */}
          <div className="flex items-center justify-between border-b border-slate-100 mb-4">
            <div className="flex gap-6">
              <button
                type="button"
                onClick={() => setActiveTab("areas")}
                className={`pb-3 text-sm ${
                  activeTab === "areas"
                    ? "font-semibold text-sky-600 border-b-2 border-sky-600"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Áreas Comunes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("historial")}
                className={`pb-3 text-sm ${
                  activeTab === "historial"
                    ? "font-semibold text-sky-600 border-b-2 border-sky-600"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Historial de Reservaciones
              </button>
            </div>

            {activeTab === "historial" && (
              <button
                type="button"
                onClick={() => {
                  setShowModal(true);
                  setCreateError(null);
                  setCreateSuccess(null);
                }}
                className="rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium px-4 py-2 shadow-sm"
              >
                Crear reservación
              </button>
            )}
          </div>

          {/* TAB ÁREAS COMUNES */}
          {activeTab === "areas" && (
            <div className="pb-4">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="px-4 md:px-6 py-3 border-b border-slate-100 flex items-center text-xs font-semibold text-slate-500">
                  <div className="flex-1">Área común</div>
                  <div className="w-64">Descripción</div>
                  <div className="w-32 text-right">Capacidad</div>
                </div>

                <div className="divide-y divide-slate-100 text-sm">
                  {areas.map((a) => (
                    <div
                      key={a.cve_area}
                      className="px-4 md:px-6 py-3 flex items-center hover:bg-slate-50"
                    >
                      <div className="flex-1 text-sm text-slate-800">
                        {a.nombre}
                      </div>
                      <div className="w-64 text-sm text-slate-700 truncate">
                        {a.descripcion || "Sin descripción"}
                      </div>
                      <div className="w-32 text-right text-sm text-slate-700">
                        {a.capacidad ? `${a.capacidad} personas` : "-"}
                      </div>
                    </div>
                  ))}

                  {areas.length === 0 && (
                    <div className="px-6 py-6 text-sm text-slate-500">
                      No se encontraron áreas comunes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB HISTORIAL */}
          {activeTab === "historial" && (
            <>
              {/* Filtros */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
                <div className="relative w-full lg:max-w-xs">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[11px] text-slate-400">
                    Buscar
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={filtroResidente}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFiltroResidente(
                        val === "todos" ? "todos" : Number(val)
                      );
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="todos">Filtrar por residente</option>
                    {residentesUnicos.map(([id, nombre]) => (
                      <option key={id} value={id}>
                        {nombre}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filtroArea}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFiltroArea(val === "todos" ? "todos" : Number(val));
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="todos">Filtrar por área</option>
                    {areas.map((a) => (
                      <option key={a.cve_area} value={a.cve_area}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filtroEstado}
                    onChange={(e) => {
                      setFiltroEstado(e.target.value as EstadoFiltro);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  >
                    <option value="todos">Filtrar por estado</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmada">Confirmada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="rechazada">Rechazada</option>
                  </select>
                </div>
              </div>

              {/* Tabla historial */}
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <div className="px-4 md:px-6 py-3 border-b border-slate-100 flex items-center text-xs font-semibold text-slate-500">
                  <div className="flex-1">Área común</div>
                  <div className="w-40">Residente</div>
                  <div className="w-40">Fecha inicio</div>
                  <div className="w-40">Fecha fin</div>
                  <div className="w-28">Estado</div>
                </div>

                <div className="divide-y divide-slate-100 text-sm">
                  {pageItems.map((r) => (
                    <div
                      key={r.no_reserva}
                      className="px-4 md:px-6 py-3 flex items-center hover:bg-slate-50"
                    >
                      <div className="flex-1 text-sm text-slate-800">
                        {r.area_nombre}
                      </div>
                      <div className="w-40 text-sm text-slate-700">
                        {r.nombre_persona}
                      </div>
                      <div className="w-40 text-sm text-slate-700">
                        {formatFecha(r.fecha_reserva)}{" "}
                        {formatHora(r.hora_inicio)}
                      </div>
                      <div className="w-40 text-sm text-slate-700">
                        {formatFecha(r.fecha_reserva)}{" "}
                        {formatHora(r.hora_fin)}
                      </div>
                      <div className="w-28">
                        <EstadoBadge estado={r.estado} />
                      </div>
                    </div>
                  ))}

                  {pageItems.length === 0 && (
                    <div className="px-6 py-6 text-sm text-slate-500">
                      No se encontraron reservaciones con ese criterio de
                      búsqueda.
                    </div>
                  )}
                </div>

                {/* Paginación */}
                <div className="px-4 md:px-6 py-3 border-t border-slate-100 flex items-center justify-center gap-1 text-xs text-slate-500">
                  <button
                    disabled={page === 1}
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    className={`px-2.5 py-1 rounded-lg border ${
                      page === 1
                        ? "border-slate-200 text-slate-300"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {"<"}
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1 rounded-lg border ${
                          p === page
                            ? "bg-sky-600 border-sky-600 text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    disabled={page === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className={`px-2.5 py-1 rounded-lg border ${
                      page === totalPages
                        ? "border-slate-200 text-slate-300"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {">"}
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Modal nueva reservación */}
      {showModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-1">
              Crear nueva reservación
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Selecciona el área común, el residente y el horario.
            </p>

            {createError && (
              <p className="mb-2 text-xs text-red-600">{createError}</p>
            )}
            {createSuccess && (
              <p className="mb-2 text-xs text-emerald-600">
                {createSuccess}
              </p>
            )}

            <form onSubmit={handleSubmitNuevaReserva} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Área común
                </label>
                <select
                  value={areaNueva}
                  onChange={(e) =>
                    setAreaNueva(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Selecciona un área</option>
                  {areas.map((a) => (
                    <option key={a.cve_area} value={a.cve_area}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Residente solicitante
                </label>
                <select
                  value={personaNueva}
                  onChange={(e) =>
                    setPersonaNueva(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Selecciona un residente</option>
                  {personas.map((p) => (
                    <option key={p.id_persona} value={p.id_persona}>
                      {nombreCompletoPersona(p)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Fecha de reserva
                </label>
                <input
                  type="date"
                  value={fechaNueva}
                  onChange={(e) => setFechaNueva(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={horaInicioNueva}
                    onChange={(e) => setHoraInicioNueva(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    value={horaFinNueva}
                    onChange={(e) => setHoraFinNueva(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-xs font-medium text-white shadow-sm disabled:opacity-60"
                >
                  {creating ? "Guardando..." : "Guardar reserva"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
