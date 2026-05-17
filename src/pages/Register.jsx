import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '../hooks/useTransactions'
import TransactionForm from '../components/TransactionForm'
import OCRScanner from '../components/OCRScanner'

export default function Register() {
  const [mode, setMode] = useState('manual') // 'manual' | 'ocr'
  const [ocrData, setOcrData] = useState(null)
  const { addTransaction } = useTransactions()
  const navigate = useNavigate()

  async function handleSubmit(data) {
    await addTransaction(data)
    navigate('/history')
  }

  function handleOCRDetected(data) {
    setOcrData(data)
    setMode('manual')
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Registrar transacción</h1>

      {/* Mode selector */}
      <div className="flex gap-2">
        <button
          onClick={() => { setMode('manual'); setOcrData(null) }}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          Manual
        </button>
        <button
          onClick={() => setMode('ocr')}
          className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
            mode === 'ocr'
              ? 'bg-[#a855f7] text-white'
              : 'bg-[#231c3d] text-[#94a3b8] hover:bg-[#2d2350]'
          }`}
        >
          Foto / OCR
        </button>
      </div>

      {mode === 'ocr' ? (
        <OCRScanner onDetected={handleOCRDetected} />
      ) : (
        <TransactionForm
          onSubmit={handleSubmit}
          initialData={ocrData || {}}
        />
      )}
    </div>
  )
}
