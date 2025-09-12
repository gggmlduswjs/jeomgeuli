export function speakKo(text: string) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text || "");
    u.lang = "ko-KR";
    window.speechSynthesis.speak(u);
  } catch {}
}

export function useTTS() {
  const speak = (payload: string | string[]) => {
    try {
      window.speechSynthesis.cancel();
      const list = Array.isArray(payload) ? payload : [payload];
      
      list.forEach((line, idx) => {
        if (!line) return;
        const utterance = new SpeechSynthesisUtterance(line);
        utterance.lang = "ko-KR";
        
        // Add a small delay between utterances for better flow
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, idx * 100);
      });
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  const cancel = () => {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn("TTS cancel error:", e);
    }
  };

  const pause = () => {
    try {
      window.speechSynthesis.pause();
    } catch (e) {
      console.warn("TTS pause error:", e);
    }
  };

  const resume = () => {
    try {
      window.speechSynthesis.resume();
    } catch (e) {
      console.warn("TTS resume error:", e);
    }
  };

  return { speak, cancel, pause, resume };
}

export default useTTS;