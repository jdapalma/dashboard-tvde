const presets = [
  { label: 'Esta semana', value: 'week' },
  { label: 'Semana anterior', value: 'lastWeek' },
  { label: 'Este mes', value: 'month' },
  { label: 'Este año', value: 'year' },
  { label: 'Personalizado', value: 'custom' },
]

function getPresetRange(preset) {
  const now = new Date()
  const start = new Date()

  switch (preset) {
    case 'week': {
      const day = now.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(now.getDate() - diff)
      break
    }
    case 'lastWeek': {
      const day = now.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(now.getDate() - diff - 7)
      const end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'month':
      start.setDate(1)
      break
    case 'year':
      start.setMonth(0, 1)
      break
    default:
      return null
  }
  start.setHours(0, 0, 0, 0)
  return { start, end: now }
}

export default function PeriodFilter({ dateRange, onDateRangeChange }) {
  const activePreset = dateRange.preset || 'month'

  function handlePreset(value) {
    if (value === 'custom') {
      onDateRangeChange({ ...dateRange, preset: 'custom' })
    } else {
      const range = getPresetRange(value)
      onDateRangeChange({ ...range, preset: value })
    }
  }

  function handleCustomDate(field, value) {
    const d = new Date(value)
    if (field === 'start') {
      onDateRangeChange({ ...dateRange, start: d })
    } else {
      onDateRangeChange({ ...dateRange, end: d })
    }
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePreset === p.value
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          {p.label}
        </button>
      ))}

      {activePreset === 'custom' && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateRange.start.toISOString().split('T')[0]}
            onChange={(e) => handleCustomDate('start', e.target.value)}
            className="px-3 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
          />
          <span className="text-[#94a3b8]">a</span>
          <input
            type="date"
            value={dateRange.end.toISOString().split('T')[0]}
            onChange={(e) => handleCustomDate('end', e.target.value)}
            className="px-3 py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-sm"
          />
        </div>
      )}
    </div>
  )
}
