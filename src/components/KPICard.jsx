export default function KPICard({ title, value, color = 'text-[#a855f7]', decimals = 2, icon: Icon }) {
  return (
    <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#94a3b8] mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>
            {typeof value === 'number'
              ? value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
              : value}
          </p>
        </div>
        {Icon && <Icon className={`w-6 h-6 ${color} opacity-40`} />}
      </div>
    </div>
  )
}
