import { useState, useCallback, useRef } from 'react'

interface STTState {
  isListening: boolean
  transcript: string
  error: string | null
  isSupported: boolean
}

interface STTActions {
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export const useSTT = (): STTState & STTActions => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const failureCountRef = useRef(0)

  // Check if Speech Recognition is supported
  const checkSupport = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setIsSupported(true)
      return SpeechRecognition
    }
    setIsSupported(false)
    return null
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = checkSupport()
    if (!SpeechRecognition) {
      setError('음성 인식이 지원되지 않는 브라우저입니다.')
      return
    }

    try {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'ko-KR'

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        setError(null)
        failureCountRef.current = 0
      }

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(prev => prev + finalTranscript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        
        if (event.error === 'not-allowed') {
          setError('마이크 권한이 허용되지 않았습니다. 브라우저 설정을 확인해주세요.')
          setIsListening(false)
        } else if (event.error === 'no-speech') {
          failureCountRef.current += 1
          if (failureCountRef.current >= 2) {
            setError('음성이 감지되지 않습니다. 텍스트 입력을 사용해주세요.')
            setIsListening(false)
          }
        } else {
          setError(`음성 인식 오류: ${event.error}`)
          setIsListening(false)
        }
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current.start()
    } catch (err) {
      setError('음성 인식을 시작할 수 없습니다.')
      setIsListening(false)
    }
  }, [checkSupport])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
    failureCountRef.current = 0
  }, [])

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}
