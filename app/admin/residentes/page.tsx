// app/admin/residentes/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// ================== Tipos ==================

type Persona = {
  id_persona: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string | null;
  telefono: string | null;
  no_residencia: number | null;
};

type PersonaInputForm = {
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  correo: string;
  telefono: string;
  no_residencia: string; // lo convertimos a número al mandar al backend
};

// ================== Componente ==================

const PAGE_SIZE = 10;

export default function AdminResidentesPage() {
  const router = useRouter();

  const [residentes, setResidentes] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [form, setForm] = useState<PersonaInputForm>({
    nombre: "",
    primer_apellido: "",
    segundo_apellido: "",
    correo: "",
    telefono: "",
    no_residencia: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // --------- Helpers de nombre/datos ---------

  const getNombreCompleto = (p: Persona) => {
    return `${p.nombre} ${p.primer_apellido}${
      p.segundo_apellido ? ` ${p.segundo_apellido}` : ""
    }`;
  };

  const formatResidencia = (p: Persona) => {
    if (p.no_residencia == null) return "Sin número";
    return `Casa ${p.no_residencia}`;
  };

  // --------- Cargar residentes ---------

  const fetchResidentes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/personas`);
      if (!res.ok) {
        throw new Error("No se pudieron obtener los residentes");
      }
      const data: Persona[] = await res.json();
      setResidentes(data);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Error al cargar residentes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResidentes();
  }, []);

  // --------- Búsqueda + paginación ---------

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return residentes;

    return residentes.filter((p) => {
      const nombre = getNombreCompleto(p).toLowerCase();
      const email = (p.correo ?? "").toLowerCase();
      const tel = (p.telefono ?? "").toLowerCase();
      const casa = p.no_residencia?.toString() ?? "";

      return (
        nombre.includes(term) ||
        email.includes(term) ||
        tel.includes(term) ||
        casa.includes(term)
      );
    });
  }, [search, residentes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // --------- Formulario (crear / editar) ---------

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: "",
      primer_apellido: "",
      segundo_apellido: "",
      correo: "",
      telefono: "",
      no_residencia: "",
    });
    setShowForm(true);
  };

  const openEdit = (p: Persona) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      primer_apellido: p.primer_apellido,
      segundo_apellido: p.segundo_apellido ?? "",
      correo: p.correo ?? "",
      telefono: p.telefono ?? "",
      no_residencia: p.no_residencia?.toString() ?? "",
    });
    setShowForm(true);
  };

  const handleChange = (
    field: keyof PersonaInputForm,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.primer_apellido.trim()) {
      alert("Nombre y primer apellido son obligatorios");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        primer_apellido: form.primer_apellido.trim(),
        segundo_apellido: form.segundo_apellido.trim() || null,
        correo: form.correo.trim() || null,
        telefono: form.telefono.trim() || null,
        no_residencia: form.no_residencia.trim()
          ? Number(form.no_residencia.trim())
          : null,
      };

      let url = `${API_BASE}/persona`;
      let method: "POST" | "PUT" = "POST";

      if (editing) {
        url = `${API_BASE}/persona/${editing.id_persona}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al guardar residente");
      }

      await fetchResidentes();
      setShowForm(false);
      setEditing(null);
    } catch (err: any) {
      console.error(err);
      alert(err?.message ?? "Error al guardar residente");
    } finally {
      setSubmitting(false);
    }
  };

 
  // ================== Render ==================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">
          Cargando residentes…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow px-6 py-4 max-w-md text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            className="mt-2 text-xs font-semibold text-sky-600"
            onClick={fetchResidentes}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo y nombre */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
              L
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Gestión de Fraccionamientos
            </span>
          </div>

          {/* Navegación */}
          <nav className="hidden md:flex items-center gap-5 text-sm text-slate-500">
            <button
              onClick={() => router.push("/admin")}
              className="hover:text-slate-900"
            >
              Dashboard
            </button>
            <button className="font-semibold text-sky-600">
              Residentes
            </button>
            <button
              onClick={() => router.push("/admin/pagos")}
              className="hover:text-slate-900"
            >
              Pagos
            </button>
            <button
              onClick={() => router.push("/admin/avisos")}
              className="hover:text-slate-900"
            >
              Comunicados
            </button>
          </nav>

          {/* Botón agregar + avatar dummy */}
          <div className="flex items-center gap-4">
            <button
              onClick={openCreate}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 shadow-sm"
            >
              <span>+ Añadir Residente</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-semibold text-white">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Título */}
        <section>
          <h1 className="text-2xl font-semibold">Gestión de Residentes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Busca, filtra y gestiona los residentes del fraccionamiento.
          </p>
        </section>

        {/* Barra de búsqueda y filtros */}
        <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-full max-w-xs">
              <input
                type="text"
                placeholder="Buscar residente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs">
                🔍
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              type="button"
            >
              Filtrar
            </button>
            <button
              onClick={openCreate}
              className="sm:hidden rounded-xl bg-sky-600 text-white text-sm font-medium px-3 py-2"
            >
              Añadir
            </button>
          </div>
        </section>

        {/* Tabla de residentes */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Encabezado */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center text-xs font-semibold text-slate-500">
            <div className="w-8 flex justify-center">
              <input type="checkbox" disabled />
            </div>
            <div className="flex-1">Residente</div>
            <div className="w-48">Residencia</div>
            <div className="w-40">Teléfono</div>
            <div className="w-24 text-right">Acciones</div>
          </div>

          {/* Filas */}
          <div className="divide-y divide-slate-100 text-sm">
            {pageItems.map((p) => (
              <div
                key={p.id_persona}
                className="px-6 py-3 flex items-center hover:bg-slate-50"
              >
                {/* Checkbox */}
                <div className="w-8 flex justify-center">
                  <input type="checkbox" />
                </div>

                {/* Residente */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-300 to-sky-400" />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {getNombreCompleto(p)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {p.correo ?? "Sin correo"}
                    </span>
                  </div>
                </div>

                {/* Residencia */}
                <div className="w-48 text-sm text-slate-700 truncate">
                  {formatResidencia(p)}
                </div>

                {/* Teléfono */}
                <div className="w-40 text-sm text-slate-700">
                  {p.telefono ?? "Sin teléfono"}
                </div>

                {/* Acciones */}
                <div className="w-24 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => openEdit(p)}
                    className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50"
                  >
                    Editar
                  </button>
                  
                </div>
              </div>
            ))}

            {pageItems.length === 0 && (
              <div className="px-6 py-6 text-sm text-slate-500">
                No se encontraron residentes con ese criterio de búsqueda.
              </div>
            )}
          </div>

          {/* Pie con paginación */}
          <div className="px-6 py-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Mostrando {pageItems.length === 0 ? 0 : startIndex + 1}-
              {startIndex + pageItems.length} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={`px-3 py-1 rounded-lg border text-xs ${
                  page === 1
                    ? "border-slate-200 text-slate-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1 rounded-lg border text-xs ${
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
                className={`px-3 py-1 rounded-lg border text-xs ${
                  page === totalPages
                    ? "border-slate-200 text-slate-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Modal crear / editar */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg px-6 py-5">
            <h2 className="text-lg font-semibold mb-1">
              {editing ? "Editar residente" : "Añadir residente"}
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Completa la información del residente.
            </p>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-700">
                    Nombre
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    value={form.nombre}
                    onChange={(e) =>
                      handleChange("nombre", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-700">
                    Primer apellido
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    value={form.primer_apellido}
                    onChange={(e) =>
                      handleChange("primer_apellido", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Segundo apellido
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  value={form.segundo_apellido}
                  onChange={(e) =>
                    handleChange("segundo_apellido", e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Correo
                </label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  value={form.correo}
                  onChange={(e) =>
                    handleChange("correo", e.target.value)
                  }
                />
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    value={form.telefono}
                    onChange={(e) =>
                      handleChange("telefono", e.target.value)
                    }
                  />
                </div>
                <div className="w-32">
                  <label className="text-xs font-medium text-slate-700">
                    No. casa
                  </label>
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                    value={form.no_residencia}
                    onChange={(e) =>
                      handleChange("no_residencia", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!submitting) {
                      setShowForm(false);
                      setEditing(null);
                    }
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-sky-600 text-white text-xs font-semibold px-4 py-2 hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting
                    ? "Guardando..."
                    : editing
                    ? "Guardar cambios"
                    : "Crear residente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
