// app/admin/avisos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// ========= Tipos =========

type AvisoApi = {
  id_aviso: number;
  titulo: string;
  mensaje: string;
  a_todos: boolean;
  enviado_por: number;
  creado_en: string; // ISO
  nombre_emisor?: string | null;
};

type PersonaApi = {
  id_persona: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
};

type Session = {
  id_usuario: number;
  id_persona: number;
  correo: string;
  nombre_completo: string;
  roles: string[];
};

type AvisoForm = {
  titulo: string;
  mensaje: string;
  aTodos: boolean;
  destinatarios: number[]; // ids de persona cuando no es aTodos
};

const PAGE_SIZE = 10;

// ========= Helpers =========

function nombreCompleto(p: PersonaApi): string {
  return `${p.nombre} ${p.primer_apellido}${
    p.segundo_apellido ? ` ${p.segundo_apellido}` : ""
  }`;
}

function fechaBonita(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  return `${d.getDate()} de ${meses[d.getMonth()]}, ${d.getFullYear()}`;
}

// ========= Página =========

export default function AdminAvisosPage() {
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);

  const [avisos, setAvisos] = useState<AvisoApi[]>([]);
  const [personas, setPersonas] = useState<PersonaApi[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AvisoForm>({
    titulo: "",
    mensaje: "",
    aTodos: true,
    destinatarios: [],
  });

  // Leer sesión desde localStorage (donde guardas la respuesta de /login o /login/google)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("session");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setSession(parsed);
    } catch {
      // ignorar
    }
  }, []);

  // Cargar avisos + personas
  const fetchAvisos = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resAvisos, resPersonas] = await Promise.all([
        fetch(`${API_BASE}/avisos`),
        fetch(`${API_BASE}/personas`),
      ]);

      if (!resAvisos.ok) {
        throw new Error("No se pudieron obtener los avisos");
      }
      if (!resPersonas.ok) {
        throw new Error("No se pudieron obtener los residentes");
      }

      const dataAvisos: AvisoApi[] = await resAvisos.json();
      const dataPersonas: PersonaApi[] = await resPersonas.json();

      setAvisos(dataAvisos);
      setPersonas(dataPersonas);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar avisos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvisos();
  }, []);

  // Búsqueda y paginación
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return avisos;

    return avisos.filter((a) => {
      const titulo = a.titulo.toLowerCase();
      const msg = a.mensaje.toLowerCase();
      const emisor = (a.nombre_emisor ?? "").toLowerCase();
      const fecha = fechaBonita(a.creado_en).toLowerCase();
      return (
        titulo.includes(term) ||
        msg.includes(term) ||
        emisor.includes(term) ||
        fecha.includes(term)
      );
    });
  }, [avisos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  // Abrir formulario
  const openCreate = () => {
    setForm({
      titulo: "",
      mensaje: "",
      aTodos: true,
      destinatarios: [],
    });
    setShowForm(true);
  };

  // Cambios en formulario
  const handleFormChange = (
    field: keyof AvisoForm,
    value: string | boolean | number[]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value } as AvisoForm));
  };

  const handleDestinatariosChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) =>
      Number(opt.value)
    );
    setForm((prev) => ({ ...prev, destinatarios: selected }));
  };

  // Enviar formulario (POST /avisos)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.id_usuario) {
      alert("No se encontró la sesión del usuario emisor.");
      return;
    }

    if (!form.titulo.trim() || !form.mensaje.trim()) {
      alert("Título y mensaje son obligatorios.");
      return;
    }

    if (!form.aTodos && form.destinatarios.length === 0) {
      alert("Selecciona al menos un destinatario o marca 'Enviar a todos'.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        id_usuario_emisor: session.id_usuario,
        titulo: form.titulo.trim(),
        mensaje: form.mensaje.trim(),
        a_todos: form.aTodos,
        destinatarios: form.aTodos ? null : form.destinatarios,
      };

      const res = await fetch(`${API_BASE}/avisos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error al crear aviso");
      }

      await fetchAvisos();
      setShowForm(false);
    } catch (err: any) {
      alert(err?.message ?? "Error al crear aviso");
    } finally {
      setSubmitting(false);
    }
  };

  // Eliminar aviso (requiere DELETE /avisos/{id_aviso} en el backend)
  

  // ========= Render =========

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Cargando avisos…</p>
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
            onClick={fetchAvisos}
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
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
              L
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Gestión de Fraccionamientos
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-5 text-sm text-slate-500">
            <button
              onClick={() => router.push("/admin")}
              className="hover:text-slate-900"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/admin/residentes")}
              className="hover:text-slate-900"
            >
              Residentes
            </button>
            <button
              onClick={() => router.push("/admin/pagos")}
              className="hover:text-slate-900"
            >
              Pagos
            </button>
            <button className="font-semibold text-sky-600">
              Comunicados
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={openCreate}
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 shadow-sm"
            >
              <span>+ Crear Aviso</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-semibold text-white">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section>
          <h1 className="text-2xl font-semibold">Gestión de Avisos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Crea, edita y elimina los comunicados para los residentes.
          </p>
        </section>

        {/* Búsqueda */}
        <section className="flex justify-end">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Buscar por título o mensaje..."
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
        </section>

        {/* Tabla */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-100 flex items-center text-xs font-semibold text-slate-500">
            <div className="w-8 flex justify-center">
              <input type="checkbox" disabled />
            </div>
            <div className="flex-1">Título del aviso</div>
            <div className="w-56">Destinatarios</div>
            <div className="w-40">Fecha de publicación</div>
          </div>

          <div className="divide-y divide-slate-100 text-sm">
            {pageItems.map((a) => (
              <div
                key={a.id_aviso}
                className="px-6 py-3 flex items-center hover:bg-slate-50"
              >
                <div className="w-8 flex justify-center">
                  <input type="checkbox" />
                </div>

                <div className="flex-1 text-sm text-slate-800">
                  <div className="font-medium">{a.titulo}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">
                    {a.mensaje}
                  </div>
                </div>

                <div className="w-56 text-sm text-slate-700">
                  {a.a_todos
                    ? "Todos los residentes"
                    : "Destinatarios específicos"}
                </div>

                <div className="w-40 text-sm text-slate-700">
                  {fechaBonita(a.creado_en)}
                </div>

               
              </div>
            ))}

            {pageItems.length === 0 && (
              <div className="px-6 py-6 text-sm text-slate-500">
                No se encontraron avisos con ese criterio de búsqueda.
              </div>
            )}
          </div>

          {/* Paginación */}
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

      {/* Modal crear aviso */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg px-6 py-5">
            <h2 className="text-lg font-semibold mb-1">
              Crear nuevo aviso
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Especifica el título, mensaje y destinatarios del aviso.
            </p>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Título
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  value={form.titulo}
                  onChange={(e) =>
                    handleFormChange("titulo", e.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Mensaje
                </label>
                <textarea
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 min-h-[120px]"
                  value={form.mensaje}
                  onChange={(e) =>
                    handleFormChange("mensaje", e.target.value)
                  }
                  required
                />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  id="aTodos"
                  type="checkbox"
                  checked={form.aTodos}
                  onChange={(e) =>
                    handleFormChange("aTodos", e.target.checked)
                  }
                  className="h-4 w-4"
                />
                <label
                  htmlFor="aTodos"
                  className="text-xs text-slate-700"
                >
                  Enviar a todos los residentes
                </label>
              </div>

              {!form.aTodos && (
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Destinatarios específicos
                  </label>
                  <select
                    multiple
                    size={5}
                    value={form.destinatarios.map(String)}
                    onChange={handleDestinatariosChange}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {personas.map((p) => (
                      <option key={p.id_persona} value={p.id_persona}>
                        {nombreCompleto(p)}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Mantén presionada la tecla Ctrl (o Cmd en Mac) para
                    seleccionar varios residentes.
                  </p>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => !submitting && setShowForm(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-sky-600 text-white text-xs font-semibold px-4 py-2 hover:bg-sky-700 disabled:opacity-50"
                >
                  {submitting ? "Guardando..." : "Crear aviso"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
