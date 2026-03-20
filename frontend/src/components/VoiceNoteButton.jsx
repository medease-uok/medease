import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'

// ⚠️ SECURITY: Chrome's Web Speech API transmits audio to Google servers for processing.
// Dictated content (diagnoses, medications, clinical notes) may contain PHI.
// Ensure this complies with your organisation's data processing agreements.
const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null

const MAX_RECORDING_MS = 120_000 // 2 minutes auto-stop

/**
 * A mic button that appends speech-to-text into a textarea/input.
 *
 * Props:
 *  - onTranscript(text)  — called with recognised text to append
 *  - maxLength           — optional char limit; transcript is truncated to fit
 *  - currentLength       — current value length (for maxLength enforcement)
 *  - disabled            — external disable (e.g. form submitting)
 *  - className           — extra classes on the wrapper
 *  - lang                — BCP-47 language (default "en-US")
 */
export default function VoiceNoteButton({
  onTranscript,
  maxLength,
  currentLength = 0,
  disabled = false,
  className = '',
  lang = 'en-US',
}) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const listeningRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  const timeoutRef = useRef(null)

  // Keep callback ref fresh to avoid stale closures
  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])

  const stop = useCallback(() => {
    listeningRef.current = false
    setListening(false)
    clearTimeout(timeoutRef.current)
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  // Auto-stop when disabled becomes true mid-session
  useEffect(() => {
    if (disabled && listeningRef.current) stop()
  }, [disabled, stop])

  // Clean up old session when lang changes
  useEffect(() => {
    if (listeningRef.current) stop()
  }, [lang, stop])

  const start = useCallback(() => {
    if (!SpeechRecognition || disabled) return

    // Stop any existing session first
    if (recognitionRef.current) {
      recognitionRef.current.onend = null
      recognitionRef.current.stop()
    }

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.interimResults = false
    recognition.continuous = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition

    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1]
      if (last.isFinal) {
        let text = last[0].transcript.trim()
        // Enforce maxLength if provided
        if (maxLength && currentLength + text.length > maxLength) {
          text = text.slice(0, Math.max(0, maxLength - currentLength))
        }
        if (text) onTranscriptRef.current(text)
      }
    }

    let hadError = false
    recognition.onerror = (event) => {
      hadError = true
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        console.error('[VoiceNote] error:', event.error)
      }
      listeningRef.current = false
      setListening(false)
      clearTimeout(timeoutRef.current)
    }

    recognition.onend = () => {
      // Auto-restart only if user hasn't stopped and no error occurred
      if (listeningRef.current && !hadError) {
        try { recognition.start() } catch {
          listeningRef.current = false
          setListening(false)
          clearTimeout(timeoutRef.current)
        }
      } else {
        listeningRef.current = false
        setListening(false)
        clearTimeout(timeoutRef.current)
      }
    }

    try {
      recognition.start()
      listeningRef.current = true
      setListening(true)
      // Auto-stop after timeout to prevent indefinite recording
      timeoutRef.current = setTimeout(stop, MAX_RECORDING_MS)
    } catch (err) {
      console.error('[VoiceNote] start failed:', err)
    }
  }, [disabled, lang, maxLength, currentLength, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listeningRef.current = false
      clearTimeout(timeoutRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  if (!SpeechRecognition) return null

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      disabled={disabled}
      aria-label={listening ? 'Stop voice recording' : 'Start voice recording'}
      aria-pressed={listening}
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
