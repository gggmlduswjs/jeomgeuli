// src/lib/api.ts - API functions

import { http, apiBase } from './http';

export const API_BASE = apiBase;

// Types
export interface ChatResponse {
  answer: string;
  keywords?: string[];
  ok?: boolean;
  error?: string;
}

export interface ExploreResponse {
  answer: string;
  news: any[];
  query: string;
  ok?: boolean;
  error?: string;
}

export interface BrailleConvertResponse {
  cells: number[][];
  ok?: boolean;
  error?: string;
}

export interface LearnResponse {
  mode?: string;
  title?: string;
  items: any[];
  ok?: boolean;
}

// Chat API
export async function askChat(query: string): Promise<ChatResponse> {
  const response = await http.post('/chat/ask/', { query });
  return {
    answer: response.answer || '',
    keywords: response.keywords || [],
    ok: response.ok !== false,
  };
}

export async function askChatWithKeywords(query: string): Promise<ChatResponse> {
  return askChat(query);
}

// Explore API
export async function fetchExplore(query: string): Promise<ExploreResponse> {
  const response = await http.post('/explore/', { query });
  return {
    answer: response.answer || '',
    news: response.news || [],
    query: response.query || query,
    ok: response.ok !== false,
  };
}

// Braille API
export async function convertBraille(
  text: string,
  _mode?: string
): Promise<BrailleConvertResponse> {
  try {
    // POST 요청으로 /api/braille/convert/ 호출
    const response = await http.post('/braille/convert/', { text });
    return {
      cells: response.cells || [],
      ok: response.ok !== false,
    };
  } catch (error: any) {
    // 404 에러인 경우 /api/convert/로 fallback (레거시 호환)
    if (error?.status === 404 || error?.message?.includes('404')) {
      try {
        const fallbackResponse = await http.post('/convert/', { text });
        return {
          cells: fallbackResponse.cells || [],
          ok: fallbackResponse.ok !== false,
        };
      } catch (fallbackError) {
        return {
          cells: [],
          ok: false,
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
        };
      }
    }
    return {
      cells: [],
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Learn API
export async function fetchLearn(mode: string): Promise<LearnResponse> {
  const modeMap: Record<string, string> = {
    char: 'chars',
    word: 'words',
    sentence: 'sentences',
    keyword: 'keywords',
  };
  
  const endpoint = modeMap[mode] || mode;
  const response = await http.get(`/learn/${endpoint}/`);
  
  // Handle different response formats
  if (response.items) {
    return {
      mode: response.mode || mode,
      items: response.items,
      ok: response.ok !== false,
    };
  }
  
  // If response is directly an array or has mode/items structure
  return {
    mode: response.mode || mode,
    items: Array.isArray(response) ? response : response.items || [],
    ok: response.ok !== false,
  };
}

// Review/Learning API
export async function saveReview(
  kind: 'wrong' | 'keyword',
  payload: any
): Promise<{ ok: boolean }> {
  const response = await http.post('/learning/save/', { kind, payload });
  return { ok: response.ok !== false };
}

// Health API
export async function health(): Promise<{ ok: boolean }> {
  try {
    const response = await http.get('/health/');
    return { ok: response.ok !== false };
  } catch {
    return { ok: false };
  }
}

// Utility function to normalize answer text
export function normalizeAnswer(response: ChatResponse | null | undefined): string {
  if (!response) return '';
  return response.answer || '';
}

