import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Ajustes</h1>

      {/* Profile */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Perfil</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[#94a3b8]">Nombre</label>
            <p className="text-white">{profile?.full_name || 'Sin nombre'}</p>
          </div>
          <div>
            <label className="text-xs text-[#94a3b8]">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs text-[#94a3b8]">Proveedor</label>
            <p className="text-white capitalize">
              {user?.app_metadata?.provider || 'email'}
            </p>
          </div>
        </div>
      </div>

      {/* Account */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Cuenta</h2>

        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors border border-red-500/30"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  )
}
