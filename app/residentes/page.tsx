// app/residentes/page.tsx

const residents = [
  {
    id: 1,
    name: "Ana García Pérez",
    property: "Privada del Roble #123",
    contact: "55 1234 5678",
    status: "Activo",
  },
  {
    id: 2,
    name: "Carlos Martínez",
    property: "Paseo de las Flores #45",
    contact: "55 8765 4321",
    status: "Activo",
  },
  {
    id: 3,
    name: "Laura Rodríguez",
    property: "Avenida Central #789",
    contact: "55 5555 5555",
    status: "Moroso",
  },
  {
    id: 4,
    name: "Javier Gómez",
    property: "Calle del Sol #24",
    contact: "55 2468 1357",
    status: "Inactivo",
  },
];

function statusClasses(status: string) {
  switch (status) {
    case "Activo":
      return "bg-blue-50 text-blue-700";
    case "Moroso":
      return "bg-red-50 text-red-600";
    case "Inactivo":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function ResidentsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      {/* Header superior */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo cuadrado azul */}
          <div className="h-7 w-7 rounded-md bg-blue-600" />
          <h1 className="text-xl font-semibold text-slate-900">
            Panel de Gestión de Residentes
          </h1>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-colors">
          <span className="text-lg">+</span>
          Añadir Residente
        </button>
      </header>

      {/* Tarjeta / contenedor principal */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Fila superior: buscador + filtros */}
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
          {/* Buscador */}
          <div className="relative w-full md:max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre, casa, etc..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtros (solo visuales) */}
          <div className="flex flex-wrap justify-end gap-2">
            <button className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Todos
            </button>
            <button className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
              Activos
            </button>
            <button className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
              Inactivos
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase text-slate-400">
                <th className="px-6 py-3 text-left">Residente</th>
                <th className="px-6 py-3 text-left">Propiedad</th>
                <th className="px-6 py-3 text-left">Contacto</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {residents.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  {/* Residente: avatar + nombre */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                        {r.name
                          .split(" ")
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join("")}
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {r.name}
                      </span>
                    </div>
                  </td>

                  {/* Propiedad */}
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {r.property}
                  </td>

                  {/* Contacto */}
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {r.contact}
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses(
                        r.status
                      )}`}
                    >
                      {r.status}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-slate-400">
                      <button
                        type="button"
                        className="hover:text-slate-700"
                        aria-label="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="hover:text-slate-700"
                        aria-label="Ver"
                      >
                        👁️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
