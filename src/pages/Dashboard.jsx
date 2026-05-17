import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts'
import { useTransactions } from '../hooks/useTransactions'
import { calculateKPIs, getExpensesByCategory, getMonthlyData, getProfitOverTime } from '../utils/kpi'
import KPICard from '../components/KPICard'
import PeriodFilter from '../components/PeriodFilter'
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
  const { transactions, loading } = useTransactions()
  const [dateRange, setDateRange] = useState(defaultDateRange)

  const kpis = useMemo(
    () => calculateKPIs(transactions, dateRange),
    [transactions, dateRange]
  )

  const categoryData = useMemo(
    () => getExpensesByCategory(transactions, dateRange),
    [transactions, dateRange]
  )

  const monthlyData = useMemo(() => getMonthlyData(transactions), [transactions])
  const profitData = useMemo(() => getProfitOverTime(transactions), [transactions])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard title="Ingresos" value={kpis.totalIncome} color="text-green-400" />
        <KPICard title="Gastos" value={kpis.totalExpenses} color="text-red-400" />
        <KPICard
          title="Ganancia / Pérdida"
          value={kpis.profit}
          color={kpis.profit >= 0 ? 'text-green-400' : 'text-red-400'}
        />
        <KPICard title="Total viajes" value={kpis.totalTrips} color="text-[#c084fc]" decimals={0} />
        <KPICard title="Promedio/viaje" value={kpis.avgPerTrip} color="text-[#c084fc]" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Monthly income vs expenses */}
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

        {/* Expense by category */}
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

        {/* Profit over time */}
        <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4 md:col-span-2">
          <h3 className="text-sm font-medium text-[#94a3b8] mb-4">Evolución de ganancia</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={profitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2350" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1432', border: '1px solid #2d2350', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
