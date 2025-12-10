// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// ================== Tipos ==================

type StoredUser = {
  id_usuario: number;
  id_persona: number;
  correo: string;
  nombre_completo: string;
  roles: string[];
};
type PersonaRow = {
  id_persona: number;
  nombre: string;
  primer_apellido: string;
  segundo_apellido: string | null;
  correo: string;
  telefono: string | null;
  no_residencia: string | null;
};
type ReservaConAreaRow = {
  no_reserva: number;
  cve_area: number;
  area_nombre: string;
  id_persona_solicitante: number;
  fecha_reserva: string; // YYYY-MM-DD
  hora_inicio: string; // HH:MM:SS
  hora_fin: string; // HH:MM:SS
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
  total: string; // numeric -> string
  estado: string;
};

type AvisosMesItem = {
  anio: number;
  mes: number; // 1-12
  total: number;
};

type DashboardAdminResp = {
  reservas: ReservaConAreaRow[];
  pagos: PagoRow[];
  avisos_por_mes: AvisosMesItem[];
};

// ================== Helpers ==================

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


function userIsAdmin(user: StoredUser | null) {
  if (!user) return false;
  return user.roles.map((r) => r.toLowerCase()).includes("admin");
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

function formatReservaLinea(r: ReservaConAreaRow) {
  const fecha = new Date(`${r.fecha_reserva}T${r.hora_inicio}`);
  const fechaTxt = isNaN(fecha.getTime())
    ? r.fecha_reserva
    : fecha.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
      });
  return `${fechaTxt} · ${r.hora_inicio.slice(0, 5)} - ${r.hora_fin.slice(
    0,
    5
  )}`;
}

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

// ================== Página ==================

export default function DashboardPage() {

  
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [dashboard, setDashboard] = useState<DashboardAdminResp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [personasCount, setPersonasCount] = useState<number | null>(null);
const [pagosTodos, setPagosTodos] = useState<PagoRow[]>([]);

  // Proteger ruta (solo admin)
  useEffect(() => {
    const u = readStoredUser();
    if (!u || !userIsAdmin(u)) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // Cargar datos del dashboard
// Cargar datos del dashboard
useEffect(() => {
  if (!user) return;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Dashboard admin
      // 2) Todas las personas (para contar residentes)
      // 3) Todos los pagos (para sumar ingresos)
      const [dashboardRes, personasRes, pagosRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/admin`),
        fetch(`${API_BASE}/personas`),
        fetch(`${API_BASE}/pagos/historial_todos`),
      ]);

      if (!dashboardRes.ok) {
        throw new Error("Error cargando dashboard de administrador.");
      }
      if (!personasRes.ok) {
        throw new Error("Error cargando personas.");
      }
      if (!pagosRes.ok) {
        throw new Error("Error cargando pagos.");
      }

      const dashboardData: DashboardAdminResp = await dashboardRes.json();
      const personasData: PersonaRow[] = await personasRes.json();
      const pagosData: PagoRow[] = await pagosRes.json();

      setDashboard(dashboardData);
      setPersonasCount(personasData.length);
      setPagosTodos(pagosData);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "No se pudo cargar la información del administrador.");
    } finally {
      setLoading(false);
    }
  };

  load();
}, [user]);

const handleLogout = async () => {
  try {
    clearStoredUser();
    await signOut(auth).catch(() => {});
  } finally {
    router.push("/login");
  }
};

  const displayName = user?.nombre_completo ?? "Admin";
  const displayEmail = user?.correo ?? "admin@frac.com";
  const avatarLetter =
    displayName.trim().length > 0
      ? displayName.trim().charAt(0).toUpperCase()
      : "A";

  const reservas = dashboard?.reservas ?? [];
  const pagos = dashboard?.pagos ?? [];
  const avisosPorMes = dashboard?.avisos_por_mes ?? [];
  // ====== Stats para las tarjetas resumen ======
  const totalResidentes = personasCount ?? 0;

  const hoy = new Date();
  const mesActual = hoy.getMonth(); // 0-11
  const anioActual = hoy.getFullYear();

  // Solo pagos "pagado"
  const pagosPagados = pagosTodos.filter(
    (p) => p.estado.toLowerCase() === "pagado"
  );

  // Ingresos del mes actual
  const pagosMesActual = pagosPagados.filter((p) => {
    const d = new Date(p.fecha_transaccion);
    return (
      !isNaN(d.getTime()) &&
      d.getMonth() === mesActual &&
      d.getFullYear() === anioActual
    );
  });

  const ingresosMesActualNumber = pagosMesActual.reduce(
    (acc, p) => acc + (Number(p.total) || 0),
    0
  );

  const ingresosMes = formatCurrency(ingresosMesActualNumber.toString());

  // Comparación con el mes anterior
  const fechaMesAnterior = new Date(anioActual, mesActual - 1, 1);
  const mesAnterior = fechaMesAnterior.getMonth();
  const anioMesAnterior = fechaMesAnterior.getFullYear();

  const pagosMesAnterior = pagosPagados.filter((p) => {
    const d = new Date(p.fecha_transaccion);
    return (
      !isNaN(d.getTime()) &&
      d.getMonth() === mesAnterior &&
      d.getFullYear() === anioMesAnterior
    );
  });

  const ingresosMesAnteriorNumber = pagosMesAnterior.reduce(
    (acc, p) => acc + (Number(p.total) || 0),
    0
  );

  let variacionIngresos = "Sin datos del mes anterior";
  let variacionIngresosClass = "text-slate-500";

  if (ingresosMesAnteriorNumber > 0) {
    const diff = ingresosMesActualNumber - ingresosMesAnteriorNumber;
    const pct = (diff / ingresosMesAnteriorNumber) * 100;
    const signo = pct >= 0 ? "+" : "";
    variacionIngresos = `${signo}${pct.toFixed(1)}% vs mes anterior`;
    variacionIngresosClass = pct >= 0 ? "text-emerald-600" : "text-rose-600";
  }

  // Gastos del mes (estimado simple: 40% de los ingresos del mes)
  const gastosMesNumber = ingresosMesActualNumber * 0.4;
  const gastosMes = formatCurrency(gastosMesNumber.toFixed(2));
  const variacionGastosClass = "text-rose-600";

  // Saldo actual = total histórico cobrado (todos los pagos pagados)
  const saldoActualNumber = pagosPagados.reduce(
    (acc, p) => acc + (Number(p.total) || 0),
    0
  );
  const saldoActual = formatCurrency(saldoActualNumber.toString());
  const saldoActualSubtitle =
    saldoActualNumber > 0
      ? "Total histórico cobrado"
      : "Aún no hay pagos registrados";

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Cargando panel de administrador…</p>
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

  return (
    <main className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Perfil */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-semibold">
            {avatarLetter}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold line-clamp-1">
              {displayName}
            </span>
            <span className="text-xs text-slate-500">Administrador</span>
            <span className="text-[11px] text-slate-400 line-clamp-1">
              {displayEmail}
            </span>
          </div>
        </div>

        {/* Menú */}
        <nav className="mt-4 px-3 space-y-1 text-sm">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl bg-sky-100 text-sky-700 font-medium">
            <span className="h-8 w-8 rounded-full bg-sky-500/10 flex items-center justify-center text-xs font-semibold">
              DB
            </span>
            <span>Dashboard</span>
          </button>
          <SidebarItem
            label="Residentes"
            icon="R"
            onClick={() => router.push("/admin/residentes")}
          />
          <SidebarItem
            label="Mesa Directiva"
            icon="M"
            onClick={() => router.push("/admin/mesa_directiva")}
          />
          <SidebarItem
            label="Pagos"
            icon="$"
            onClick={() => router.push("/admin/pagos")}
          />
          <SidebarItem
            label="Áreas"
            icon="A"
            onClick={() => router.push("/admin/areas")}
          />
          <SidebarItem
            label="Avisos"
            icon="AV"
            onClick={() => router.push("/admin/avisos")}
          />
        </nav>

        {/* Botón acción rápida */}
        <div className="mt-auto px-4 pb-2 pt-6">
          <button
            className="w-full rounded-xl bg-sky-500 text-white text-sm font-medium py-2.5"
            onClick={() => router.push("/admin/avisos/nuevo")}
          >
            Crear aviso rápido
          </button>
        </div>

        {/* Config / ayuda / logout */}
        <div className="px-4 pb-6 space-y-2 text-xs text-slate-500">
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50">
            <span className="h-5 w-5 rounded-full border border-slate-300 text-[10px] flex items-center justify-center">
              ⚙
            </span>
            <span>Configuración</span>
          </button>
          <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50">
            <span className="h-5 w-5 rounded-full border border-slate-300 text-[10px] flex items-center justify-center">
              ?
            </span>
            <span>Ayuda</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-red-50 text-red-600"
            onClick={handleLogout}
          >
            <span className="h-5 w-5 rounded-full border border-red-300 text-[10px] flex items-center justify-center">
              ⏻
            </span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <section className="flex-1 px-10 py-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-semibold">Bienvenido, Administrador</h1>
          <p className="text-sm text-slate-500 mt-1">
            Aquí tienes un resumen del estado del fraccionamiento.
          </p>
        </header>

        {/* Tarjetas resumen (pueden seguir siendo estáticas por ahora) */}
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total de Residentes"
            value={totalResidentes.toString()}
            subtitle="Residentes registrados en el sistema"
            subtitleClass="text-emerald-600"
          />
          <SummaryCard
            title="Ingresos del Mes"
            value={ingresosMes}
            subtitle={variacionIngresos}
            subtitleClass={variacionIngresosClass}
          />
          <SummaryCard
            title="Gastos del Mes"
            value={gastosMes}
            subtitle="Estimado 40% de los ingresos del mes"
            subtitleClass={variacionGastosClass}
          />
          <SummaryCard
            title="Saldo Actual"
            value={saldoActual}
            subtitle={saldoActualSubtitle}
            subtitleClass="text-slate-500"
          />
        </section>


        {/* Actividad reciente + gráfica + gestión */}
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Columna izquierda: reservas y pagos recientes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Reservas recientes */}
            <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Reservas recientes</h2>
                <button
                  className="text-xs font-semibold text-sky-600"
                  onClick={() => router.push("/admin/reservas")}
                >
                  Ver todas las reservas
                </button>
              </div>
              {reservas.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No hay reservas registradas todavía.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {reservas.slice(0, 6).map((r) => (
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
            </div>

            {/* Pagos recientes */}
            <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">Pagos recientes</h2>
                <button
                  className="text-xs font-semibold text-sky-600"
                  onClick={() => router.push("/admin/pagos")}
                >
                  Ver todos los pagos
                </button>
              </div>
              {pagos.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No hay pagos registrados todavía.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {pagos.slice(0, 6).map((pago) => (
                    <li
                      key={pago.no_transaccion}
                      className="py-2.5 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {formatCurrency(pago.total)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(pago.fecha_transaccion)}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full border ${
                          pago.estado.toLowerCase() === "pagado"
                            ? "text-emerald-700 border-emerald-200 bg-emerald-50"
                            : pago.estado.toLowerCase() === "pendiente"
                            ? "text-amber-700 border-amber-200 bg-amber-50"
                            : "text-slate-600 border-slate-200"
                        }`}
                      >
                        {pago.estado}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Columna derecha: gráfica avisos + gestión */}
          <div className="space-y-6">
            {/* Gráfica de avisos por mes */}
            <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
              <h2 className="text-base font-semibold">
                Avisos enviados por mes
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Últimos 12 meses registrados.
              </p>
              <AvisosBarChart data={avisosPorMes} />
            </div>

            {/* Gestión del sistema */}
            <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
              <h2 className="text-base font-semibold mb-3">
                Gestión del sistema
              </h2>
              <div className="space-y-2 text-sm">
                <QuickActionRow
                  title="Residentes"
                  description="Ver y administrar todos los residentes"
                  onClick={() => router.push("/admin/residentes")}
                />
                <QuickActionRow
                  title="Mesa Directiva"
                  description="Ver miembros y sus cargos"
                  onClick={() => router.push("/admin/mesa_directiva")}
                />
                <QuickActionRow
                  title="Pagos"
                  description="Historial y estado de pagos"
                  onClick={() => router.push("/admin/pagos")}
                />
                <QuickActionRow
                  title="Áreas comunes"
                  description="Configurar y revisar reservas"
                  onClick={() => router.push("/admin/areas")}
                />
                <QuickActionRow
                  title="Avisos"
                  description="Ver avisos enviados a la comunidad"
                  onClick={() => router.push("/admin/avisos")}
                />
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

// ================== Componentes auxiliares ==================

type SidebarItemProps = {
  label: string;
  icon: string;
  onClick?: () => void;
};

function SidebarItem({ label, icon, onClick }: SidebarItemProps) {
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50"
      onClick={onClick}
    >
      <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle: string;
  subtitleClass?: string;
};

function SummaryCard({
  title,
  value,
  subtitle,
  subtitleClass,
}: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">
        {title}
      </p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className={`mt-2 text-xs ${subtitleClass}`}>{subtitle}</p>
    </div>
  );
}

type QuickActionRowProps = {
  title: string;
  description: string;
  onClick?: () => void;
};

function QuickActionRow({
  title,
  description,
  onClick,
}: QuickActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-slate-50 text-left"
    >
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <span className="text-xs text-sky-500 font-semibold">Ver</span>
    </button>
  );
}

type AvisosBarChartProps = {
  data: AvisosMesItem[];
};

function AvisosBarChart({ data }: AvisosBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <p className="mt-4 text-xs text-slate-500">
        Aún no hay datos de avisos enviados.
      </p>
    );
  }

  const sorted = [...data].sort((a, b) =>
    a.anio === b.anio ? a.mes - b.mes : a.anio - b.anio
  );
  const maxTotal = Math.max(...sorted.map((d) => d.total), 0);

  return (
    <div className="mt-4 h-48 flex items-end gap-3 border-t border-slate-100 pt-4">
      {sorted.map((item) => {
        const barHeight =
          maxTotal > 0 ? 20 + (item.total / maxTotal) * 80 : 0; // 20%–100%
        const monthLabel = MONTHS[item.mes - 1] ?? item.mes.toString();

        return (
          <div
            key={`${item.anio}-${item.mes}`}
            className="flex-1 flex flex-col items-center"
          >
            <div
              className="w-full bg-sky-100 rounded-t-xl flex items-end justify-center"
              style={{ height: `${barHeight}%` }}
            >
              <span className="text-[10px] text-sky-700 font-semibold mb-1">
                {item.total}
              </span>
            </div>
            <span className="mt-1 text-[11px] text-slate-500">
              {monthLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}
