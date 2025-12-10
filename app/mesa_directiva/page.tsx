"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// =============== Tipos ===============

type StoredUser = {
  id_usuario: number;
  id_persona: number;
  correo: string;
  nombre_completo: string;
  roles: string[];
};

type ReservaRow = {
  no_reserva: number;
  cve_area: number;
  area_nombre: string;
  id_persona_solicitante: number;
  fecha_reserva: string; // "YYYY-MM-DD"
  hora_inicio: string;   // "HH:MM:SS"
  hora_fin: string;      // "HH:MM:SS"
  estado: string;
  id_usuario_registro: number;
};

type PagoRow = {
  no_transaccion: number;
  fecha_transaccion: string; // ISO
  id_persona: number;
  id_usuario_registro: number;
  id_tipo_cuota: number;
  cve_tipo_pago: number;
  total: string;
  estado: string;
};

type AvisoRow = {
  id_aviso: number;
  titulo: string;
  mensaje: string;
  a_todos: boolean;
  enviado_por: number;
  creado_en: string; // ISO
  nombre_emisor: string | null;
};

type AvisosMesItem = {
  anio: number;
  mes: number;
  total: number;
};

type DashboardMesaResp = {
  reservas: ReservaRow[];
  pagos: PagoRow[];
  avisos_por_mes: AvisosMesItem[];
};

// =============== Helpers ===============

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

function formatCurrency(totalStr: string) {
  const n = Number(totalStr);
  if (isNaN(n)) return `$${totalStr} MXN`;
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function formatDateTime(fecha: string) {
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatReservaLinea(r: ReservaRow) {
  const d = new Date(`${r.fecha_reserva}T${r.hora_inicio}`);
  const dateLabel = isNaN(d.getTime())
    ? r.fecha_reserva
    : d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

  return `${dateLabel} · ${r.hora_inicio.slice(0, 5)} - ${r.hora_fin.slice(
    0,
    5
  )}`;
}

function isSameMonth(dateStr: string, ref: Date) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth()
  );
}

// =============== Página ===============

export default function BoardDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardMesaResp | null>(null);
  const [pagosMantenimiento, setPagosMantenimiento] = useState<PagoRow[]>([]);
  const [avisosEsteMes, setAvisosEsteMes] = useState<AvisoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Proteger ruta (solo mesa_directiva)
  useEffect(() => {
    const u = readStoredUser();
    if (!u || !userIsMesa(u)) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // Cargar datos de dashboard mesa + pagos mantenimiento + avisos
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();

        const [mesaRes, pagosMantRes, avisosRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/mesa/${user.id_persona}`),
          fetch(`${API_BASE}/pagos/historial_mantenimiento`),
          fetch(`${API_BASE}/avisos`),
        ]);

        if (!mesaRes.ok) {
          throw new Error("Error cargando dashboard de mesa directiva.");
        }
        if (!pagosMantRes.ok) {
          throw new Error("Error cargando pagos de mantenimiento.");
        }
        if (!avisosRes.ok) {
          throw new Error("Error cargando avisos.");
        }

        const mesaJson = (await mesaRes.json()) as DashboardMesaResp;
        const pagosMantJson = (await pagosMantRes.json()) as PagoRow[];
        const avisosJson = (await avisosRes.json()) as AvisoRow[];

        // Filtrar avisos del mes actual
        const avisosMes = avisosJson.filter((a) =>
          isSameMonth(a.creado_en, now)
        );

        setDashboard(mesaJson);
        setPagosMantenimiento(pagosMantJson);
        setAvisosEsteMes(avisosMes);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message ??
            "No se pudo cargar la información de la mesa directiva."
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

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

  const reservas = dashboard?.reservas ?? [];
  const pagos = dashboard?.pagos ?? [];

  const now = new Date();

  // Pagos de mantenimiento de este mes
  const pagosMantEsteMes = pagosMantenimiento.filter((p) =>
    isSameMonth(p.fecha_transaccion, now)
  );
  const totalMantenimientoMes = pagosMantEsteMes.reduce((acc, p) => {
    const n = Number(p.total);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  // Reservas de este mes
  const reservasMes = reservas.filter((r) =>
    isSameMonth(`${r.fecha_reserva}T00:00:00`, now)
  );

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">
          Cargando dashboard de mesa directiva…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-2xl shadow px-6 py-4 max-w-md text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            className="mt-2 text-xs font-semibold text-sky-600"
            onClick={() => location.reload()}
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // Items del menú lateral
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

    // Subrutas: /admin/mesa_directiva/residentes, /pagos, etc.
    return pathname.startsWith(path);
  };

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
                {/* icono hamburguesa simple */}
                <div className="space-y-1">
                  <span className="block h-0.5 w-4 bg-current" />
                  <span className="block h-0.5 w-4 bg-current" />
                  <span className="block h-0.5 w-4 bg-current" />
                </div>
              </button>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">
                  Mesa Directiva
                  <span className="text-sky-500 ml-1">Dashboard</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Resumen general del fraccionamiento
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
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Header secundario con logout (para móvil) */}
            <div className="flex items-center justify-between sm:hidden">
              <h1 className="text-xl font-semibold">Dashboard</h1>
              <button
                onClick={handleLogout}
                className="text-[11px] font-semibold text-red-600 border border-red-200 rounded-full px-3 py-1 bg-red-50 hover:bg-red-100"
              >
                Cerrar sesión
              </button>
            </div>

            {/* Tarjetas superiores dinámicas */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Mantenimiento cobrado (mes actual)"
                value={formatCurrency(totalMantenimientoMes.toString())}
                subtitle={`${pagosMantEsteMes.length} pago(s) de mantenimiento`}
              />
              <StatCard
                title="Reservas de áreas (mes actual)"
                value={reservasMes.length.toString()}
                subtitle="Reservas registradas este mes"
              />
              <StatCard
                title="Avisos registrados (mes actual)"
                value={avisosEsteMes.length.toString()}
                subtitle="Avisos enviados a la comunidad"
              />
            </section>

            

            {/* Reservas + Pagos de mantenimiento */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Reservas de áreas */}
              <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">
                  Reservas de áreas
                </h2>
                {reservas.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No hay reservas registradas todavía.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {reservas.slice(0, 8).map((r) => (
                      <li
                        key={r.no_reserva}
                        className="py-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{r.area_nombre}</p>
                          <p className="text-xs text-slate-500">
                            {formatReservaLinea(r)}
                          </p>
                        </div>
                        <span className="text-[11px] px-2 py-1 rounded-full border text-slate-600">
                          {r.estado}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  className="mt-4 w-full rounded-xl border border-sky-300 text-sky-600 text-sm font-semibold py-2"
                  onClick={() => router.push("/mesa_directiva/areas")}
                >
                  Gestionar reservas
                </button>
              </div>

              {/* Pagos de mantenimiento */}
              <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-3">
                  Pagos de mantenimiento
                </h2>
                {pagosMantenimiento.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Aún no hay pagos de mantenimiento registrados.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {pagosMantenimiento.slice(0, 8).map((p) => (
                      <li
                        key={p.no_transaccion}
                        className="py-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            {formatCurrency(p.total)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDateTime(p.fecha_transaccion)}
                          </p>
                        </div>
                        <span
                          className={`text-[11px] px-2 py-1 rounded-full border ${
                            p.estado.toLowerCase() === "pagado"
                              ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                              : p.estado.toLowerCase() === "pendiente"
                              ? "text-amber-700 border-amber-200 bg-amber-50"
                              : "text-slate-600 border-slate-200"
                          }`}
                        >
                          {p.estado}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  className="mt-4 w-full rounded-xl border border-sky-300 text-sky-600 text-sm font-semibold py-2"
                  onClick={() => router.push("/mesa_directiva/pagos")}
                >
                  Ver administración de pagos
                </button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// =============== Componentes auxiliares ===============

type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {subtitle && (
        <p className="text-xs mt-2 text-slate-500">{subtitle}</p>
      )}
    </div>
  );
}

type QuickActionButtonProps = {
  label: string;
  description: string;
  onClick?: () => void;
};

function QuickActionButton({
  label,
  description,
  onClick,
}: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-slate-200 px-4 py-2.5 hover:border-sky-300 hover:bg-slate-50 transition"
    >
      <p className="text-sm font-semibold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </button>
  );
}

type AnnouncementItemProps = {
  title: string;
  date: string;
  emisor: string;
};

function AnnouncementItem({ title, date, emisor }: AnnouncementItemProps) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{date}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">Por {emisor}</p>
    </div>
  );
}
