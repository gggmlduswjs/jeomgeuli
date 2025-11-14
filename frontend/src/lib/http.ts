// src/lib/http.ts - HTTP utilities and base API configuration

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiBase = API_BASE;
export const http = {
  get: async (path: string, options?: RequestInit) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },
  post: async (path: string, body?: any, options?: RequestInit) => {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const error: any = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    return response.json();
  },
};

export const api = http;

