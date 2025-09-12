import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Send, Loader2 } from 'lucide-react'
import { apiService, ChatResponse } from '../services/api'
import { useKeywordsStore } from '../store/keywords'
import MicButton from '../components/MicButton'
import KeywordChips from '../components/KeywordChips'
import Card from '../components/Card'
import BulletList from '../components/BulletList'
import TTSButton from '../components/TTSButton'

const Explore = () => {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Array<{
    id: string
    type: 'user' | 'bot'
    content: string
    response?: ChatResponse
  }>>([])
  
  const { addKeywords } = useKeywordsStore()

  const chatMutation = useMutation({
    mutationFn: (query: string) => apiService.chatAsk(query),
    onSuccess: (data, query) => {
      // Add user message
      const userMessage = {
        id: `user_${Date.now()}`,
        type: 'user' as const,
        content: query
      }
      
      // Add bot response
      const botMessage = {
        id: `bot_${Date.now()}`,
        type: 'bot' as const,
        content: data.summary,
        response: data
      }
      
      setMessages(prev => [...prev, userMessage, botMessage])
      
      // Add keywords to store
      if (data.keywords && data.keywords.length > 0) {
        addKeywords(data.keywords)
      }
      
      // Clear input
      setQuery('')
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !chatMutation.isPending) {
      chatMutation.mutate(query.trim())
    }
  }

  const handleMicTranscript = (transcript: string) => {
    setQuery(transcript)
  }

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery)
  }

  const examples = [
    "오늘 뉴스 5개 요약해줘",
    "블록체인 쉽게 설명해줘", 
    "GPT-5가 뭐야?",
    "인공지능의 장단점 알려줘",
    "날씨 정보 알려줘"
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* Left Panel - Content Display */}
        <div className="space-y-6">
          {/* Keyword Chips */}
          <KeywordChips />
          
          {/* Content Display */}
          <div className="space-y-4">
            {messages.filter(m => m.type === 'bot' && m.response).map((message) => {
              const response = message.response!
              
              return (
                <div key={message.id} className="space-y-4">
                  {/* Summary */}
                  <div className="card">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {response.mode === 'news' ? '뉴스 요약' : 
                         response.mode === 'explain' ? '설명' : '답변'}
                      </h3>
                      <TTSButton text={message.content} size="sm" />
                    </div>
                    <p className="text-gray-700 leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                  
                  {/* Simple Explanation */}
                  {response.simple && (
                    <div className="card bg-blue-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-blue-900">쉬운 말로 설명</h4>
                        <TTSButton text={response.simple} size="sm" />
                      </div>
                      <p className="text-blue-800 leading-relaxed">
                        {response.simple}
                      </p>
                    </div>
                  )}
                  
                  {/* Cards for News Mode */}
                  {response.mode === 'news' && response.cards && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">뉴스 카드</h4>
                      {response.cards.map((card, index) => (
                        <Card
                          key={index}
                          title={card.title}
                          oneLine={card.oneLine}
                          url={card.url}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Bullets for Explain Mode */}
                  {response.mode === 'explain' && response.bullets && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">상세 설명</h4>
                      <BulletList bullets={response.bullets} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Panel - Chat Interface */}
        <div className="space-y-6">
          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto space-y-4 p-4 bg-white rounded-xl border border-gray-200">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg font-medium mb-2">정보탐색을 시작해보세요</p>
                <p className="text-sm">음성이나 텍스트로 질문해보세요</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`
                      max-w-xs px-4 py-2 rounded-2xl
                      ${message.type === 'user' 
                        ? 'bg-accent-500 text-white rounded-br-md' 
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                      }
                    `}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="질문을 입력하거나 음성으로 말해보세요..."
                className="flex-1 input-field"
                disabled={chatMutation.isPending}
              />
              <MicButton onTranscript={handleMicTranscript} />
              <button
                type="submit"
                disabled={!query.trim() || chatMutation.isPending}
                className="btn-primary flex items-center space-x-2"
              >
                {chatMutation.isPending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </form>

          {/* Example Queries */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">예시 질문</h4>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors duration-200"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Explore
