import { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import Skeleton from '../components/Skeleton'
import { CreditCard, CheckCircle2, Clock } from 'lucide-react'

export default function Financing() {
  const { transactions, loading, updateTransaction } = useTransactions()
  const { instruments } = useInstruments()
  const [filter, setFilter] = useState('pending') // 'all' | 'pending' | 'paid'
  const [selected, setSelected] = useState(new Set())
  const [marking, setMarking] = useState(false)

  const financed = useMemo(() => {
    return transactions.filter((t) => t.is_financed)
  }, [transactions])

  const filtered = useMemo(() => {
    if (filter === 'pending') return financed.filter((t) => !t.is_paid)
    if (filter === 'paid') return financed.filter((t) => t.is_paid)
    return financed
  }, [financed, filter])

  const totalPending = useMemo(() => {
    return financed.filter((t) => !t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0)
  }, [financed])

  const totalPaid = useMemo(() => {
    return financed.filter((t) => t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0)
  }, [financed])

  const selectedTotal = useMemo(() => {
    return filtered
      .filter((t) => selected.has(t.id) && !t.is_paid)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  }, [filtered, selected])

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    const unpaidIds = filtered.filter((t) => !t.is_paid).map((t) => t.id)
    if (unpaidIds.every((id) => selected.has(id))) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unpaidIds))
    }
  }

  async function markSelectedAsPaid() {
    setMarking(true)
    try {
      const promises = Array.from(selected)
        .filter((id) => filtered.find((t) => t.id === id && !t.is_paid))
        .map((id) => updateTransaction(id, { is_paid: true }))
      await Promise.all(promises)
      setSelected(new Set())
    } catch (err) {
      console.error(err)
    } finally {
      setMarking(false)
    }
  }

  function getInstrumentName(transaction) {
    return transaction.financing_instruments?.name || '—'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Financiados</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-[#94a3b8]">Total financiado</p>
          </div>
          <p className="text-xl font-bold text-amber-400">
            {financed.reduce((s, t) => s + Number(t.amount), 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-red-400" />
            <p className="text-xs text-[#94a3b8]">Por pagar</p>
          </div>
          <p className="text-xl font-bold text-red-400">
            {totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </p>
        </div>
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <p className="text-xs text-[#94a3b8]">Pagado</p>
          </div>
          <p className="text-xl font-bold text-green-400">
            {totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'pending', label: 'Por pagar' },
          { key: 'paid', label: 'Pagados' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => { setFilter(f.key); setSelected(new Set()) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-[#a855f7] text-white'
                : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-[#a855f7]/10 border border-[#a855f7]/30 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-[#c084fc]">
            {selected.size} seleccionados — {selectedTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </span>
          <button
            onClick={markSelectedAsPaid}
            disabled={marking}
            className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm font-medium hover:bg-green-500/30 disabled:opacity-50 transition-colors"
          >
            {marking ? 'Marcando...' : 'Marcar como pagado'}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#94a3b8]">
            <p className="text-lg">No hay gastos financiados</p>
            <p className="text-sm mt-1">Registra un gasto marcado como financiado para verlo aquí</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2d2350]">
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={filtered.filter((t) => !t.is_paid).length > 0 && filtered.filter((t) => !t.is_paid).every((t) => selected.has(t.id))}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Fecha</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Categoría</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Instrumento</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Monto</th>
                  <th className="text-center py-3 px-4 text-[#94a3b8] font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-b border-[#2d2350]/50 hover:bg-[#231c3d]/50">
                    <td className="py-3 px-4">
                      {!t.is_paid && (
                        <input
                          type="checkbox"
                          checked={selected.has(t.id)}
                          onChange={() => toggleSelect(t.id)}
                          className="w-4 h-4 rounded border-[#3b2d5e] bg-[#231c3d] text-[#a855f7] focus:ring-[#a855f7]"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {new Date(t.date).toLocaleDateString('es-ES')}
                    </td>
                    <td className="py-3 px-4 text-[#c084fc]">{t.category}</td>
                    <td className="py-3 px-4 text-white">{getInstrumentName(t)}</td>
                    <td className="py-3 px-4 text-right font-medium text-red-400">
                      -{Number(t.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        t.is_paid
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.is_paid ? 'Pagado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
