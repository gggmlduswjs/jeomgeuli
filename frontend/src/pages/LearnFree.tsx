import React, { useState } from "react";
import BraillePanel from "../components/BraillePanel";
import { ensureCells } from "../lib/braille";
import { speakKo } from "../hooks/useTTS";
import useSTT from "../hooks/useSTT";

export default function LearnFree() {
  const [text, setText] = useState("");
  const { listening, start, result } = useSTT();

  // STT 결과를 텍스트에 반영
  React.useEffect(() => {
    if (result) {
      setText(result);
    }
  }, [result]);

  const onMic = async () => {
    speakKo("말씀해 주세요.");
    start();
  };

  return (
    <main className="min-h-[100dvh] bg-gray-50">
      <header className="bg-[#0b1627] text-white">
        <div className="max-w-xl mx-auto px-5 py-4 text-xl font-extrabold">자유 변환</div>
      </header>

      <section className="max-w-xl mx-auto px-5 py-6 pb-32 space-y-6">
        <div className="card">
          <input
            className="w-full p-3 border rounded-lg"
            placeholder="문장을 입력하거나 마이크를 사용하세요."
            value={text}
            onChange={e=>setText(e.target.value)}
          />
          <div className="mt-6 flex justify-center">
            <BraillePanel cells={ensureCells({ pattern: text })} size={22} />
          </div>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" onClick={onMic}>
            {listening ? "인식 중..." : "🎤 음성 입력"}
          </button>
          <button className="btn-secondary" onClick={()=>speakKo(text)}>
            ▶ 읽어주기
          </button>
        </div>

        {text && (
          <div className="card">
            <div className="text-sm text-gray-600 mb-2">입력된 텍스트:</div>
            <div className="text-lg">{text}</div>
          </div>
        )}
      </section>
    </main>
  );
}