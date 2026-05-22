import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useInstruments } from '../hooks/useInstruments'

export default function EditTransactionModal({ transaction, onSave, onClose }) {
  const [isFinanced, setIsFinanced] = useState(transaction.is_financed || false)
  const [isPaid, setIsPaid] = useState(transaction.is_paid ?? true)
  const [instrumentId, setInstrumentId] = useState(transaction.financing_instrument_id || '')
  const [loading, setLoading] = useState(false)
  const { instruments } = useInstruments()

  useEffect(() => {
    if (!isFinanced) {
      setIsPaid(true)
      setInstrumentId('')
    } else {
      setIsPaid(transaction.is_paid ?? false)
    }
  }, [isFinanced])

  async function handleSave() {
    setLoading(true)
    try {
      await onSave(transaction.id, {
        is_financed: isFinanced,
        is_paid: isPaid,
        financing_instrument_id: isFinanced && instrumentId ? instrumentId : null,
      })
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (transaction.type === 'income') {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Editar transacción</h2>
            <button onClick={onClose} className="text-[#94a3b8] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-[#94a3b8]">Los ingresos no se financian. No hay campos editables.</p>
          <button onClick={onClose} className="mt-4 w-full py-2 bg-[#3b2d5e] text-white rounded-lg">Cerrar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Editar financiamiento</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-[#231c3d] rounded-lg p-3 text-sm">
            <p className="text-[#94a3b8]">
              {new Date(transaction.date).toLocaleDateString('es-ES')} — {transaction.category}
            </p>
            <p className="text-white font-medium">
              {Number(transaction.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
            </p>
          </div>

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
