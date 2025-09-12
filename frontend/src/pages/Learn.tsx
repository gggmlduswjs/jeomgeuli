import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShellMobile from "../components/AppShellMobile";
import BottomBar from "../components/BottomBar";
import MicButton from "../components/MicButton";
import { fetchChars } from "../lib/api";
import useVoiceCommands from "../hooks/useVoiceCommands";
// 점자 출력 훅을 쓰는 경우만 활성화하세요
// import useBraille from "../hooks/useBraille";

export default function Learn() {
  const navigate = useNavigate();

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chars, setChars] = useState<any[]>([]);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // const { output: brailleOut } = useBraille(); // 점자 출력 사용 시

  /** TTS: 문자열/배열 모두 안전하게 */
  const speak = (textOrList?: string | string[]) => {
    if (!textOrList) return;
    try {
      window.speechSynthesis.cancel();

      const list = Array.isArray(textOrList) ? textOrList : [textOrList];
      const joined = list.filter(Boolean).join(" ");
      if (!joined) return;

      const u = new SpeechSynthesisUtterance(joined);
      u.lang = "ko-KR";
      // 필요하면 속도/피치 조절
      // u.rate = 1.0; u.pitch = 1.0;
      u.onerror = () => {};
      u.onend = () => {};
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn("TTS error:", e);
    }
  };

  /** 데이터 로딩 */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetchChars(); // { items: any[] }
        if (!mounted) return;

        const items = Array.isArray(res?.items) ? res.items : [];
        setChars(items);
        if (!items.length) {
          setError("학습 데이터를 불러올 수 없습니다.");
        } else {
          setI(0);
          setPaused(false);
        }
      } catch (e) {
        if (mounted) setError("학습 데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
      window.speechSynthesis.cancel();
    };
  }, []);

  const current = chars[i];

  /** 명령 */
  const prev = () => setI(v => Math.max(0, v - 1));
  const next = () => {
    setPaused(false);
    setI(v => {
      const nextIdx = Math.min(chars.length - 1, v + 1);
      // 마지막 다음 → 인덱스로 이동
      if (nextIdx === v && v === chars.length - 1) {
        navigate("/learn");
      }
      return nextIdx;
    });
  };
  const repeat = () => current?.tts && speak(current.tts);
  const pause = () => {
    window.speechSynthesis.cancel();
    setPaused(true);
  };
  const start = () => {
    setPaused(false);
    repeat();
  };

  const { onSpeech } = useVoiceCommands({ next, prev, repeat, pause, start });

  /** 현재 아이템 바뀔 때 자동 낭독 + 점자 출력 */
  useEffect(() => {
    if (!current) return;
    if (!paused) speak(current.tts);

    // 점자 출력 사용 시
    // try { if (current.char) brailleOut(current.char); } catch {}
  }, [i, paused, current /*, brailleOut*/]);

  /** 로딩/에러/무자료 처리 */
  if (isLoading) {
    return (
      <AppShellMobile title="자모 학습">
        <div className="space-y-5 pb-32">
          <div className="card text-center">
            <div className="text-ink-500">학습 내용을 불러오는 중...</div>
          </div>
        </div>
      </AppShellMobile>
    );
  }
  if (error) {
    return (
      <AppShellMobile title="자모 학습">
        <div className="space-y-5 pb-32">
          <div className="card text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <button onClick={() => window.location.reload()} className="btn-primary">
              다시 시도
            </button>
          </div>
        </div>
      </AppShellMobile>
    );
  }
  if (!current) {
    return (
      <AppShellMobile title="자모 학습">
        <div className="space-y-5 pb-32">
          <div className="card text-center">
            <div className="text-ink-500">학습할 내용이 없습니다.</div>
          </div>
        </div>
      </AppShellMobile>
    );
  }

  const isLast = i === chars.length - 1;

  return (
    <AppShellMobile title="자모 학습">
      <div className="space-y-5 pb-32">
        {/* 진행률 */}
        <div className="card flex items-center justify-between">
          <div className="text-ink-500">안내</div>
          <div className="text-sm text-gray-500">
            {i + 1} / {chars.length}
          </div>
        </div>

        {/* 안내 TTS 텍스트(시각 표시) */}
        <div className="card">
          <div className="text-lg">
            {Array.isArray(current.tts) ? current.tts.join(" ") : current.tts}
          </div>
        </div>

        {/* 글자 박스 */}
        <div className="card text-center">
          <div className="text-6xl font-bold text-primary mb-4">{current.char}</div>
          <div className="text-gray-600 mb-2">{current.name}</div>
          <div className="text-sm text-gray-500">{current.type || "자모"}</div>
        </div>

        {/* 음성 명령 마이크 */}
        <div className="flex justify-center pt-4">
          <MicButton onResult={onSpeech} />
        </div>
      </div>

      <BottomBar
        onLeft={prev}
        onMid={repeat}
        onRight={next}
        rightLabel={isLast ? "완료" : "다음"}
      />
    </AppShellMobile>
  );
}
