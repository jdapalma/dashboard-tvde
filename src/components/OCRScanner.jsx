import { useState, useRef } from 'react'
import { processImage } from '../utils/ocr'

export default function OCRScanner({ onDetected }) {
  const [preview, setPreview] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setResult(null)
    setError('')
    processFile(file)
  }

  async function processFile(file) {
    setProcessing(true)
    setProgress(0)
    setStatusMsg('Cargando imagen...')
    try {
      const { extracted, confidence } = await processImage(file, (msg, pct) => {
        setStatusMsg(msg)
        setProgress(pct)
      })
      setResult({ ...extracted, confidence })
      setProgress(100)
    } catch (err) {
      setError('Error al procesar la imagen. Intenta con otra foto.')
    } finally {
      setProcessing(false)
    }
  }

  function handleConfirm() {
    onDetected({
      amount: result.amount || '',
      date: result.date || new Date().toISOString().split('T')[0],
      description: result.description || '',
      source: 'ocr',
    })
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => !processing && fileRef.current?.click()}
        className="border-2 border-dashed border-[#3b2d5e] rounded-xl p-8 text-center cursor-pointer hover:border-[#a855f7] transition-colors"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
        ) : (
          <div className="text-[#94a3b8]">
            <p className="text-lg mb-2">Toca para tomar foto o seleccionar imagen</p>
            <p className="text-sm">Soporta JPG, PNG</p>
          </div>
        )}
      </div>

      {processing && (
        <div className="space-y-3">
          {/* Spinner + message */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-[#3b2d5e]" />
              <div
                className="absolute inset-0 rounded-full border-2 border-[#a855f7] border-t-transparent"
                style={{
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            </div>
            <div>
              <p className="text-sm text-white font-medium">{statusMsg}</p>
              <p className="text-xs text-[#94a3b8]">{Math.round(progress)}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-[#231c3d] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#a855f7] to-[#6366f1] h-2 rounded-full"
              style={{
                width: `${progress}%`,
                transition: 'width 0.3s ease-out',
              }}
            />
          </div>

          {/* Step indicator */}
          <div className="flex justify-between text-xs text-[#94a3b8]">
            <span className={progress >= 10 ? 'text-[#a855f7]' : ''}>Preprocesar</span>
            <span className={progress >= 30 ? 'text-[#a855f7]' : ''}>OCR</span>
            <span className={progress >= 95 ? 'text-[#a855f7]' : ''}>Extraer</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-[#231c3d] border border-[#3b2d5e] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Datos detectados</h4>
            <span className="text-xs text-[#94a3b8]">
              Confianza: {Math.round(result.confidence)}%
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Monto:</span>
              <span className="text-white">{result.amount ? `${result.amount} €` : 'No detectado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Fecha:</span>
              <span className="text-white">{result.date || 'No detectada'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Descripcion:</span>
              <span className="text-white truncate max-w-[200px]">{result.description || 'No detectada'}</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold rounded-lg transition-colors"
          >
            Usar estos datos
          </button>
        </div>
      )}

      {result && (
        <p className="text-xs text-[#94a3b8] text-center">
          Revisa los datos antes de continuar. Puedes corregirlos en el formulario.
        </p>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
