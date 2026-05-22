import { useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionForm from '../components/TransactionForm'
import OCRScanner from '../components/OCRScanner'
import VoiceInput from '../components/VoiceInput'
import { CheckCircle2 } from 'lucide-react'

export default function Register() {
  const [mode, setMode] = useState('manual') // 'manual' | 'ocr' | 'voice'
  const [detectedData, setDetectedData] = useState(null)
  const [success, setSuccess] = useState(null)
  const { addTransaction } = useTransactions()

  async function handleSubmit(data) {
    await addTransaction(data)
    setSuccess(data.type === 'income' ? 'Ingreso guardado correctamente' : 'Gasto guardado correctamente')
    setDetectedData(null)
    setTimeout(() => setSuccess(null), 3000)
  }

  function handleDetected(data) {
    setDetectedData(data)
    setMode('manual')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Registrar transacción</h1>

      {/* Success message */}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => { setMode('manual'); setDetectedData(null) }}
          className={`py-3 rounded-lg font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          Manual
        </button>
        <button
          disabled
          className="py-3 rounded-lg font-medium bg-[#1a1432] text-[#4a4458] cursor-not-allowed border border-[#2d2350]"
        >
          Foto / OCR
        </button>
        <button
          onClick={() => setMode('voice')}
          className={`py-3 rounded-lg font-medium transition-colors ${
            mode === 'voice'
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          Voz
        </button>
      </div>

      {mode === 'ocr' ? (
        <OCRScanner onDetected={handleDetected} />
      ) : mode === 'voice' ? (
        <VoiceInput onDetected={handleDetected} />
      ) : (
        <TransactionForm
          key={success ? Date.now() : 'form'}
          onSubmit={handleSubmit}
          initialData={detectedData || {}}
        />
      )}
    </div>
  )
}
