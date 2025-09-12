import React, { useRef, useState } from "react";

type Props = { 
  onResult?: (text: string) => void;
  className?: string;
};

export default function MicButton({ onResult, className = "" }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef<SpeechRecognition | null>(null);

  const start = () => {
    // Web Speech API 지원 확인
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported");
      onResult?.("");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ko-KR";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      recognition.onstart = () => {
        setListening(true);
        setTranscript("");
      };

      recognition.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript || "";
        setTranscript(text);
        setListening(false);
        onResult?.(text);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setListening(false);
        setTranscript("");
      };

      recognition.onend = () => {
        setListening(false);
      };

      recRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.warn("Failed to start speech recognition:", error);
      setListening(false);
      onResult?.("");
    }
  };

  const stop = () => {
    if (recRef.current) {
      recRef.current.stop();
    }
    setListening(false);
  };

  const handleClick = () => {
    if (listening) {
      stop();
    } else {
      start();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-16 h-16 rounded-full bg-accent text-primary flex items-center justify-center shadow-lg hover:shadow-xl transition-all ${className}`}
      disabled={listening && !recRef.current}
    >
      {listening ? (
        <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse" />
      ) : (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      )}
    </button>
  );
}