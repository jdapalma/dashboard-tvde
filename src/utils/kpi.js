export function calculateKPIs(transactions, dateRange) {
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date)
    return d >= dateRange.start && d <= dateRange.end
  })

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const profit = totalIncome - totalExpenses

  const totalTrips = filtered
    .filter((t) => t.trips_count != null)
    .reduce((sum, t) => sum + t.trips_count, 0)

  const avgPerTrip = totalTrips > 0 ? profit / totalTrips : 0

  return {
    totalIncome,
    totalExpenses,
    profit,
    totalTrips,
    avgPerTrip,
  }
}

export function getExpensesByCategory(transactions, dateRange) {
  const filtered = transactions.filter((t) => {
    const d = new Date(t.date)
    return t.type === 'expense' && d >= dateRange.start && d <= dateRange.end
  })

  const byCategory = {}
  filtered.forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
  })

  return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
}

export function getMonthlyData(transactions) {
  const monthly = {}
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7) // YYYY-MM
    if (!monthly[key]) monthly[key] = { month: key, income: 0, expense: 0 }
    if (t.type === 'income') monthly[key].income += Number(t.amount)
    else monthly[key].expense += Number(t.amount)
  })

  return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month))
}

export function getProfitOverTime(transactions) {
  const monthly = getMonthlyData(transactions)
  let cumulative = 0
  return monthly.map((m) => {
    cumulative += m.income - m.expense
    return { month: m.month, profit: cumulative }
  })
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${months[parseInt(m) - 1]} ${y}`
}

function weekLabel(mondayStr) {
  const d = new Date(mondayStr + 'T00:00:00')
  const end = new Date(d)
  end.setDate(end.getDate() + 6)
  const fmt = (dt) => `${dt.getDate()}/${dt.getMonth() + 1}`
  return `${fmt(d)} - ${fmt(end)}/${d.getFullYear()}`
}

function getMonday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getTopMonthsByIncome(transactions, limit = 5) {
  const monthly = {}
  transactions.forEach((t) => {
    if (t.type !== 'income') return
    const key = t.date.slice(0, 7)
    monthly[key] = (monthly[key] || 0) + Number(t.amount)
  })
  return Object.entries(monthly)
    .map(([key, income]) => ({ key, label: monthLabel(key), income }))
    .sort((a, b) => b.income - a.income)
    .slice(0, limit)
}

export function getTopMonthsByProfit(transactions, limit = 5) {
  const monthly = {}
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7)
    if (!monthly[key]) monthly[key] = { income: 0, expense: 0 }
    if (t.type === 'income') monthly[key].income += Number(t.amount)
    else monthly[key].expense += Number(t.amount)
  })
  return Object.entries(monthly)
    .map(([key, v]) => ({ key, label: monthLabel(key), profit: v.income - v.expense }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, limit)
}

export function getTopWeeks(transactions, limit = 5) {
  const weeks = {}
  transactions.forEach((t) => {
    const monday = getMonday(t.date)
    const key = monday
    if (!weeks[key]) weeks[key] = { income: 0, expense: 0 }
    if (t.type === 'income') weeks[key].income += Number(t.amount)
    else weeks[key].expense += Number(t.amount)
  })
  return Object.entries(weeks)
    .map(([key, v]) => ({ key, label: weekLabel(key), income: v.income, profit: v.income - v.expense }))
    .sort((a, b) => b.income - a.income)
    .slice(0, limit)
}

export function getUnpaidFinanced(transactions, dateRange) {
  return transactions
    .filter((t) => {
      const d = new Date(t.date)
      return t.type === 'expense' && t.is_financed && !t.is_paid && d >= dateRange.start && d <= dateRange.end
    })
    .reduce((sum, t) => sum + Number(t.amount), 0)
}
