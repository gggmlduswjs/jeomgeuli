import { Play, RotateCcw, Square, SkipForward } from 'lucide-react'

interface QuickActionsProps {
  onNext: () => void
  onRepeat: () => void
  onStop: () => void
  onStart: () => void
  isPlaying?: boolean
  className?: string
}

const QuickActions = ({ 
  onNext, 
  onRepeat, 
  onStop, 
  onStart, 
  isPlaying = false,
  className = '' 
}: QuickActionsProps) => {
  return (
    <div className={`flex items-center justify-center space-x-4 ${className}`}>
      <button
        onClick={onRepeat}
        className="flex items-center space-x-2 px-4 py-2 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-lg transition-colors duration-200"
        aria-label="반복 재생"
      >
        <RotateCcw size={20} />
        <span className="hidden sm:inline">반복</span>
      </button>

      <button
        onClick={isPlaying ? onStop : onStart}
        className={`
          flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors duration-200 font-medium
          ${isPlaying 
            ? 'bg-red-500 hover:bg-red-600 text-white' 
            : 'bg-primary-500 hover:bg-primary-600 text-white'
          }
        `}
        aria-label={isPlaying ? '정지' : '시작'}
      >
        {isPlaying ? <Square size={20} /> : <Play size={20} />}
        <span className="hidden sm:inline">
          {isPlaying ? '정지' : '시작'}
        </span>
      </button>

      <button
        onClick={onNext}
        className="flex items-center space-x-2 px-4 py-2 bg-accent-100 hover:bg-accent-200 text-accent-700 rounded-lg transition-colors duration-200"
        aria-label="다음"
      >
        <SkipForward size={20} />
        <span className="hidden sm:inline">다음</span>
      </button>
    </div>
  )
}

export default QuickActions
