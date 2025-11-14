import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppShellMobile from "../components/ui/AppShellMobile";
import SpeechBar from "../components/input/SpeechBar";
import useTTS from "../hooks/useTTS";
import useSTT from "../hooks/useSTT";
import useVoiceCommands from "../hooks/useVoiceCommands";

export default function LearnIndex() {
  const navigate = useNavigate();
  const { speak, stop: stopTTS } = useTTS();
  const { start: startSTT, stop: stopSTT, isListening, transcript } = useSTT();

  // 페이지 진입 안내 (원치 않으면 이 useEffect 제거해도 됨)
  useEffect(() => {
    speak("점자 학습 메뉴입니다. 자모, 단어, 문장, 자유 변환 중에서 선택하세요.");
  }, [speak]);

  // 뒤로가기 버튼 클릭 시 홈으로 이동
  const handleBack = () => {
    navigate('/');
  };

  const items = [
    { to: "/learn/char", label: "자모 학습", desc: "한글 자음/모음의 점자 패턴", command: "자모" },
    { to: "/learn/word", label: "단어 학습", desc: "자모 조합으로 단어 학습", command: "단어" },
    { to: "/learn/sentence", label: "문장 학습", desc: "문장 단위 점자 연습", command: "문장" },
    { to: "/learn/free", label: "자유 변환", desc: "임의 텍스트 점자 변환", command: "자유변환" },
    { to: "/review", label: "복습하기", desc: "틀린 문제/키워드 복습", highlight: true, command: "복습" },
  ];

  // 음성 명령 처리
  const { onSpeech } = useVoiceCommands({
    home: () => {
      stopTTS();
      navigate('/');
      stopSTT();
    },
    back: handleBack,
    learn: () => {
      // 이미 학습 메뉴에 있음
      speak("이미 점자 학습 메뉴입니다.");
    },
    // 각 항목 선택
    speak: (text: string) => {
      const normalized = text.toLowerCase().trim();
      // 자모 학습
      if (/(자모|자음|모음)/.test(normalized)) {
        stopTTS();
        navigate('/learn/char');
        stopSTT();
      }
      // 단어 학습
      else if (/(단어|워드)/.test(normalized)) {
        stopTTS();
        navigate('/learn/word');
        stopSTT();
      }
      // 문장 학습
      else if (/(문장|센턴스)/.test(normalized)) {
        stopTTS();
        navigate('/learn/sentence');
        stopSTT();
      }
      // 자유 변환
      else if (/(자유\s*변환|자유변환|변환)/.test(normalized)) {
        stopTTS();
        navigate('/learn/free');
        stopSTT();
      }
      // 복습하기
      else if (/(복습|리뷰|다시\s*보기)/.test(normalized)) {
        stopTTS();
        navigate('/review');
        stopSTT();
      }
    },
  });

  // 음성 명령 처리 (transcript 감지)
  useEffect(() => {
    if (!transcript) return;
    onSpeech(transcript);
  }, [transcript, onSpeech]);

  return (
    <AppShellMobile title="점자 학습" showBackButton onBack={handleBack}>
      <div className="space-y-6 pb-8">
        {/* 음성 명령 표시줄 */}
        <div className="mb-4">
          <SpeechBar isListening={isListening} transcript={transcript} />
        </div>

        <nav
          className="max-w-[560px] mx-auto space-y-3"
          aria-label="학습 카테고리"
        >
          <h2 className="text-xl font-bold mb-4">점자 학습</h2>

        {items.map(({ to, label, desc, highlight }) => (
          <Link
            key={to}
            to={to}
            className={[
              "block rounded-2xl bg-white px-5 py-4 border shadow transition-colors",
              "focus:outline-none focus:ring-4 focus:ring-primary/30",
              highlight ? "border-sky-200 text-sky-700" : "border-border text-fg",
              "hover:bg-card/80",
            ].join(" ")}
            aria-label={`${label} - ${desc}`}
          >
            <div className="font-semibold">{label}</div>
            <div className="text-sm text-secondary mt-0.5">{desc}</div>
          </Link>
        ))}
        </nav>
      </div>
    </AppShellMobile>
  );
}
