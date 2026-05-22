import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useInstruments } from '../hooks/useInstruments'
import { PLATFORMS, DEFAULT_PLATFORM } from '../lib/constants'

export default function EditTransactionModal({ transaction, onSave, onClose }) {
  const [amount, setAmount] = useState(transaction.amount || '')
  const [category, setCategory] = useState(transaction.category || '')
  const [date, setDate] = useState(transaction.date || '')
  const [description, setDescription] = useState(transaction.description || '')
  const [platform, setPlatform] = useState(transaction.platform || DEFAULT_PLATFORM)
  const [tripsCount, setTripsCount] = useState(transaction.trips_count || '')
  const [isFinanced, setIsFinanced] = useState(transaction.is_financed || false)
  const [isPaid, setIsPaid] = useState(transaction.is_paid ?? true)
  const [instrumentId, setInstrumentId] = useState(transaction.financing_instrument_id || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { expenseCategories, incomeCategories } = useCategories()
  const { instruments } = useInstruments()

  const categories = transaction.type === 'income' ? incomeCategories : expenseCategories

  useEffect(() => {
    if (!isFinanced) {
      setIsPaid(true)
      setInstrumentId('')
    } else {
      setIsPaid(transaction.is_paid ?? false)
    }
  }, [isFinanced])

  async function handleSave() {
    setError('')
    setLoading(true)
    try {
      const updates = {
        amount: parseFloat(amount),
        category,
        date,
        description: description || null,
      }

      if (transaction.type === 'income') {
        updates.platform = platform
        updates.trips_count = tripsCount ? parseInt(tripsCount) : null
      } else {
        updates.is_financed = isFinanced
        updates.is_paid = isPaid
        updates.financing_instrument_id = isFinanced && instrumentId ? instrumentId : null
      }

      await onSave(transaction.id, updates)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Editar {transaction.type === 'income' ? 'ingreso' : 'gasto'}
          </h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm text-[#94a3b8] mb-1">Monto</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
              required
            />
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
                <option key={c.id} value={c.name}>{c.name}</option>
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

          {/* Platform - only for income */}
          {transaction.type === 'income' && (
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
          )}

          {/* Trips - only for income */}
          {transaction.type === 'income' && (
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

          {/* Financing - only for expenses */}
          {transaction.type === 'expense' && (
            <>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFinanced}
                  onChange={(e) => setIsFinanced(e.target.checked)}
                  className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
                />
                <span className="text-sm text-[#94a3b8]">Es financiado</span>
              </label>

              {isFinanced && (
                <div>
                  <label className="block text-sm text-[#94a3b8] mb-1">Instrumento</label>
                  <select
                    value={instrumentId}
                    onChange={(e) => setInstrumentId(e.target.value)}
                    className="w-full px-4 py-3 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white focus:outline-none focus:border-[#a855f7]"
                  >
                    <option value="">Seleccionar...</option>
                    {instruments.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {isFinanced && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={(e) => setIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
                  />
                  <span className="text-sm text-[#94a3b8]">Pagado</span>
                </label>
              )}
            </>
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
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-[#3b2d5e] text-white rounded-lg hover:bg-[#4a3d6e] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
