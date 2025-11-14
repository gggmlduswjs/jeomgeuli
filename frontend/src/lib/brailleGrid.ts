// src/lib/brailleGrid.ts - Braille grid utilities

/**
 * Convert a bitmask (0-63) to a 2x3 grid representation
 * Returns a 2x3 array where true means dot is raised
 */
export function maskToGrid6(mask: number | string): boolean[][] {
  let num: number;
  if (typeof mask === 'string') {
    // Parse binary string like "100000"
    if (mask.length === 6) {
      return [
        [mask[0] === '1', mask[3] === '1'],
        [mask[1] === '1', mask[4] === '1'],
        [mask[2] === '1', mask[5] === '1'],
      ];
    }
    num = parseInt(mask, 10);
  } else {
    num = mask;
  }
  
  // Standard 2x3 braille grid (column-major order)
  // Positions: 1 4
  //             2 5
  //             3 6
  const getBit = (pos: number) => ((num >> (pos - 1)) & 1) === 1;
  
  return [
    [getBit(1), getBit(4)],
    [getBit(2), getBit(5)],
    [getBit(3), getBit(6)],
  ];
}

