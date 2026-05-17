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
