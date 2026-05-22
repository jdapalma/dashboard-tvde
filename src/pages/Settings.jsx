import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useCategories } from '../hooks/useCategories'
import { useInstruments } from '../hooks/useInstruments'
import { Plus, Trash2 } from 'lucide-react'

export default function Settings() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const {
    incomeCategories, expenseCategories,
    addCategory, deleteCategory,
  } = useCategories()
  const { instruments, addInstrument, deleteInstrument } = useInstruments()

  const [newIncomeCat, setNewIncomeCat] = useState('')
  const [newExpenseCat, setNewExpenseCat] = useState('')
  const [newInstrument, setNewInstrument] = useState('')
  const [error, setError] = useState('')

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleAddCategory(name, type) {
    if (!name.trim()) return
    setError('')
    try {
      await addCategory(name.trim(), type)
      if (type === 'income') setNewIncomeCat('')
      else setNewExpenseCat('')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleAddInstrument() {
    if (!newInstrument.trim()) return
    setError('')
    try {
      await addInstrument(newInstrument.trim())
      setNewInstrument('')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Ajustes</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

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

      {/* Expense Categories */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Categorías de gastos</h2>
        <div className="space-y-2">
          {expenseCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-[#231c3d] rounded-lg">
              <span className="text-white text-sm">{cat.name}</span>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-[#94a3b8] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newExpenseCat}
            onChange={(e) => setNewExpenseCat(e.target.value)}
            placeholder="Nueva categoría..."
            className="flex-1 px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(newExpenseCat, 'expense')}
          />
          <button
            onClick={() => handleAddCategory(newExpenseCat, 'expense')}
            className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Income Categories */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Categorías de ingresos</h2>
        <div className="space-y-2">
          {incomeCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-2 px-3 bg-[#231c3d] rounded-lg">
              <span className="text-white text-sm">{cat.name}</span>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-[#94a3b8] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newIncomeCat}
            onChange={(e) => setNewIncomeCat(e.target.value)}
            placeholder="Nueva categoría..."
            className="flex-1 px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(newIncomeCat, 'income')}
          />
          <button
            onClick={() => handleAddCategory(newIncomeCat, 'income')}
            className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Financing Instruments */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Instrumentos de financiamiento</h2>
        <div className="space-y-2">
          {instruments.length === 0 ? (
            <p className="text-sm text-[#4a4458]">No hay instrumentos. Agrega uno para empezar.</p>
          ) : (
            instruments.map((inst) => (
              <div key={inst.id} className="flex items-center justify-between py-2 px-3 bg-[#231c3d] rounded-lg">
                <span className="text-white text-sm">{inst.name}</span>
                <button
                  onClick={() => deleteInstrument(inst.id)}
                  className="text-[#94a3b8] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newInstrument}
            onChange={(e) => setNewInstrument(e.target.value)}
            placeholder="Ej: ONEY, WIZINK..."
            className="flex-1 px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAddInstrument()}
          />
          <button
            onClick={handleAddInstrument}
            className="px-4 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Cuenta</h2>
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors border border-red-500/30"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
