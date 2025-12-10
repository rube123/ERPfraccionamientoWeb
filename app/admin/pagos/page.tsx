// app/admin/pagos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// ===== Tipos que vienen de la API =====

type PagoApi = {
  no_transaccion: number;
  fecha_transaccion: string; // ISO
  id_persona: number;
  id_usuario_registro: number;
  id_tipo_cuota: number;
  cve_tipo_pago: number;
  total: string; // numeric(10,2) -> string en la API
  estado: string; // "pagado", "pendiente", "fallido", ...
};

type PersonaApi = {
  id_persona: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string | null;
  telefono: string | null;
  no_residencia: number | null;
};

type EstadoPagoUI = "Todos" | "Pagado" | "Pendiente" | "Vencido" | "Otro";

type PagoUI = {
  id: number;
  residenteNombre: string;
  residenteEmail: string;
  concepto: string;
  fechaPagoTexto: string;
  montoNumber: number;
  estadoUI: EstadoPagoUI;
  estadoRaw: string;
};

const PAGE_SIZE = 10;

// ===== Helpers =====

function nombreCompleto(p: PersonaApi): string {
  return `${p.nombre} ${p.primer_apellido}${
    p.segundo_apellido ? ` ${p.segundo_apellido}` : ""
  }`;
}

function conceptoDesdePago(p: PagoApi): string {
  // Puedes ajustar estos valores a tus catálogos reales
  if (p.id_tipo_cuota === 1) return "Cuota de Mantenimiento";
  if (p.id_tipo_cuota === 2) return "Cuota Extraordinaria";
  return "Otro pago";
}

function estadoUiFromRaw(raw: string): EstadoPagoUI {
  const e = raw.toLowerCase();
  if (e === "pagado") return "Pagado";
  if (e === "pendiente") return "Pendiente";
  if (e === "vencido") return "Vencido";
  if (e === "fallido") return "Vencido";
  return "Otro";
}

function formatCurrency(n: number) {
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function fechaBonita(fechaIso: string): string {
  if (!fechaIso) return "-";
  const d = new Date(fechaIso);
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

  const dia = d.getDate();
  const mes = meses[d.getMonth()];
  const año = d.getFullYear();
  return `${dia} de ${mes}, ${año}`;
}

// ===== Componente principal =====

export default function AdminPagosPage() {
  const router = useRouter();

  const [pagos, setPagos] = useState<PagoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<EstadoPagoUI>("Todos");
  const [soloPendientes, setSoloPendientes] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ==== Cargar datos desde la API ====
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [resPagos, resPersonas] = await Promise.all([
          fetch(`${API_BASE}/pagos/historial_todos`),      // todos los pagos :contentReference[oaicite:1]{index=1}
          fetch(`${API_BASE}/personas`),                   // para obtener nombre y correo :contentReference[oaicite:2]{index=2}
        ]);

        if (!resPagos.ok) {
          throw new Error("No se pudo obtener el historial de pagos");
        }
        if (!resPersonas.ok) {
          throw new Error("No se pudo obtener la lista de residentes");
        }

        const pagosApi: PagoApi[] = await resPagos.json();
        const personasApi: PersonaApi[] = await resPersonas.json();

        const personaMap = new Map<number, PersonaApi>();
        personasApi.forEach((p) => personaMap.set(p.id_persona, p));

        const pagosUI: PagoUI[] = pagosApi.map((p) => {
          const persona = personaMap.get(p.id_persona);
          const nombre = persona ? nombreCompleto(persona) : `Persona #${p.id_persona}`;
          const email = persona?.correo ?? "";

          const montoNumber = Number(p.total ?? "0");

          return {
            id: p.no_transaccion,
            residenteNombre: nombre,
            residenteEmail: email,
            concepto: conceptoDesdePago(p),
            fechaPagoTexto: fechaBonita(p.fecha_transaccion),
            montoNumber,
            estadoUI: estadoUiFromRaw(p.estado),
            estadoRaw: p.estado,
          };
        });

        setPagos(pagosUI);
      } catch (e: any) {
        console.error(e);
        setError(e.message ?? "Error al cargar pagos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ==== Filtros (historial completo + pendientes) ====
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let data = [...pagos];

    // filtro por estado específico
    if (estadoFilter !== "Todos") {
      data = data.filter((p) => p.estadoUI === estadoFilter);
    }

    // toggle de solo pendientes
    if (soloPendientes) {
      data = data.filter((p) => p.estadoUI === "Pendiente");
    }

    if (!term) return data;

    return data.filter((p) => {
      return (
        p.residenteNombre.toLowerCase().includes(term) ||
        p.residenteEmail.toLowerCase().includes(term) ||
        p.concepto.toLowerCase().includes(term) ||
        p.fechaPagoTexto.toLowerCase().includes(term)
      );
    });
  }, [pagos, search, estadoFilter, soloPendientes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);



  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-500">
          Cargando historial de pagos…
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
            onClick={() => window.location.reload()}
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
            <button
              onClick={() => router.push("/admin/residentes")}
              className="hover:text-slate-900"
            >
              Residentes
            </button>
            <button className="font-semibold text-sky-600">
              Pagos
            </button>
            <button
              onClick={() => router.push("/admin/avisos")}
              className="hover:text-slate-900"
            >
              Comunicados
            </button>
          </nav>

          {/* Botón registrar + avatar */}
          <div className="flex items-center gap-4">

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
          <h1 className="text-2xl font-semibold">Historial de Pagos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Consulta el historial de pagos de todos los residentes y revisa los pagos pendientes.
          </p>
        </section>

        {/* Barra de búsqueda y filtros */}
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Búsqueda */}
          <div className="flex-1 flex items-center gap-2">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Buscar por residente o fecha..."
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
          </div>

          {/* Filtros y exportar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={estadoFilter}
              onChange={(e) =>
                setEstadoFilter(e.target.value as EstadoPagoUI)
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 pr-8 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Pagado">Pagado</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Vencido">Vencido</option>
              <option value="Otro">Otros</option>
            </select>

            {/* Toggle rápido para ver SOLO pendientes */}
            <button
              type="button"
              onClick={() => setSoloPendientes((v) => !v)}
              className={`rounded-xl px-3 py-2 text-sm border ${
                soloPendientes
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {soloPendientes ? "Ver todos" : "Ver solo pendientes"}
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Exportar
            </button>

            
          </div>
        </section>

        {/* Tabla de pagos */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Encabezado */}
          <div className="px-6 py-3 border-b border-slate-100 flex items-center text-xs font-semibold text-slate-500">
            <div className="w-8 flex justify-center">
              <input type="checkbox" />
            </div>
            <div className="flex-1">Residente</div>
            <div className="w-56">Concepto</div>
            <div className="w-40">Fecha de pago</div>
            <div className="w-28 text-right">Monto</div>
            <div className="w-28">Estado</div>
            <div className="w-24 text-right">Acciones</div>
          </div>

          {/* Filas */}
          <div className="divide-y divide-slate-100 text-sm">
            {pageItems.map((pago) => (
              <div
                key={pago.id}
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
                      {pago.residenteNombre}
                    </span>
                    <span className="text-xs text-slate-500">
                      {pago.residenteEmail || "Sin correo"}
                    </span>
                  </div>
                </div>

                {/* Concepto */}
                <div className="w-56 text-sm text-slate-700 truncate">
                  {pago.concepto}
                </div>

                {/* Fecha */}
                <div className="w-40 text-sm text-slate-700">
                  {pago.fechaPagoTexto}
                </div>

                {/* Monto */}
                <div className="w-28 text-right text-sm text-slate-800">
                  {formatCurrency(pago.montoNumber)}
                </div>

                {/* Estado */}
                <div className="w-28">
                  <EstadoPagoBadge estado={pago.estadoUI} />
                </div>

                {/* Acciones */}
                <div className="w-24 flex justify-end gap-2 text-xs">
                  <button className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">
                    Ver
                  </button>
                  <button className="rounded-lg border border-slate-200 px-2 py-1 hover:bg-slate-50">
                    Recibo
                  </button>
                </div>
              </div>
            ))}

            {pageItems.length === 0 && (
              <div className="px-6 py-6 text-sm text-slate-500">
                No se encontraron pagos con ese criterio de búsqueda.
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
    </main>
  );
}

// ===== Badge de estado =====

function EstadoPagoBadge({ estado }: { estado: EstadoPagoUI }) {
  const base =
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold";

  if (estado === "Pagado") {
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700`}>
        Pagado
      </span>
    );
  }
  if (estado === "Pendiente") {
    return (
      <span className={`${base} bg-amber-50 text-amber-700`}>
        Pendiente
      </span>
    );
  }
  if (estado === "Vencido") {
    return (
      <span className={`${base} bg-rose-50 text-rose-700`}>
        Vencido
      </span>
    );
  }
  if (estado === "Otro") {
    return (
      <span className={`${base} bg-slate-100 text-slate-600`}>
        Otro
      </span>
    );
  }
  return <span className={base}>{estado}</span>;
}
