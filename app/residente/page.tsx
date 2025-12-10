// app/residente/page.tsx
export default function ResidentDashboardPage() {
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

          <div className="flex items-center gap-4">
            <button className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs">
              🔔
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-300" />
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Bienvenida */}
        <section>
          <h1 className="text-2xl font-semibold">
            Bienvenido de vuelta, Juan Pérez
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
            />
            <QuickActionCard
              title="Reservar Área"
              description="Agenda el uso de espacios comunes"
            />
            <QuickActionCard
              title="Reportar Incidencia"
              description="Informa sobre problemas"
            />
            <QuickActionCard
              title="Mis Pagos"
              description="Consulta y realiza tus pagos"
            />
          </div>
        </section>

        {/* Estado de cuenta + Anuncios */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado de cuenta */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Estado de Cuenta
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">Próximo Pago</p>
                  <p className="text-2xl font-semibold">
                    $2,500.00 MXN
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Vencimiento: 31 de Agosto, 2024
                  </p>
                </div>

                <div className="bg-rose-50 rounded-2xl border border-rose-200 px-5 py-4 shadow-sm">
                  <p className="text-xs text-rose-600 font-semibold mb-1">
                    Pagos Pendientes
                  </p>
                  <p className="text-2xl font-semibold text-rose-700">
                    $1,250.00 MXN
                  </p>
                  <p className="mt-2 text-xs text-rose-600">
                    Cuota de Mantenimiento de Julio
                  </p>
                  <button className="mt-4 w-full rounded-xl bg-rose-600 text-white text-xs font-semibold py-2">
                    Pagar ahora
                  </button>
                </div>
              </div>
            </div>

            {/* Próximas reservas */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Mis Próximas Reservas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReservationCard
                  title="Salón de Usos Múltiples"
                  date="Hoy · 7:00 PM a 11:00 PM"
                />
                <ReservationCard
                  title="Cancha de Tenis"
                  date="Martes · 9:00 AM a 11:00 AM"
                />
              </div>
            </div>
          </div>

          {/* Columna derecha: Anuncios */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Anuncios Recientes
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm space-y-4">
              <AnnouncementItem
                title="Mantenimiento de Alberca"
                content="Se realizará el cierre temporal por mantenimiento del 20 al 25 de Agosto. Agradecemos tu comprensión."
              />
              <AnnouncementItem
                title="Evento de Verano"
                content="Te invitamos al evento familiar de verano que se llevará a cabo en el jardín principal este sábado."
              />
              <AnnouncementItem
                title="Asamblea General Ordinaria"
                content="Se convoca a todos los residentes a la asamblea general el próximo 5 de Septiembre."
              />
              <button className="mt-2 text-xs font-semibold text-sky-600">
                Ver todos los anuncios
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* Componentes auxiliares */

type QuickActionCardProps = {
  title: string;
  description: string;
};

function QuickActionCard({ title, description }: QuickActionCardProps) {
  return (
    <button className="bg-white rounded-2xl border border-slate-200 px-5 py-4 text-left shadow-sm hover:border-sky-300 hover:shadow-md transition">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </button>
  );
}

type ReservationCardProps = {
  title: string;
  date: string;
};

function ReservationCard({ title, date }: ReservationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm flex flex-col justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{date}</p>
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
};

function AnnouncementItem({ title, content }: AnnouncementItemProps) {
  return (
    <div className="border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
        {content}
      </p>
    </div>
  );
}
