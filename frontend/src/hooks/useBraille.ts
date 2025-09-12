import { useState, useCallback } from 'react'
import { apiService } from '../services/api'

interface BrailleState {
  isEnabled: boolean
  isProcessing: boolean
  currentTokens: string[]
  currentIndex: number
}

interface BrailleActions {
  toggleBraille: () => void
  outputTokens: (tokens: string[], mode?: 'once' | 'chunked') => Promise<void>
  nextToken: () => void
  previousToken: () => void
  stopOutput: () => void
  resetOutput: () => void
}

export const useBraille = (): BrailleState & BrailleActions => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentTokens, setCurrentTokens] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const toggleBraille = useCallback(() => {
    setIsEnabled(prev => !prev)
  }, [])

  const outputTokens = useCallback(async (tokens: string[], mode: 'once' | 'chunked' = 'once') => {
    if (!isEnabled || tokens.length === 0) return

    setIsProcessing(true)
    setCurrentTokens(tokens)
    setCurrentIndex(0)

    try {
      await apiService.brailleOutput(tokens, mode)
      
      if (mode === 'chunked') {
        // Simulate chunked output
        for (let i = 0; i < tokens.length; i++) {
          setCurrentIndex(i)
          await new Promise(resolve => setTimeout(resolve, 1000)) // 1초 간격
        }
      } else {
        // Output all at once
        setCurrentIndex(tokens.length - 1)
      }
    } catch (error) {
      console.error('Braille output error:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [isEnabled])

  const nextToken = useCallback(() => {
    if (currentIndex < currentTokens.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, currentTokens.length])

  const previousToken = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const stopOutput = useCallback(() => {
    setIsProcessing(false)
    setCurrentTokens([])
    setCurrentIndex(0)
  }, [])

  const resetOutput = useCallback(() => {
    setCurrentTokens([])
    setCurrentIndex(0)
    setIsProcessing(false)
  }, [])

  return {
    isEnabled,
    isProcessing,
    currentTokens,
    currentIndex,
    toggleBraille,
    outputTokens,
    nextToken,
    previousToken,
    stopOutput,
    resetOutput,
  }
}
