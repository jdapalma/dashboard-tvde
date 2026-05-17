import { useState } from 'react'
import { PLATFORMS, EXPENSE_CATEGORIES, INCOME_CATEGORIES, DEFAULT_PLATFORM } from '../lib/constants'

export default function TransactionForm({ onSubmit, initialData = {} }) {
  const [type, setType] = useState(initialData.type || 'income')
  const [amount, setAmount] = useState(initialData.amount || '')
  const [platform, setPlatform] = useState(initialData.platform || DEFAULT_PLATFORM)
  const [category, setCategory] = useState(initialData.category || '')
  const [date, setDate] = useState(initialData.date || new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState(initialData.description || '')
  const [tripsCount, setTripsCount] = useState(initialData.trips_count || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit({
        type,
        amount: parseFloat(amount),
        platform,
        category,
        date,
        description: description || null,
        trips_count: tripsCount ? parseInt(tripsCount) : null,
        source: initialData.source || 'manual',
        receipt_url: initialData.receipt_url || null,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Type toggle */}
      <div className="flex gap-2">
        {['income', 'expense'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setType(t); setCategory('') }}
            className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
              type === t
                ? t === 'income'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-[#231c3d] text-[#94a3b8] border border-[#3b2d5e]'
            }`}
          >
            {t === 'income' ? 'Ingreso' : 'Gasto'}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Monto</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
          required
        />
      </div>

      {/* Platform */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Plataforma</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
        >
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
          required
        >
          <option value="">Seleccionar...</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Fecha</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
          required
        />
      </div>

      {/* Trips - only for income */}
      {type === 'income' && (
        <div>
          <label className="block text-sm text-[#94a3b8] mb-1">Viajes (opcional)</label>
          <input
            type="number"
            min="0"
            value={tripsCount}
            onChange={(e) => setTripsCount(e.target.value)}
            placeholder="Cantidad de viajes"
            className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-sm text-[#94a3b8] mb-1">Descripción (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Notas adicionales..."
          className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? 'Guardando...' : 'Registrar'}
      </button>
    </form>
  )
}
