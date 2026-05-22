import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/register', label: 'Registrar', icon: '➕' },
  { to: '/financing', label: 'Financiados', icon: '💳' },
  { to: '/settings', label: 'Ajustes', icon: '⚙️' },
]

export default function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex bg-[#0f0b1e]">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1a1432] border-r border-[#2d2350] p-4 fixed h-full">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">Dashboard TVDE</h1>
          <p className="text-xs text-[#94a3b8]">Gestión de ingresos y gastos</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[#a855f7]/20 text-[#c084fc]'
                    : 'text-[#94a3b8] hover:bg-[#231c3d] hover:text-white'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#94a3b8] hover:bg-[#231c3d] hover:text-white transition-colors mt-auto"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 p-4 pb-24 md:pb-4">
        <Outlet />
      </main>

      {/* Bottom nav - mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1432] border-t border-[#2d2350] flex justify-around py-2 px-4 z-50">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'text-[#c084fc]'
                  : 'text-[#94a3b8]'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
