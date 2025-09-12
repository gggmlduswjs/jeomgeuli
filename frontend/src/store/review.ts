import { create } from 'zustand'

export interface ReviewItem {
  id: string
  type: 'char' | 'word' | 'sent' | 'free'
  korean: string
  braille: string
  description: string
  timestamp: number
  correct: boolean
}

interface ReviewState {
  items: ReviewItem[]
  addReviewItem: (item: Omit<ReviewItem, 'id' | 'timestamp'>) => void
  clearReviewItems: () => void
  removeReviewItem: (id: string) => void
  getIncorrectItems: () => ReviewItem[]
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  items: [],
  addReviewItem: (item) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          ...item,
          id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        }
      ]
    })),
  clearReviewItems: () => set({ items: [] }),
  removeReviewItem: (id) =>
    set((state) => ({
      items: state.items.filter(item => item.id !== id)
    })),
  getIncorrectItems: () => {
    const state = get()
    return state.items.filter(item => !item.correct)
  },
}))
