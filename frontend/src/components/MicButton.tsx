import React from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useSTT } from '../hooks/useSTT'

interface MicButtonProps {
  onTranscript: (transcript: string) => void
  className?: string
}

const MicButton = ({ onTranscript, className = '' }: MicButtonProps) => {
  const { isListening, startListening, stopListening, error } = useSTT()

  const handleClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const handleTranscriptChange = (transcript: string) => {
    if (transcript) {
      onTranscript(transcript)
    }
  }

  // Listen for transcript changes
  React.useEffect(() => {
    if (transcript) {
      handleTranscriptChange(transcript)
    }
  }, [transcript])

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <button
        onClick={handleClick}
        disabled={!!error}
        className={`
          w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200
          ${isListening 
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
            : 'bg-primary-500 hover:bg-primary-600 text-white'
          }
          ${error ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-label={isListening ? '음성 인식 중지' : '음성 인식 시작'}
      >
        {isListening ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </button>
      
      {error && (
        <p className="text-red-500 text-xs mt-2 text-center max-w-32">
          {error}
        </p>
      )}
      
      {isListening && (
        <p className="text-primary-600 text-xs mt-2 text-center">
          듣고 있습니다...
        </p>
      )}
    </div>
  )
}

export default MicButton
