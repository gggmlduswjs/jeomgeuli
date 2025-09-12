import { useState, useCallback, useRef } from 'react'

interface TTSState {
  isPlaying: boolean
  isSupported: boolean
  rate: number
  pitch: number
  volume: number
}

interface TTSActions {
  speak: (text: string) => void
  stop: () => void
  pause: () => void
  resume: () => void
  setRate: (rate: number) => void
  setPitch: (pitch: number) => void
  setVolume: (volume: number) => void
}

export const useTTS = (): TTSState & TTSActions => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [rate, setRateState] = useState(1)
  const [pitch, setPitchState] = useState(1)
  const [volume, setVolumeState] = useState(1)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Check if Speech Synthesis is supported
  const checkSupport = useCallback(() => {
    const supported = 'speechSynthesis' in window
    setIsSupported(supported)
    return supported
  }, [])

  const speak = useCallback((text: string) => {
    if (!checkSupport()) {
      console.error('Speech synthesis is not supported')
      return
    }

    // Stop any current speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    utterance.onstart = () => {
      setIsPlaying(true)
    }

    utterance.onend = () => {
      setIsPlaying(false)
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error)
      setIsPlaying(false)
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [rate, pitch, volume, checkSupport])

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
    }
  }, [])

  const pause = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      setIsPlaying(false)
    }
  }, [])

  const resume = useCallback(() => {
    if (window.speechSynthesis && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setIsPlaying(true)
    }
  }, [])

  const setRate = useCallback((newRate: number) => {
    setRateState(newRate)
    if (utteranceRef.current) {
      utteranceRef.current.rate = newRate
    }
  }, [])

  const setPitch = useCallback((newPitch: number) => {
    setPitchState(newPitch)
    if (utteranceRef.current) {
      utteranceRef.current.pitch = newPitch
    }
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume)
    if (utteranceRef.current) {
      utteranceRef.current.volume = newVolume
    }
  }, [])

  return {
    isPlaying,
    isSupported,
    rate,
    pitch,
    volume,
    speak,
    stop,
    pause,
    resume,
    setRate,
    setPitch,
    setVolume,
  }
}
