import { useBraille } from '../hooks/useBraille'
import { Eye, EyeOff } from 'lucide-react'

const BrailleToggle = () => {
  const { isEnabled, toggleBraille } = useBraille()

  return (
    <button
      onClick={toggleBraille}
      className={`
        flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200
        ${isEnabled 
          ? 'bg-accent-500 text-white' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
      `}
      aria-label={isEnabled ? '점자 출력 끄기' : '점자 출력 켜기'}
    >
      {isEnabled ? <Eye size={20} /> : <EyeOff size={20} />}
      <span className="hidden sm:inline text-sm font-medium">
        {isEnabled ? '점자 ON' : '점자 OFF'}
      </span>
    </button>
  )
}

export default BrailleToggle
