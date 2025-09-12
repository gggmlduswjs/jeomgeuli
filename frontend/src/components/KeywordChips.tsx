import React from 'react'
import { X } from 'lucide-react'
import { useKeywordsStore } from '../store/keywords'
import { useBraille } from '../hooks/useBraille'

const KeywordChips = () => {
  const { keywords, removeKeyword } = useKeywordsStore()
  const { outputTokens } = useBraille()

  const handleKeywordClick = async (keyword: string) => {
    // Output keyword as braille tokens (3 characters at a time)
    const tokens = keyword.split('').reduce((acc: string[], char, index) => {
      if (index % 3 === 0) {
        acc.push(keyword.slice(index, index + 3))
      }
      return acc
    }, [])
    
    await outputTokens(tokens, 'chunked')
  }

  if (keywords.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="text-sm font-medium text-gray-600 mr-2">핵심 키워드:</span>
      {keywords.map((keyword, index) => (
        <button
          key={index}
          onClick={() => handleKeywordClick(keyword)}
          className="flex items-center space-x-1 bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200"
          aria-label={`${keyword} 점자 출력`}
        >
          <span>{keyword}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              removeKeyword(keyword)
            }}
            className="hover:bg-primary-300 rounded-full p-0.5"
            aria-label={`${keyword} 제거`}
          >
            <X size={14} />
          </button>
        </button>
      ))}
    </div>
  )
}

export default KeywordChips
