import { useState, useEffect } from 'react'
import { Mic, MicOff, RotateCcw } from 'lucide-react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { parseVoiceInput } from '../utils/voiceParser'

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

export default function VoiceInput({ onDetected }) {
  const [result, setResult] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const { startListening, stopListening, transcript, interimTranscript, status, error: speechError, isSupported, reset } = useSpeechRecognition()

  async function handleStart() {
    setError('')
    setResult(null)
    startListening()
  }

  // Auto-parse when speech ends with a transcript
  useEffect(() => {
    if (status === 'done' && transcript && !result && !processing) {
      async function parse() {
        setProcessing(true)
        setError('')
        try {
          const parsed = await parseVoiceInput(transcript, GEMINI_KEY)
          setResult(parsed)
        } catch (err) {
          setError('Error al analizar el mensaje. Intenta de nuevo.')
        } finally {
          setProcessing(false)
        }
      }
      parse()
    }
  }, [status, transcript, result, processing])

  function handleConfirm() {
    onDetected({
      type: result.type || 'expense',
      amount: result.amount || '',
      category: result.category || 'Otro',
      platform: result.platform || 'uber',
      date: result.date || new Date().toISOString().split('T')[0],
      trips_count: result.trips_count || null,
      description: result.description || '',
      source: 'voice',
    })
  }

  function handleRetry() {
    reset()
    setResult(null)
    setError('')
  }

  if (!isSupported) {
    return (
      <div className="bg-[#1a1432] border border-[#2d2350] rounded-xl p-8 text-center">
        <MicOff className="w-12 h-12 text-[#94a3b8] mx-auto mb-3" />
        <p className="text-white font-medium mb-1">Entrada de voz no disponible</p>
        <p className="text-sm text-[#94a3b8]">
          Tu navegador no soporta reconocimiento de voz.
          Usa <strong>Chrome</strong> o <strong>Edge</strong> en escritorio o Android.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Idle / Listening state */}
      {!result && (
        <div className="border-2 border-dashed border-[#3b2d5e] rounded-xl p-8 text-center">
          {status === 'listening' ? (
            <div className="space-y-4">
              {/* Pulsing mic */}
              <div className="relative mx-auto w-20 h-20">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-red-500/30 flex items-center justify-center">
                  <Mic className="w-8 h-8 text-red-400" />
                </div>
              </div>

              <p className="text-white font-medium">Escuchando...</p>

              {/* Live transcript */}
              {(transcript || interimTranscript) && (
                <div className="bg-[#231c3d] rounded-lg p-3 text-left">
                  <p className="text-white text-sm">
                    {transcript}
                    <span className="text-[#94a3b8]">{interimTranscript}</span>
                  </p>
                </div>
              )}

              <button
                onClick={stopListening}
                className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
              >
                Detener
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleStart}
                className="mx-auto w-20 h-20 rounded-full bg-[#a855f7]/20 border-2 border-[#a855f7]/40 flex items-center justify-center hover:bg-[#a855f7]/30 transition-colors"
              >
                <Mic className="w-8 h-8 text-[#a855f7]" />
              </button>
              <p className="text-white font-medium">Toca para hablar</p>
              <p className="text-sm text-[#94a3b8]">
                Describe tu gasto o ingreso, ej: "Gaste 30€ en gasolina hoy"
              </p>
            </div>
          )}
        </div>
      )}

      {/* Processing */}
      {processing && (
        <div className="flex items-center gap-3 justify-center py-4">
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 rounded-full border-2 border-[#3b2d5e]" />
            <div
              className="absolute inset-0 rounded-full border-2 border-[#a855f7] border-t-transparent"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          </div>
          <p className="text-sm text-[#94a3b8]">Analizando tu mensaje...</p>
        </div>
      )}

      {/* Error */}
      {(error || speechError) && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error || speechError}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#231c3d] border border-[#3b2d5e] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Datos detectados</h4>
            <span className={`text-xs ${result.confidence >= 70 ? 'text-green-400' : 'text-yellow-400'}`}>
              {result.confidence >= 70 ? 'Alta confianza' : 'Revisa los datos'}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Tipo:</span>
              <span className={result.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                {result.type === 'income' ? 'Ingreso' : 'Gasto'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Monto:</span>
              <span className="text-white">{result.amount ? `${result.amount} €` : 'No detectado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Categoría:</span>
              <span className="text-white">{result.category || 'No detectada'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Fecha:</span>
              <span className="text-white">{result.date || 'No detectada'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Descripción:</span>
              <span className="text-white truncate max-w-[200px]">{result.description || 'No detectada'}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="flex-1 py-3 bg-[#1a1432] border border-[#3b2d5e] text-[#94a3b8] font-medium rounded-lg hover:bg-[#2d2350] transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold rounded-lg transition-colors"
            >
              Usar estos datos
            </button>
          </div>
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
