import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

const presets = [
  { label: 'Semana Actual', value: 'week' },
  { label: 'Semana Anterior', value: 'lastWeek' },
  { label: 'Mes Actual', value: 'month' },
  { label: 'Mes Anterior', value: 'lastMonth' },
  { label: 'Año Actual', value: 'year' },
  { label: 'Año Anterior', value: 'lastYear' },
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
    case 'lastMonth': {
      start.setMonth(start.getMonth() - 1, 1)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    case 'year':
      start.setMonth(0, 1)
      break
    case 'lastYear': {
      start.setFullYear(start.getFullYear() - 1, 0, 1)
      const end = new Date(start.getFullYear(), 11, 31, 23, 59, 59)
      start.setHours(0, 0, 0, 0)
      return { start, end }
    }
    default:
      return null
  }
  start.setHours(0, 0, 0, 0)
  return { start, end: now }
}

function toLocalDateStr(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function PeriodFilter({ dateRange, onDateRangeChange }) {
  const activePreset = dateRange.preset || 'month'
  const [startStr, setStartStr] = useState(toLocalDateStr(dateRange.start))
  const [endStr, setEndStr] = useState(toLocalDateStr(dateRange.end))

  useEffect(() => {
    setStartStr(toLocalDateStr(dateRange.start))
    setEndStr(toLocalDateStr(dateRange.end))
  }, [dateRange.start, dateRange.end])

  function handlePreset(value) {
    if (value === 'custom') {
      setStartStr(toLocalDateStr(dateRange.start))
      setEndStr(toLocalDateStr(dateRange.end))
      onDateRangeChange({ ...dateRange, preset: 'custom' })
    } else {
      const range = getPresetRange(value)
      onDateRangeChange({ ...range, preset: value })
    }
  }

  function handleApply() {
    if (!startStr || !endStr) return
    const start = new Date(startStr + 'T00:00:00')
    const end = new Date(endStr + 'T23:59:59')
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return
    if (start > end) return
    onDateRangeChange({ start, end, preset: 'custom' })
  }

  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
      {presets.map((p) => (
        <button
          key={p.value}
          onClick={() => handlePreset(p.value)}
          className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
            activePreset === p.value
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          {p.label}
        </button>
      ))}

      {activePreset === 'custom' && (
        <div className="flex gap-1.5 md:gap-2 items-center">
          <input
            type="date"
            value={startStr}
            onChange={(e) => setStartStr(e.target.value)}
            className="px-2 md:px-3 py-1.5 md:py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-xs md:text-sm"
          />
          <span className="text-[#94a3b8] text-xs">a</span>
          <input
            type="date"
            value={endStr}
            onChange={(e) => setEndStr(e.target.value)}
            className="px-2 md:px-3 py-1.5 md:py-2 bg-[#231c3d] border border-[#3b2d5e] rounded-lg text-white text-xs md:text-sm"
          />
          <button
            onClick={handleApply}
            className="flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 bg-[#a855f7] text-white rounded-lg hover:bg-[#9333ea] transition-colors text-xs md:text-sm"
          >
            <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
