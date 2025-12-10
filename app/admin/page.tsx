// app/page.tsx
export default function DashboardPage() {
  return (
    <main className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Perfil */}
        <div className="px-6 pt-6 pb-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-semibold">
            A
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Admin</span>
            <span className="text-xs text-slate-500">Fraccionamiento</span>
            <span className="text-[11px] text-slate-400">admin@frac.com</span>
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
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50">
            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold">
              R
            </span>
            <span>Residentes</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50">
            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold">
              $
            </span>
            <span>Finanzas</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50">
            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold">
              M
            </span>
            <span>Mantenimiento</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50">
            <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold">
              R
            </span>
            <span>Reportes</span>
          </button>
        </nav>

        {/* Botón acción rápida */}
        <div className="mt-auto px-4 pb-4 pt-6">
          <button className="w-full rounded-xl bg-sky-500 text-white text-sm font-medium py-2.5">
            Acción Rápida
          </button>
        </div>

        {/* Config / ayuda */}
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
        </div>
      </aside>

      {/* Contenido principal */}
      <section className="flex-1 px-10 py-8">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-semibold">
            Bienvenido, Administrador
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Aquí tienes un resumen del estado del fraccionamiento.
          </p>
        </header>

        {/* Tarjetas resumen */}
        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total de Residentes"
            value="452"
            subtitle="+12 este mes"
            subtitleClass="text-emerald-600"
          />
          <SummaryCard
            title="Ingresos del Mes"
            value="$150,000"
            subtitle="+5.2% vs mes anterior"
            subtitleClass="text-emerald-600"
          />
          <SummaryCard
            title="Gastos del Mes"
            value="$85,000"
            subtitle="-1.8% vs mes anterior"
            subtitleClass="text-rose-600"
          />
          <SummaryCard
            title="Saldo Actual"
            value="$65,000"
            subtitle="Balance positivo"
            subtitleClass="text-slate-500"
          />
        </section>

        {/* Accesos y alertas */}
        <section className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Accesos directos */}
          <div>
            <h2 className="text-base font-semibold mb-4">Accesos Directos</h2>
            <div className="space-y-4">
              <QuickActionCard
                title="Gestionar Residentes"
                description="Añadir, editar o eliminar residentes"
              />
              <QuickActionCard
                title="Registrar Pagos"
                description="Registrar nuevas cuotas y pagos"
              />
              <QuickActionCard
                title="Reservar Áreas Comunes"
                description="Gestionar calendario de reservas"
              />
            </div>
          </div>

          {/* Alertas */}
          <div>
            <h2 className="text-base font-semibold mb-4">
              Alertas Importantes
            </h2>
            <div className="space-y-4">
              <AlertCard
                variant="yellow"
                title="Pagos Vencidos"
                description="Hay 8 residentes con pagos vencidos. Total adeudado: $12,500."
                actionText="Ver Detalles"
              />
              <AlertCard
                variant="orange"
                title="Solicitudes de Mantenimiento Pendientes"
                description="Tienes 3 nuevas solicitudes de mantenimiento sin asignar."
                actionText="Revisar Solicitudes"
              />
              <AlertCard
                variant="blue"
                title="Próximas Reservas de Áreas Comunes"
                description='La "Casa Club" está reservada para mañana a las 3:00 PM.'
                actionText="Ver Calendario"
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

/* Componentes auxiliares */

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

type QuickActionCardProps = {
  title: string;
  description: string;
};

function QuickActionCard({ title, description }: QuickActionCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 flex gap-3 items-start shadow-sm">
      <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-600 text-sm font-semibold">
        +
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

type AlertVariant = "yellow" | "orange" | "blue";

type AlertCardProps = {
  variant: AlertVariant;
  title: string;
  description: string;
  actionText: string;
};

function AlertCard({
  variant,
  title,
  description,
  actionText,
}: AlertCardProps) {
  const styles: Record<AlertVariant, string> = {
    yellow:
      "bg-amber-50 border-amber-200 text-amber-900",
    orange:
      "bg-orange-50 border-orange-200 text-orange-900",
    blue:
      "bg-blue-50 border-blue-200 text-blue-900",
  };

  return (
    <div
      className={`rounded-2xl border px-5 py-4 shadow-sm ${styles[variant]}`}
    >
      <p className="text-sm font-semibold mb-1">{title}</p>
      <p className="text-xs mb-2">{description}</p>
      <button className="text-xs font-semibold underline">
        {actionText}
      </button>
    </div>
  );
}
