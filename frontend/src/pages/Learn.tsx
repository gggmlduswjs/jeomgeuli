import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiService, LearnResponse } from '../services/api'
import { useReviewStore } from '../store/review'
import { useTTS } from '../hooks/useTTS'
import TTSButton from '../components/TTSButton'
import QuickActions from '../components/QuickActions'

type LearningMode = 'char' | 'word' | 'sent' | 'free'

const Learn = () => {
  const [currentMode, setCurrentMode] = useState<LearningMode>('char')
  const [currentLesson, setCurrentLesson] = useState<LearnResponse | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [testMode, setTestMode] = useState(false)
  const [testAnswers, setTestAnswers] = useState<string[]>([])
  const [testResults, setTestResults] = useState<any>(null)
  
  const { speak, stop } = useTTS()
  const { addReviewItem } = useReviewStore()

  const { data: lessonData, isLoading, refetch } = useQuery({
    queryKey: ['lesson', currentMode],
    queryFn: () => apiService.getNextLesson(currentMode),
    enabled: !testMode,
    onSuccess: (data) => {
      setCurrentLesson(data)
      setTestMode(false)
      setTestAnswers([])
      setTestResults(null)
    }
  })

  const testMutation = useMutation({
    mutationFn: ({ answers, correctAnswers }: { answers: string[], correctAnswers: string[] }) =>
      apiService.submitTest(currentMode, answers, correctAnswers),
    onSuccess: (results) => {
      setTestResults(results)
      
      // Add incorrect answers to review
      results.incorrect_answers.forEach((item: any) => {
        addReviewItem({
          type: currentMode,
          korean: item.question,
          braille: item.correct,
          description: '테스트 오답',
          correct: false
        })
      })
    }
  })

  const handlePlayTTS = () => {
    if (isPlaying) {
      stop()
      setIsPlaying(false)
    } else if (currentLesson?.lesson.tts_text) {
      speak(currentLesson.lesson.tts_text)
      setIsPlaying(true)
    }
  }

  const handleStop = () => {
    stop()
    setIsPlaying(false)
  }

  const handleNext = () => {
    if (testMode && testAnswers.length > 0) {
      // Submit test
      const correctAnswers = currentLesson?.test_questions.map(q => q.correct) || []
      testMutation.mutate({ answers: testAnswers, correctAnswers })
    } else {
      // Get next lesson
      refetch()
    }
  }

  const handleRepeat = () => {
    handlePlayTTS()
  }

  const handleStartTest = () => {
    setTestMode(true)
    setTestAnswers([])
    setTestResults(null)
  }

  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    setTestAnswers(prev => {
      const newAnswers = [...prev]
      newAnswers[questionIndex] = answer
      return newAnswers
    })
  }

  const modes: Array<{ key: LearningMode; label: string; description: string }> = [
    { key: 'char', label: '자모', description: '한글 자모 학습' },
    { key: 'word', label: '단어', description: '단어 점자 학습' },
    { key: 'sent', label: '문장', description: '문장 점자 학습' },
    { key: 'free', label: '자유 변환', description: '자유 텍스트 변환' }
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mode Selection */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">점자학습</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {modes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setCurrentMode(mode.key)}
              className={`
                p-4 rounded-xl border-2 transition-all duration-200 text-left
                ${currentMode === mode.key 
                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              <h3 className="font-semibold text-lg mb-1">{mode.label}</h3>
              <p className="text-sm text-gray-600">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Learning Content */}
      {isLoading ? (
        <div className="card text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">학습 내용을 불러오는 중...</p>
        </div>
      ) : currentLesson ? (
        <div className="space-y-6">
          {/* Lesson Content */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {currentLesson.lesson.korean}
                </h2>
                <div className="text-4xl font-mono mb-4 text-primary-600">
                  {currentLesson.lesson.braille}
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {currentLesson.lesson.description}
                </p>
              </div>
              <TTSButton text={currentLesson.lesson.tts_text} />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">학습 안내:</p>
              <p className="text-gray-700">{currentLesson.instructions}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActions
            onNext={handleNext}
            onRepeat={handleRepeat}
            onStop={handleStop}
            onStart={handlePlayTTS}
            isPlaying={isPlaying}
          />

          {/* Test Section */}
          {!testMode ? (
            <div className="card text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                학습 테스트
              </h3>
              <p className="text-gray-600 mb-6">
                학습한 내용을 테스트해보세요
              </p>
              <button
                onClick={handleStartTest}
                className="btn-primary"
              >
                테스트 시작하기
              </button>
            </div>
          ) : (
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                학습 테스트
              </h3>
              
              {!testResults ? (
                <div className="space-y-6">
                  {currentLesson.test_questions.map((question, index) => (
                    <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-4">
                        {question.question}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {question.options.map((option, optionIndex) => (
                          <button
                            key={optionIndex}
                            onClick={() => handleAnswerSelect(index, option)}
                            className={`
                              p-3 rounded-lg border-2 transition-colors duration-200 text-left
                              ${testAnswers[index] === option
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <div className="font-mono text-lg mb-1">{option}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="text-center pt-4">
                    <button
                      onClick={handleNext}
                      disabled={testAnswers.length !== currentLesson.test_questions.length}
                      className="btn-primary"
                    >
                      답안 제출하기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600 mb-2">
                      {testResults.score}점
                    </div>
                    <p className="text-gray-600">
                      {testResults.correct}개 정답 / {testResults.total}개 문제
                    </p>
                  </div>
                  
                  {testResults.incorrect_answers.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-600 mb-4">
                        오답 문제 (복습 노트에 저장됨)
                      </h4>
                      <div className="space-y-3">
                        {testResults.incorrect_answers.map((item: any, index: number) => (
                          <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="font-medium text-red-800 mb-2">{item.question}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-red-600">
                                정답: <span className="font-mono">{item.correct}</span>
                              </span>
                              <span className="text-gray-600">
                                내 답: <span className="font-mono">{item.user_answer}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setTestMode(false)
                        setTestResults(null)
                        refetch()
                      }}
                      className="btn-primary"
                    >
                      다음 학습하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600">학습 내용을 불러오지 못했습니다.</p>
        </div>
      )}
    </div>
  )
}

export default Learn
