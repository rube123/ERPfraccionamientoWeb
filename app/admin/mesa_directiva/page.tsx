// app/admin/mesa_directiva/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// Tipo que regresa GET /mesa_directiva/miembros
type MesaDirectivaMiembro = {
  id_persona: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string | null;
  telefono: string | null;
  numero_residencia: number | null;
  cargo: string; // en tu API viene del campo rol.nombre
};

const PAGE_SIZE = 10;

function nombreCompleto(m: MesaDirectivaMiembro): string {
  return `${m.nombre} ${m.primer_apellido}${
    m.segundo_apellido ? ` ${m.segundo_apellido}` : ""
  }`;
}

export default function MesaDirectivaPage() {
  const [miembros, setMiembros] = useState<MesaDirectivaMiembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const router = useRouter();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Cargar miembros desde tu API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE}/mesa_directiva/miembros`);
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(
            txt || "No se pudo obtener la mesa directiva desde la API"
          );
        }
        const data: MesaDirectivaMiembro[] = await res.json();
        setMiembros(data);
      } catch (e: any) {
        setError(e?.message ?? "Error al cargar la mesa directiva");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return miembros;

    return miembros.filter((m) => {
      const n = nombreCompleto(m).toLowerCase();
      const cargo = (m.cargo || "").toLowerCase();
      const correo = (m.correo || "").toLowerCase();
      return (
        n.includes(term) || cargo.includes(term) || correo.includes(term)
      );
    });
  }, [miembros, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">Cargando mesa directiva…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow px-6 py-4 max-w-md text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <p className="text-xs text-slate-500">
            Revisa que tu backend esté corriendo en{" "}
            <code>{API_BASE}</code> y que exista{" "}
            <code>GET /mesa_directiva/miembros</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Topbar */}
       <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* lado izquierdo del header */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
            L
          </div>
          <span className="text-sm font-semibold text-slate-800">
            AdminFraccionamiento
          </span>
        </div>

        {/* botón para regresar al dashboard */}
        <button
          onClick={() => router.push("/admin")}
          className="rounded-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium px-4 py-2 shadow-sm"
        >
          Volver al Dashboard
        </button>
      </div>
    </header>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Título */}
        <section>
          <h1 className="text-2xl font-semibold">Gestión de Mesa Directiva</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra los miembros actuales de la mesa directiva.
          </p>
        </section>

        {/* Tarjeta principal con buscador + tabla */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-4 space-y-4">
          {/* Buscador (sin botón de crear porque tu API no tiene endpoint POST) */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="relative w-full md:max-w-sm">
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o correo…"
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

            {/* Aquí iría el botón "Crear nuevo miembro" SI existiera un endpoint POST.
                Como tu API solo expone GET /mesa_directiva/miembros, no lo mostramos. */}
          </div>

          {/* Tabla */}
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            {/* Encabezado */}
            <div className="px-4 md:px-6 py-3 border-b border-slate-100 flex items-center text-xs font-semibold text-slate-500">
              <div className="flex-1">Nombre</div>
              <div className="w-40">Cargo</div>
              <div className="w-56">Contacto</div>
              <div className="w-40">Residencia / Teléfono</div>
            </div>

            {/* Filas */}
            <div className="divide-y divide-slate-100 text-sm">
              {pageItems.map((m) => (
                <div
                  key={m.id_persona}
                  className="px-4 md:px-6 py-3 flex items-center hover:bg-slate-50"
                >
                  <div className="flex-1 text-sm text-slate-800">
                    {nombreCompleto(m)}
                  </div>
                  <div className="w-40 text-sm text-sky-600">
                    {m.cargo || "Mesa directiva"}
                  </div>
                  <div className="w-56 text-sm text-slate-700 truncate">
                    {m.correo || "Sin correo"}
                  </div>
                  <div className="w-40 text-sm text-slate-700">
                    {m.numero_residencia
                      ? `Casa ${m.numero_residencia}`
                      : m.telefono || "-"}
                  </div>
                </div>
              ))}

              {pageItems.length === 0 && (
                <div className="px-6 py-6 text-sm text-slate-500">
                  No se encontraron miembros con ese criterio de búsqueda.
                </div>
              )}
            </div>

            {/* Paginación */}
            <div className="px-4 md:px-6 py-3 border-t border-slate-100 flex items-center justify-center gap-1 text-xs text-slate-500">
              <button
                disabled={page === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
        </section>
      </div>
    </main>
  );
}
