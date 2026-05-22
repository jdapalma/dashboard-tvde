export default function TransactionTable({ transactions, onDelete, onEdit }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-[#94a3b8]">
        <p className="text-lg">No hay transacciones</p>
        <p className="text-sm mt-1">Registra tu primera transacción para verla aquí</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2d2350]">
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Fecha</th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Tipo</th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Categoría</th>
            <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Plataforma</th>
            <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Monto</th>
            <th className="text-right py-3 px-4 text-[#94a3b8] font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-[#2d2350]/50 hover:bg-[#231c3d]/50">
              <td className="py-3 px-4 text-white">
                {new Date(t.date).toLocaleDateString('es-ES')}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    t.type === 'income'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {t.type === 'income' ? 'Ingreso' : 'Gasto'}
                </span>
              </td>
              <td className="py-3 px-4 text-[#c084fc]">{t.category}</td>
              <td className="py-3 px-4 text-white capitalize">{t.platform}</td>
              <td className={`py-3 px-4 text-right font-medium ${
                t.type === 'income' ? 'text-green-400' : 'text-red-400'
              }`}>
                {t.type === 'income' ? '+' : '-'}{Number(t.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </td>
              <td className="py-3 px-4 text-right space-x-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(t)}
                    className="text-[#94a3b8] hover:text-[#a855f7] transition-colors text-xs"
                  >
                    Editar
                  </button>
                )}
                <button
                  onClick={() => onDelete(t.id)}
                  className="text-[#94a3b8] hover:text-red-400 transition-colors text-xs"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
