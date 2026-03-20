import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

/**
 * A mic button that appends speech-to-text into a textarea/input.
 *
 * Props:
 *  - onTranscript(text)  — called with recognised text to append
 *  - disabled            — external disable (e.g. form submitting)
 *  - className           — extra classes on the wrapper
 *  - lang                — BCP-47 language (default "en-US")
 */
export default function VoiceNoteButton({ onTranscript, disabled = false, className = '', lang = 'en-US' }) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() => !!SpeechRecognition)
  const recognitionRef = useRef(null)
  const manualStop = useRef(false)

  const stop = useCallback(() => {
    manualStop.current = true
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognition || disabled) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.continuous = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition
    manualStop.current = false

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      if (last.isFinal) {
        onTranscript(last[0].transcript.trim())
      }
    }

    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('[VoiceNote] error:', event.error)
      }
      setListening(false)
    }

    recognition.onend = () => {
      if (!manualStop.current && listening) {
        try { recognition.start() } catch { setListening(false) }
      } else {
        setListening(false)
      }
    }

    try {
      recognition.start()
      setListening(true)
    } catch (err) {
      console.error('[VoiceNote] start failed:', err)
    }
  }, [disabled, lang, onTranscript, listening])

  useEffect(() => {
    return () => {
      manualStop.current = true
      recognitionRef.current?.stop()
    }
  }, [])

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      disabled={disabled}
      title={listening ? 'Stop recording' : 'Voice input'}
      className={`
        inline-flex items-center justify-center
        w-8 h-8 rounded-lg transition-all
        ${listening
          ? 'bg-red-100 text-red-600 hover:bg-red-200 ring-2 ring-red-300 animate-pulse'
          : 'bg-slate-100 text-slate-500 hover:bg-primary/10 hover:text-primary'
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}
