// app/dashboard/page.tsx
export default function BoardDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Barra superior */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-sky-500 flex items-center justify-center text-xs font-bold text-white">
              M
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Mesa Directiva
              <span className="text-sky-500 ml-1">Dashboard</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <a className="font-medium text-sky-600" href="#">
              Dashboard
            </a>
            <a href="#">Residentes</a>
            <a href="#">Finanzas</a>
            <a href="#">Reportes</a>
          </nav>

          <div className="flex items-center gap-4">
            <button className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs">
              N
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-300" />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <h1 className="text-3xl font-semibold">Dashboard</h1>

        {/* Tarjetas superiores */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Ingresos (del mes)"
            value="$50,000"
            change="+5.2%"
            changeType="positive"
          />
          <StatCard
            title="Gastos (del mes)"
            value="$15,000"
            change="-2.1%"
            changeType="negative"
          />
          <StatCard
            title="Saldo Actual"
            value="$125,000"
            change="+1.8%"
            changeType="positive"
          />
        </section>

        {/* Gráfico + acciones rápidas */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">
              Ingresos vs Gastos (Últimos 6 meses)
            </p>
            <p className="mt-2 text-2xl font-semibold">$35,000</p>
            <p className="text-xs text-slate-500 mt-1">
              Balance Junio 2024{" "}
              <span className="text-emerald-600 font-medium ml-1">+3%</span>
            </p>

            {/* Grafico de barras simple */}
            <div className="mt-6 flex items-end gap-6 h-40">
              <MonthBars month="Ene" incomeHeight="70%" expenseHeight="40%" />
              <MonthBars month="Feb" incomeHeight="65%" expenseHeight="35%" />
              <MonthBars month="Mar" incomeHeight="50%" expenseHeight="30%" />
              <MonthBars month="Abr" incomeHeight="80%" expenseHeight="45%" />
              <MonthBars month="May" incomeHeight="75%" expenseHeight="25%" />
              <MonthBars month="Jun" incomeHeight="95%" expenseHeight="55%" />
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-800">
              Acciones Rápidas
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm space-y-3">
              <button className="w-full rounded-xl bg-sky-500 text-white text-sm font-semibold py-2.5 text-left px-4">
                Crear Votación
              </button>
              <button className="w-full rounded-xl bg-slate-50 text-slate-700 text-sm py-2.5 text-left px-4 border border-slate-100">
                Enviar Comunicado
              </button>
              <button className="w-full rounded-xl bg-slate-50 text-slate-700 text-sm py-2.5 text-left px-4 border border-slate-100">
                Registrar Gasto
              </button>
            </div>
          </div>
        </section>

        {/* Áreas comunes + comunicados */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Estado de áreas comunes */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              Estado de Áreas Comunes
            </h2>

            <div className="space-y-3 text-sm">
              <AreaStatusItem
                name="Alberca"
                status="Disponible"
                statusColor="green"
              />
              <AreaStatusItem
                name="Gimnasio"
                status="En Mantenimiento"
                statusColor="yellow"
              />
              <AreaStatusItem
                name="Salón de Eventos"
                status="Reservado"
                statusColor="red"
              />
            </div>

            <button className="mt-5 w-full rounded-xl border border-sky-300 text-sky-600 text-sm font-semibold py-2">
              Gestionar Reservaciones
            </button>
          </div>

          {/* Comunicados */}
          <div className="bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">
              Comunicados Importantes
            </h2>

            <div className="space-y-4 text-sm">
              <AnnouncementItem
                title="Recordatorio de Pago de Mantenimiento - Junio 2024"
                date="Publicado: 15 Junio, 2024"
              />
              <AnnouncementItem
                title="Cierre de Alberca por Mantenimiento Profundo"
                date="Publicado: 12 Junio, 2024"
              />
              <AnnouncementItem
                title="Nuevas Reglas para Uso del Gimnasio"
                date="Publicado: 05 Junio, 2024"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* Componentes auxiliares */

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative";
};

function StatCard({ title, value, change, changeType }: StatCardProps) {
  const changeColor =
    changeType === "positive" ? "text-emerald-600" : "text-rose-600";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
      <p className="text-xs text-slate-500 mb-1">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className={`text-xs mt-2 ${changeColor}`}>{change}</p>
    </div>
  );
}

type MonthBarsProps = {
  month: string;
  incomeHeight: string;
  expenseHeight: string;
};

function MonthBars({ month, incomeHeight, expenseHeight }: MonthBarsProps) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="flex items-end gap-1 w-full justify-center">
        <div
          className="w-5 bg-sky-400 rounded-t-lg"
          style={{ height: incomeHeight }}
        />
        <div
          className="w-5 bg-rose-300 rounded-t-lg"
          style={{ height: expenseHeight }}
        />
      </div>
      <p className="text-xs text-slate-500 mt-1">{month}</p>
    </div>
  );
}

type AreaStatusItemProps = {
  name: string;
  status: string;
  statusColor: "green" | "yellow" | "red";
};

function AreaStatusItem({ name, status, statusColor }: AreaStatusItemProps) {
  const badgeClasses: Record<AreaStatusItemProps["statusColor"], string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold">
          AC
        </div>
        <span className="text-sm text-slate-800">{name}</span>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-[11px] border ${badgeClasses[statusColor]}`}
      >
        {status}
      </span>
    </div>
  );
}

type AnnouncementItemProps = {
  title: string;
  date: string;
};

function AnnouncementItem({ title, date }: AnnouncementItemProps) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{date}</p>
    </div>
  );
}
