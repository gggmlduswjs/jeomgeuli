import React, { useState } from 'react'
import { useReviewStore } from '../store/review'
import { useBraille } from '../hooks/useBraille'
import { Trash2, Volume2, Eye } from 'lucide-react'
import TTSButton from '../components/TTSButton'
import QuickActions from '../components/QuickActions'

const Review = () => {
  const { items, removeReviewItem, clearReviewItems, getIncorrectItems } = useReviewStore()
  const { outputTokens, isEnabled } = useBraille()
  const [currentItemIndex, setCurrentItemIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const incorrectItems = getIncorrectItems()
  const currentItem = incorrectItems[currentItemIndex]

  const handleNext = () => {
    if (currentItemIndex < incorrectItems.length - 1) {
      setCurrentItemIndex(prev => prev + 1)
    } else {
      setCurrentItemIndex(0) // Loop back to start
    }
  }

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1)
    } else {
      setCurrentItemIndex(incorrectItems.length - 1) // Loop to end
    }
  }

  const handleRepeat = () => {
    if (currentItem?.description) {
      // TTS will be handled by TTSButton component
    }
  }

  const handleBrailleOutput = async () => {
    if (currentItem) {
      const tokens = currentItem.korean.split('').reduce((acc: string[], char, index) => {
        if (index % 3 === 0) {
          acc.push(currentItem.korean.slice(index, index + 3))
        }
        return acc
      }, [])
      
      await outputTokens(tokens, 'chunked')
    }
  }

  const handleStop = () => {
    setIsPlaying(false)
  }

  const handleStart = () => {
    setIsPlaying(true)
  }

  if (incorrectItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-600 font-bold text-2xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            복습할 내용이 없습니다
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            모든 문제를 정답으로 맞추셨습니다!<br />
            점자학습을 계속 진행해보세요.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="card text-center">
              <h3 className="font-semibold text-gray-900 mb-2">총 학습 항목</h3>
              <p className="text-3xl font-bold text-primary-600">{items.length}</p>
            </div>
            <div className="card text-center">
              <h3 className="font-semibold text-gray-900 mb-2">정답률</h3>
              <p className="text-3xl font-bold text-green-600">
                {items.length > 0 ? Math.round((items.filter(item => item.correct).length / items.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">복습 노트</h1>
          <p className="text-gray-600">
            오답 문제 {incorrectItems.length}개를 복습해보세요
          </p>
        </div>
        <button
          onClick={clearReviewItems}
          className="btn-secondary flex items-center space-x-2"
        >
          <Trash2 size={20} />
          <span>전체 삭제</span>
        </button>
      </div>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>진행률</span>
          <span>{currentItemIndex + 1} / {incorrectItems.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentItemIndex + 1) / incorrectItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Review Content */}
      {currentItem && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${currentItem.type === 'char' ? 'bg-blue-100 text-blue-700' :
                      currentItem.type === 'word' ? 'bg-green-100 text-green-700' :
                      currentItem.type === 'sent' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'}
                  `}>
                    {currentItem.type === 'char' ? '자모' :
                     currentItem.type === 'word' ? '단어' :
                     currentItem.type === 'sent' ? '문장' : '자유변환'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(currentItem.timestamp).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {currentItem.korean}
                </h2>
                
                <div className="text-6xl font-mono mb-6 text-primary-600">
                  {currentItem.braille}
                </div>
                
                <p className="text-gray-700 leading-relaxed text-lg">
                  {currentItem.description}
                </p>
              </div>
              
              <div className="flex flex-col space-y-3 ml-6">
                <TTSButton text={currentItem.description} size="lg" />
                {isEnabled && (
                  <button
                    onClick={handleBrailleOutput}
                    className="w-12 h-12 bg-accent-500 hover:bg-accent-600 text-white rounded-full flex items-center justify-center transition-colors duration-200"
                    aria-label="점자 출력"
                  >
                    <Eye size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions
            onNext={handleNext}
            onRepeat={handleRepeat}
            onStop={handleStop}
            onStart={handleStart}
            isPlaying={isPlaying}
          />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              className="btn-secondary flex items-center space-x-2"
              disabled={incorrectItems.length <= 1}
            >
              <span>← 이전</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => removeReviewItem(currentItem.id)}
                className="btn-secondary flex items-center space-x-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} />
                <span>삭제</span>
              </button>
            </div>
            
            <button
              onClick={handleNext}
              className="btn-primary flex items-center space-x-2"
              disabled={incorrectItems.length <= 1}
            >
              <span>다음 →</span>
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <div className="card text-center">
          <h3 className="font-semibold text-gray-900 mb-2">총 학습 항목</h3>
          <p className="text-2xl font-bold text-primary-600">{items.length}</p>
        </div>
        <div className="card text-center">
          <h3 className="font-semibold text-gray-900 mb-2">복습 필요</h3>
          <p className="text-2xl font-bold text-orange-600">{incorrectItems.length}</p>
        </div>
        <div className="card text-center">
          <h3 className="font-semibold text-gray-900 mb-2">정답률</h3>
          <p className="text-2xl font-bold text-green-600">
            {items.length > 0 ? Math.round((items.filter(item => item.correct).length / items.length) * 100) : 0}%
          </p>
        </div>
      </div>
    </div>
  )
}

export default Review
