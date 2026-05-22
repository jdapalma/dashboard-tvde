import { useState, useMemo } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionTable from '../components/TransactionTable'
import EditTransactionModal from '../components/EditTransactionModal'
import Skeleton from '../components/Skeleton'

export default function History() {
  const { transactions, loading, deleteTransaction, updateTransaction } = useTransactions()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [editingTransaction, setEditingTransaction] = useState(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (platformFilter !== 'all' && t.platform !== platformFilter) return false
      if (search && !t.description?.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [transactions, search, typeFilter, platformFilter])

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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white placeholder-[#94a3b8] focus:outline-none focus:border-[#a855f7] text-sm"
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
