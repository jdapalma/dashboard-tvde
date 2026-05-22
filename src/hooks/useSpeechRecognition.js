import { useState, useRef, useCallback, useEffect } from 'react'

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

export function useSpeechRecognition({ lang = 'es-ES' } = {}) {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [status, setStatus] = useState('idle') // idle | listening | processing | done | error
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const isSupported = !!SpeechRecognition

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      setError('Tu navegador no soporta entrada de voz. Usa Chrome o Edge.')
      setStatus('error')
      return
    }

    setError('')
    setTranscript('')
    setInterimTranscript('')
    setStatus('listening')

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) setTranscript(final)
      setInterimTranscript(interim)
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        setError('No se detectó voz. Intenta de nuevo.')
      } else if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado. Actívalo en la configuración del navegador.')
      } else {
        setError(`Error de reconocimiento: ${event.error}`)
      }
      setStatus('error')
      recognitionRef.current = null
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setStatus((prev) => {
        if (prev === 'listening') return 'done'
        return prev
      })
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      setError('No se pudo iniciar el micrófono.')
      setStatus('error')
      recognitionRef.current = null
    }
  }, [lang])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setTranscript('')
    setInterimTranscript('')
    setStatus('idle')
    setError('')
  }, [])

  return {
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    status,
    error,
    isSupported,
    reset,
  }
}
