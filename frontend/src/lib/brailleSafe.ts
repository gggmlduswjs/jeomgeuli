// src/lib/brailleSafe.ts - Safe braille cell normalization utilities

export type Cell = [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1];

/**
 * Normalize various cell formats to Cell[]
 * Handles: number[][], boolean[][], {a,b,c,d,e,f}[], etc.
 */
export function normalizeCells(input: any[]): Cell[] {
  if (!Array.isArray(input)) return [];
  
  return input.map((item): Cell => {
    // Already a 6-tuple of numbers
    if (Array.isArray(item) && item.length === 6) {
      return [
        item[0] ? 1 : 0,
        item[1] ? 1 : 0,
        item[2] ? 1 : 0,
        item[3] ? 1 : 0,
        item[4] ? 1 : 0,
        item[5] ? 1 : 0,
      ] as Cell;
    }
    
    // Object with a,b,c,d,e,f properties
    if (item && typeof item === 'object' && 'a' in item) {
      const { a, b, c, d, e, f } = item as any;
      return [
        a ? 1 : 0,
        b ? 1 : 0,
        c ? 1 : 0,
        d ? 1 : 0,
        e ? 1 : 0,
        f ? 1 : 0,
      ] as Cell;
    }
    
    // Number (bitmask 0-63)
    if (typeof item === 'number') {
      const getBit = (n: number) => ((item >> (n - 1)) & 1) ? 1 : 0;
      return [
        getBit(1),
        getBit(2),
        getBit(3),
        getBit(4),
        getBit(5),
        getBit(6),
      ] as Cell;
    }
    
    // Default: empty cell
    return [0, 0, 0, 0, 0, 0];
  });
}

/**
 * Parse bin string array to cells
 * Example: ["100000", "101000"] -> Cell[]
 */
export function binsToCells(bins: string[]): Cell[] {
  if (!Array.isArray(bins)) return [];
  
  return bins.map((bin): Cell => {
    if (typeof bin !== 'string' || bin.length !== 6) {
      return [0, 0, 0, 0, 0, 0];
    }
    
    return [
      bin[0] === '1' ? 1 : 0,
      bin[1] === '1' ? 1 : 0,
      bin[2] === '1' ? 1 : 0,
      bin[3] === '1' ? 1 : 0,
      bin[4] === '1' ? 1 : 0,
      bin[5] === '1' ? 1 : 0,
    ] as Cell;
  });
}

