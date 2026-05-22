import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Car, BarChart3, CreditCard, AlertTriangle, CheckCircle, Trophy, Calendar } from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import {
  calculateKPIs, getExpensesByCategory, getMonthlyData, getUnpaidFinanced,
  getTopMonthsByIncome, getTopMonthsByProfit, getTopWeeks,
} from '../utils/kpi'
import KPICard from '../components/KPICard'
import PeriodFilter from '../components/PeriodFilter'
import TransactionTable from '../components/TransactionTable'
import EditTransactionModal from '../components/EditTransactionModal'
import Skeleton from '../components/Skeleton'

const COLORS = ['#a855f7', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

function defaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return { start, end, preset: 'month' }
}

export default function Dashboard() {
  const { transactions, loading, deleteTransaction, updateTransaction } = useTransactions()
  const [dateRange, setDateRange] = useState(defaultDateRange)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [editingTransaction, setEditingTransaction] = useState(null)

  const kpis = useMemo(
    () => calculateKPIs(transactions, dateRange),
    [transactions, dateRange]
  )

  const unpaidFinanced = useMemo(
    () => getUnpaidFinanced(transactions, dateRange),
    [transactions, dateRange]
  )

  const categoryData = useMemo(
    () => getExpensesByCategory(transactions, dateRange),
    [transactions, dateRange]
  )

  const monthlyData = useMemo(() => getMonthlyData(transactions), [transactions])
  const topIncome = useMemo(() => getTopMonthsByIncome(transactions), [transactions])
  const topProfit = useMemo(() => getTopMonthsByProfit(transactions), [transactions])
  const topWeeks = useMemo(() => getTopWeeks(transactions), [transactions])

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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <PeriodFilter dateRange={dateRange} onDateRangeChange={setDateRange} />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KPICard title="Ingresos" value={kpis.totalIncome} color="text-green-400" icon={TrendingUp} />
        <KPICard title="Gastos" value={kpis.totalExpenses} color="text-red-400" icon={TrendingDown} />
        <KPICard
          title="Ganancia / Pérdida"
          value={kpis.profit}
          color={kpis.profit >= 0 ? 'text-green-400' : 'text-red-400'}
          icon={DollarSign}
        />
        <KPICard
          title="Gasto / Ingreso"
          value={kpis.expenseRatio}
          color={kpis.expenseRatio > 40 ? 'text-red-400' : 'text-green-400'}
          decimals={1}
          suffix="%"
          icon={kpis.expenseRatio > 40 ? AlertTriangle : CheckCircle}
        />
        <KPICard title="Total viajes" value={kpis.totalTrips} color="text-[#c084fc]" decimals={0} icon={Car} />
        <KPICard title="Promedio/viaje" value={kpis.avgPerTrip} color="text-[#c084fc]" icon={BarChart3} />
        <KPICard title="Financiado por pagar" value={unpaidFinanced} color="text-amber-400" icon={CreditCard} />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">Ingresos vs Gastos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2350" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1432', border: '1px solid #2d2350', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="income" name="Ingresos" fill="#a855f7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Gastos" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">Gastos por categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1432', border: '1px solid #2d2350', borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction filters */}
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

      {/* Transaction table */}
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <TransactionTable
            transactions={filtered}
            onDelete={deleteTransaction}
            onEdit={setEditingTransaction}
          />
        </div>
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

      {/* Rankings */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-green-400" />
            <h3 className="text-sm font-medium text-[#94a3b8]">Top 5 meses en ingresos</h3>
          </div>
          {topIncome.length === 0 ? (
            <p className="text-xs text-[#4a4458] text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {topIncome.map((item, i) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-[#4a4458]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs text-white">{item.label}</span>
                  </div>
                  <span className="text-xs font-medium text-green-400">
                    {item.income.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-[#a855f7]" />
            <h3 className="text-sm font-medium text-[#94a3b8]">Top 5 meses en ganancia</h3>
          </div>
          {topProfit.length === 0 ? (
            <p className="text-xs text-[#4a4458] text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {topProfit.map((item, i) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-[#4a4458]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs text-white">{item.label}</span>
                  </div>
                  <span className={`text-xs font-medium ${item.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {item.profit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-[#c084fc]" />
            <h3 className="text-sm font-medium text-[#94a3b8]">Top 5 semanas</h3>
          </div>
          {topWeeks.length === 0 ? (
            <p className="text-xs text-[#4a4458] text-center py-4">Sin datos</p>
          ) : (
            <div className="space-y-2">
              {topWeeks.map((item, i) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-[#4a4458]'}`}>
                      {i + 1}
                    </span>
                    <span className="text-xs text-white">{item.label}</span>
                  </div>
                  <span className="text-xs font-medium text-[#c084fc]">
                    {item.income.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
