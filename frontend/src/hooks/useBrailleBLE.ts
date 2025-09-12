// Optional: Real device write — keep as no-op fallback for now.
export default function useBrailleBLE() {
  const connect = async () => {/* TODO: navigator.bluetooth.requestDevice(...) */};
  const sendCells = async (cells: boolean[][]) => {/* TODO: pack to bytes 0x02 b1 b2 b3 checksum 0x03 */};
  return { connect, sendCells };
}
