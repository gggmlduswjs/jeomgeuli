const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export interface ChatResponse {
  mode: 'news' | 'explain' | 'qa'
  summary: string
  simple: string
  keywords: string[]
  cards?: Array<{
    title: string
    oneLine: string
    url: string
  }>
  bullets?: string[]
}

export interface LearnResponse {
  mode: 'char' | 'word' | 'sent' | 'free'
  lesson: {
    korean: string
    braille: string
    description: string
    tts_text: string
  }
  test_questions: Array<{
    question: string
    options: string[]
    correct: string
  }>
  instructions: string
}

export interface BrailleResponse {
  ok: boolean
  message: string
  tokens_processed: number
  mode: string
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
  
  async chatAsk(query: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/chat/ask/', {
      method: 'POST',
      body: JSON.stringify({ query }),
    })
  }
  
  async getNextLesson(mode: 'char' | 'word' | 'sent' | 'free'): Promise<LearnResponse> {
    return this.request<LearnResponse>(`/learn/next/?mode=${mode}`)
  }
  
  async submitTest(mode: string, answers: string[], correctAnswers: string[]): Promise<{
    score: number
    correct: number
    total: number
    incorrect_answers: Array<{
      question: string
      correct: string
      user_answer: string
    }>
  }> {
    return this.request('/learn/test/', {
      method: 'POST',
      body: JSON.stringify({
        mode,
        answers,
        correct_answers: correctAnswers,
      }),
    })
  }
  
  async brailleOutput(tokens: string[], mode: 'once' | 'chunked' = 'once'): Promise<BrailleResponse> {
    return this.request<BrailleResponse>('/braille/output/', {
      method: 'POST',
      body: JSON.stringify({ tokens, mode }),
    })
  }
}

export const apiService = new ApiService()
