export default function KPICard({ title, value, color = 'text-[#a855f7]', decimals = 2, icon: Icon, suffix }) {
  return (
    <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-2 md:p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[10px] md:text-xs text-[#94a3b8] mb-0.5 md:mb-1 truncate">{title}</p>
          <p className={`text-base md:text-2xl font-bold ${color} leading-tight`}>
            {typeof value === 'number'
              ? value.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
              : value}
            {suffix && <span className="text-xs md:text-lg">{suffix}</span>}
          </p>
        </div>
        {Icon && <Icon className={`w-4 h-4 md:w-6 md:h-6 ${color} opacity-40 shrink-0`} />}
      </div>
    </div>
  )
}
