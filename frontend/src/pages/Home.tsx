import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Search, Volume2 } from 'lucide-react'
import { useTTS } from '../hooks/useTTS'
import TTSButton from '../components/TTSButton'

const Home = () => {
  const { speak } = useTTS()

  useEffect(() => {
    // Welcome message when entering the app
    const welcomeMessage = "점글이에 오신 것을 환영합니다. 점자학습과 정보탐색 중에서 선택해주세요."
    speak(welcomeMessage)
  }, [speak])

  const handleCardClick = (cardType: string) => {
    const messages = {
      learn: "점자학습을 시작합니다. 자모, 단어, 문장, 자유 변환을 통해 점자를 배워보세요.",
      explore: "정보탐색을 시작합니다. 뉴스 요약, 쉬운 설명, 질문답변을 통해 정보를 얻어보세요."
    }
    speak(messages[cardType as keyof typeof messages] || "")
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-3xl">점</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          점글이에 오신 것을 환영합니다
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          시각장애인을 위한 정보접근 및 점자학습 PWA입니다.<br />
          음성으로 안내받고 점자로 학습하세요.
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* 점자학습 카드 */}
        <Link
          to="/learn"
          onClick={() => handleCardClick('learn')}
          className="group"
        >
          <div className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-accent-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <BookOpen size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  점자학습
                </h2>
                <p className="text-gray-600">
                  체계적인 점자 학습 과정
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-accent-500 rounded-full" />
                <span>자모 학습</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-accent-500 rounded-full" />
                <span>단어 학습</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-accent-500 rounded-full" />
                <span>문장 학습</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-accent-500 rounded-full" />
                <span>자유 변환</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-primary-600 font-medium group-hover:text-primary-700">
                학습 시작하기 →
              </span>
              <TTSButton 
                text="점자학습을 시작합니다. 자모, 단어, 문장, 자유 변환을 통해 점자를 배워보세요." 
                size="sm" 
              />
            </div>
          </div>
        </Link>

        {/* 정보탐색 카드 */}
        <Link
          to="/explore"
          onClick={() => handleCardClick('explore')}
          className="group"
        >
          <div className="card hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Search size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  정보탐색
                </h2>
                <p className="text-gray-600">
                  다양한 정보에 쉽게 접근
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span>뉴스 요약</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span>쉬운 설명</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span>질문답변</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <span>음성 안내</span>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-primary-600 font-medium group-hover:text-primary-700">
                탐색 시작하기 →
              </span>
              <TTSButton 
                text="정보탐색을 시작합니다. 뉴스 요약, 쉬운 설명, 질문답변을 통해 정보를 얻어보세요." 
                size="sm" 
              />
            </div>
          </div>
        </Link>
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          주요 기능
        </h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Volume2 size={24} className="text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">음성 안내</h4>
            <p className="text-sm text-gray-600">
              TTS와 STT를 통한 음성 인터페이스
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 font-bold text-xl">⠓</span>
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">점자 출력</h4>
            <p className="text-sm text-gray-600">
              키워드와 텍스트를 점자로 출력
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">AI 정보처리</h4>
            <p className="text-sm text-gray-600">
              Gemini AI를 통한 스마트 정보 분석
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
