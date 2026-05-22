import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Car, BarChart3, Trophy, Calendar, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react'
import { useTransactions } from '../hooks/useTransactions'
import {
  calculateKPIs, getExpensesByCategory, getMonthlyData, getProfitOverTime,
  getTopMonthsByIncome, getTopMonthsByProfit, getTopWeeks, getUnpaidFinanced,
} from '../utils/kpi'
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

  const unpaidFinanced = useMemo(
    () => getUnpaidFinanced(transactions, dateRange),
    [transactions, dateRange]
  )

  const categoryData = useMemo(
    () => getExpensesByCategory(transactions, dateRange),
    [transactions, dateRange]
  )

  const monthlyData = useMemo(() => getMonthlyData(transactions), [transactions])
  const profitData = useMemo(() => getProfitOverTime(transactions), [transactions])
  const topIncome = useMemo(() => getTopMonthsByIncome(transactions), [transactions])
  const topProfit = useMemo(() => getTopMonthsByProfit(transactions), [transactions])
  const topWeeks = useMemo(() => getTopWeeks(transactions), [transactions])

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
                formatter={(value) => [`${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`, 'Ganancia']}
              />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rankings section */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Top 5 months by income */}
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

        {/* Top 5 months by profit */}
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

        {/* Top 10 weeks */}
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
