// app/residente/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002";

// ==== Tipos que regresan tus endpoints ====

type StoredUser = {
  id_usuario: number;
  id_persona: number;
  correo: string;
  nombre_completo: string;
  roles: string[];
};

type Reserva = {
  no_reserva: number;
  cve_area: number;
  area_nombre: string;
  id_persona_solicitante: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
  id_usuario_registro: number;
};

type Pago = {
  no_transaccion: number;
  fecha_transaccion: string;
  id_persona: number;
  id_usuario_registro: number;
  id_tipo_cuota: number;
  cve_tipo_pago: number;
  total: string;
  estado: string;
};

type Aviso = {
  id_aviso: number;
  titulo: string;
  mensaje: string;
  a_todos: boolean;
  enviado_por: number;
  creado_en: string;
  nombre_emisor?: string | null;
};

type InicioResidenteResp = {
  nombre: string;
  reservas: Reserva[];
  pagos: Pago[];
};

type PersonaPerfilResp = {
  nombre: string;
  correo: string | null;
  numero_casa: number | null;
};

// ==== Helpers ====

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

function formatCurrency(totalStr: string) {
  const n = Number(totalStr);
  if (isNaN(n)) return `$${totalStr} MXN`;
  return n.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  });
}

function formatPagoFecha(fecha: string) {
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatReservaRango(fecha: string, inicio: string, fin: string) {
  const d = new Date(`${fecha}T${inicio}`);
  if (isNaN(d.getTime())) {
    return `${fecha} · ${inicio.slice(0, 5)} - ${fin.slice(0, 5)}`;
  }
  const dia = d.toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return `${dia} · ${inicio.slice(0, 5)} - ${fin.slice(0, 5)}`;
}

// ==== Página principal ====

export default function ResidentDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<StoredUser | null>(null);
  const [perfil, setPerfil] = useState<PersonaPerfilResp | null>(null);
  const [inicio, setInicio] = useState<InicioResidenteResp | null>(null);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // leer usuario
  useEffect(() => {
    const u = readStoredUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
  }, [router]);

  // cargar datos del residente
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [inicioRes, perfilRes, avisosRes] = await Promise.all([
          fetch(`${API_BASE}/inicio/residente/${user.id_persona}`),
          fetch(`${API_BASE}/persona/${user.id_persona}`),
          fetch(`${API_BASE}/avisos/persona/${user.id_persona}`),
        ]);

        if (!inicioRes.ok) throw new Error("Error cargando resumen del residente");
        if (!perfilRes.ok) throw new Error("Error cargando perfil del residente");
        if (!avisosRes.ok) throw new Error("Error cargando avisos del residente");

        const inicioJson = (await inicioRes.json()) as InicioResidenteResp;
        const perfilJson = (await perfilRes.json()) as PersonaPerfilResp;
        const avisosJson = (await avisosRes.json()) as Aviso[];

        setInicio(inicioJson);
        setPerfil(perfilJson);
        setAvisos(avisosJson);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Error cargando la información del residente");
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

  const displayName =
    inicio?.nombre ??
    perfil?.nombre ??
    user?.nombre_completo ??
    "Residente";

  const avatarLetter =
    displayName.trim().length > 0
      ? displayName.trim().charAt(0).toUpperCase()
      : "R";

  const pagos = inicio?.pagos ?? [];
  const reservas = inicio?.reservas ?? [];

  const pagosPendientes = pagos.filter(
    (p) => p.estado.toLowerCase() === "pendiente"
  );
  const totalPendiente = pagosPendientes.reduce((acc, p) => {
    const n = Number(p.total);
    return acc + (isNaN(n) ? 0 : n);
  }, 0);

  const pagoMasReciente = pagos[0];

  const reservasRecientes = reservas.slice(0, 2);
  const avisosRecientes = avisos.slice(0, 3);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-sm text-slate-500">Cargando tu información...</p>
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
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
              L
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Residente
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* botón avisos */}
            <button
              className="h-8 px-3 rounded-full bg-slate-100 border border-slate-200 text-xs flex items-center gap-1"
              onClick={() => router.push("/residente/avisos")}
            >
              🔔
              <span>Mis avisos</span>
            </button>

            {/* logout */}
            <button
              className="h-8 px-3 rounded-full bg-red-50 border border-red-200 text-[11px] font-semibold text-red-600 hover:bg-red-100"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>

            {/* avatar */}
            <div className="h-8 w-8 rounded-full bg-sky-500 text-white text-xs font-semibold flex items-center justify-center">
              {avatarLetter}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Bienvenida */}
        <section>
          <h1 className="text-2xl font-semibold">
            Bienvenido de vuelta, {displayName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aquí tienes un resumen de tu cuenta y tu comunidad.
          </p>
        </section>

        {/* Accesos rápidos */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickActionCard
              title="Registrar Visita"
              description="Permite el acceso a tus invitados"
              onClick={() => router.push("/residente/visitas")}
            />
            <QuickActionCard
              title="Reservar Área"
              description="Agenda el uso de espacios comunes"
              onClick={() => router.push("/residente/reservar-area")}
            />
            <QuickActionCard
              title="Ver Mis Pagos"
              description="Consulta tu historial y pagos pendientes"
              onClick={() => router.push("/residente/pagos")}
            />
            <QuickActionCard
              title="Ver Mis Reservas"
              description="Revisa todas tus reservas"
              onClick={() => router.push("/residente/reservas")}
            />
          </div>
        </section>

        {/* Estado de cuenta + Avisos */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado de cuenta */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Estado de Cuenta
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pago más reciente */}
                <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">
                    Pago más reciente
                  </p>
                  {pagoMasReciente ? (
                    <>
                      <p className="text-2xl font-semibold">
                        {formatCurrency(pagoMasReciente.total)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatPagoFecha(pagoMasReciente.fecha_transaccion)}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Estado: {pagoMasReciente.estado}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Aún no tienes pagos registrados.
                    </p>
                  )}
                  <button
                    className="mt-3 text-xs font-semibold text-sky-600"
                    onClick={() => router.push("/residente/pagos")}
                  >
                    Ver todos mis pagos
                  </button>
                </div>

                {/* Pagos pendientes */}
                <div className="bg-rose-50 rounded-2xl border border-rose-200 px-5 py-4 shadow-sm">
                  <p className="text-xs text-rose-600 font-semibold mb-1">
                    Pagos Pendientes
                  </p>
                  <p className="text-2xl font-semibold text-rose-700">
                    {formatCurrency(totalPendiente.toString())}
                  </p>
                  <p className="mt-2 text-xs text-rose-600">
                    {pagosPendientes.length > 0
                      ? `${pagosPendientes.length} pago(s) pendiente(s).`
                      : "No tienes pagos pendientes."}
                  </p>
                  {pagosPendientes.length > 0 && (
                    <button
                      className="mt-4 w-full rounded-xl bg-rose-600 text-white text-xs font-semibold py-2"
                      onClick={() => router.push("/residente/pagos")}
                    >
                      Ver pagos y pagar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reservas recientes */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Mis Reservas Recientes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reservasRecientes.length === 0 && (
                  <p className="text-xs text-slate-500">
                    Aún no tienes reservas registradas.
                  </p>
                )}
                {reservasRecientes.map((r) => (
                  <ReservationCard
                    key={r.no_reserva}
                    title={r.area_nombre}
                    date={formatReservaRango(
                      r.fecha_reserva,
                      r.hora_inicio,
                      r.hora_fin
                    )}
                    status={r.estado}
                  />
                ))}
              </div>
              <button
                className="mt-1 text-xs font-semibold text-sky-600"
                onClick={() => router.push("/residente/reservas")}
              >
                Ver todas mis reservas
              </button>
            </div>
          </div>

          {/* Columna derecha: Avisos */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Avisos Recientes
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm space-y-4">
              {avisosRecientes.length === 0 && (
                <p className="text-xs text-slate-500">
                  No tienes avisos nuevos por el momento.
                </p>
              )}
              {avisosRecientes.map((a) => (
                <AnnouncementItem
                  key={a.id_aviso}
                  title={a.titulo}
                  content={a.mensaje}
                  from={a.nombre_emisor ?? undefined}
                  createdAt={a.creado_en}
                />
              ))}
              <button
                className="mt-2 text-xs font-semibold text-sky-600"
                onClick={() => router.push("/residente/avisos")}
              >
                Ver todos mis avisos
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// ==== Componentes auxiliares ====

type QuickActionCardProps = {
  title: string;
  description: string;
  onClick?: () => void;
};

function QuickActionCard({ title, description, onClick }: QuickActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 px-5 py-4 text-left shadow-sm hover:border-sky-300 hover:shadow-md transition"
    >
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </button>
  );
}

type ReservationCardProps = {
  title: string;
  date: string;
  status: string;
};

function ReservationCard({ title, date, status }: ReservationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm flex flex-col justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{date}</p>
        <p className="text-[11px] text-slate-400 mt-1">Estado: {status}</p>
      </div>
      <button className="mt-3 text-xs font-semibold text-sky-600">
        Ver detalles
      </button>
    </div>
  );
}

type AnnouncementItemProps = {
  title: string;
  content: string;
  from?: string;
  createdAt: string;
};

function AnnouncementItem({
  title,
  content,
  from,
  createdAt,
}: AnnouncementItemProps) {
  const fecha = formatPagoFecha(createdAt);
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        {content}
      </p>
      <p className="text-[11px] text-slate-400 mt-1">
        {from && <>Por {from} · </>}
        {fecha}
      </p>
    </div>
  );
}
