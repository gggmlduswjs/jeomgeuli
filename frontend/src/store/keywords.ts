import { create } from 'zustand'

interface KeywordsState {
  keywords: string[]
  addKeywords: (keywords: string[]) => void
  clearKeywords: () => void
  removeKeyword: (keyword: string) => void
}

export const useKeywordsStore = create<KeywordsState>((set) => ({
  keywords: [],
  addKeywords: (keywords) => 
    set((state) => ({
      keywords: [...new Set([...state.keywords, ...keywords])]
    })),
  clearKeywords: () => set({ keywords: [] }),
  removeKeyword: (keyword) =>
    set((state) => ({
      keywords: state.keywords.filter(k => k !== keyword)
    })),
}))
