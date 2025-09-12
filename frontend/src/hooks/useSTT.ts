import { useCallback, useEffect, useRef, useState } from "react";

export default function useSTT({ lang="ko-KR" }={}) {
  const recRef = useRef<SpeechRecognition|null>(null);
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const r: SpeechRecognition = new SR();
    r.lang = lang;
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[0][0].transcript.trim();
      setResult(t);
    };
    r.onend = () => setListening(false);
    recRef.current = r;
  }, [lang]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setResult("");
    setListening(true);
    try { recRef.current.start(); } catch {}
  }, []);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
  }, []);

  return { listening, result, start, stop, setResult };
}