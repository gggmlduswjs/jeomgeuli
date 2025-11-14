// src/lib/braille.ts - Local braille conversion utilities

/**
 * Convert text to braille cells locally (fallback when API is unavailable)
 * Returns boolean[][] where each inner array represents a 6-dot braille cell
 * 
 * This is a simplified implementation. For full Korean braille support,
 * use the server API convertBraille function.
 */
export function localToBrailleCells(text: string): boolean[][] {
  if (!text) return [];
  
  // Simple fallback: return empty cells for now
  // In a full implementation, this would use a local braille mapping table
  // For now, return one empty cell per character as a placeholder
  return text.split('').map(() => [false, false, false, false, false, false]);
}

