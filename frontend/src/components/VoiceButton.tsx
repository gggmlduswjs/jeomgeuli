import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceButtonProps {
  onStart?: () => void;
  onStop?: () => void;
  isListening?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function VoiceButton({ 
  onStart, 
  onStop, 
  isListening = false, 
  disabled = false,
  className = ""
}: VoiceButtonProps) {
  const handleClick = () => {
    if (isListening) {
      onStop?.();
    } else {
      onStart?.();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`p-3 rounded-full transition-colors ${
        isListening 
          ? 'bg-red-500 text-white hover:bg-red-600' 
          : 'bg-blue-500 text-white hover:bg-blue-600'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={isListening ? '음성 인식 중지' : '음성 인식 시작'}
    >
      {isListening ? <MicOff size={20} /> : <Mic size={20} />}
    </button>
  );
}