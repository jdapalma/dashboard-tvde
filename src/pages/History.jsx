import { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionTable from '../components/TransactionTable'
import EditTransactionModal from '../components/EditTransactionModal'
import PeriodFilter from '../components/PeriodFilter'
import Skeleton from '../components/Skeleton'

function defaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return { start, end, preset: 'month' }
}

export default function History() {
  const { transactions, loading, deleteTransaction, updateTransaction } = useTransactions()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [editingTransaction, setEditingTransaction] = useState(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date)
      if (d < dateRange.start || d > dateRange.end) return false
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (platformFilter !== 'all' && t.platform !== platformFilter) return false
      if (search && !t.description?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [transactions, search, typeFilter, platformFilter, dateRange])

  const summary = useMemo(() => {
    const income = filtered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = filtered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    return { income, expenses, balance: income - expenses }
  }, [filtered])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Historial</h1>

      {/* Period filter */}
      <PeriodFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* Other filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7] text-sm"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
        >
          <option value="all">Todos los tipos</option>
          <option value="income">Ingresos</option>
          <option value="expense">Gastos</option>
        </select>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
        >
          <option value="all">Todas las plataformas</option>
          <option value="uber">Uber</option>
          <option value="bolt">Bolt</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl overflow-hidden">
        <TransactionTable
          transactions={filtered}
          onDelete={deleteTransaction}
          onEdit={setEditingTransaction}
        />
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex flex-wrap justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[#94a3b8]">Ingresos:</span>
              <span className="font-medium text-green-400">
                +{summary.income.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#94a3b8]">Gastos:</span>
              <span className="font-medium text-red-400">
                -{summary.expenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#94a3b8]">Saldo:</span>
              <span className={`font-medium ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.balance >= 0 ? '+' : ''}{summary.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>
      )}

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onSave={updateTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  )
}
