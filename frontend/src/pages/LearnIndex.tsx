import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppShellMobile from "../components/ui/AppShellMobile";
import SpeechBar from "../components/input/SpeechBar";
import useTTS from "../hooks/useTTS";
import useSTT from "../hooks/useSTT";
import useVoiceCommands, { RecognitionResult } from "../hooks/useVoiceCommands";
import { useVoiceStore } from '../store/voice';
import { correctMisrecognition } from '../lib/voice/MisrecognitionMap';
import VoiceFeedbackService from '../services/VoiceFeedbackService';

export default function LearnIndex() {
  const navigate = useNavigate();
  const location = useLocation();
  const { speak, stop: stopTTS } = useTTS();
  const { start: startSTT, stop: stopSTT, isListening, transcript, alternatives } = useSTT();

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
    // learn 핸들러 제거 - Home에서만 처리하도록
    // 각 항목 선택 (더 유연한 매칭 - Alternatives 활용, 최적화)
    speak: (text: string, alts?: RecognitionResult[]) => {
      // 매칭 함수 분리 (재사용)
      const matchAndNavigate = (candidateText: string, confidence: number = 1.0): boolean => {
        const normalized = correctMisrecognition(candidateText.toLowerCase().trim());
        
        // 자모 학습
        if (/(자모|자음|모음|자무|참호|참오|잠오|사모)/.test(normalized) || 
            normalized.startsWith('자') || 
            normalized.includes('자모') || 
            normalized.includes('자음') || 
            normalized.includes('모음') ||
            (normalized.includes('자') && normalized.length <= 4) ||
            (normalized.length <= 2 && normalized[0] === '자')) {
          if (normalized !== '자모' && candidateText !== '자모') {
            VoiceFeedbackService.logMisrecognition(
              candidateText,
              '자모',
              location.pathname,
              confidence
            );
          }
          stopTTS();
          navigate('/learn/char');
          stopSTT();
          return true;
        }
        
        // 단어 학습
        if (/(단어|워드|다워|다오|암호)/.test(normalized) || 
            normalized.startsWith('단') || 
            normalized.startsWith('다') ||
            normalized.includes('단어') ||
            normalized.includes('다워') ||
            normalized.includes('암호') ||
            (normalized.length <= 2 && (normalized[0] === '단' || normalized[0] === '다'))) {
          stopTTS();
          navigate('/learn/word');
          stopSTT();
          return true;
        }
        
        // 문장 학습
        if (/(문장|센턴스)/.test(normalized) || 
            normalized.startsWith('문') || 
            normalized.includes('문장') ||
            (normalized.length <= 2 && normalized[0] === '문')) {
          stopTTS();
          navigate('/learn/sentence');
          stopSTT();
          return true;
        }
        
        // 자유 변환
        if (/(자유\s*변환|자유변환|변환|점자변환|점자\s*변환|편환)/.test(normalized) || 
            normalized.includes('변환') || 
            normalized.includes('자유') ||
            normalized.includes('편환')) {
          stopTTS();
          navigate('/learn/free');
          stopSTT();
          return true;
        }
        
        // 복습하기
        if (/(복습|리뷰|다시\s*보기|다시보기)/.test(normalized) || 
            normalized.startsWith('복') || 
            normalized.includes('복습') || 
            normalized.includes('리뷰') ||
            normalized.includes('다시') ||
            (normalized.length <= 2 && normalized[0] === '복')) {
          stopTTS();
          navigate('/review');
          stopSTT();
          return true;
        }
        
        return false;
      };
      
      // 기본 텍스트를 먼저 시도 (가장 빠름 - 대부분의 경우 여기서 매칭됨)
      if (matchAndNavigate(text, 1.0)) {
        return;
      }
      
      // 기본 텍스트에서 매칭 안 되면 alternatives 시도 (confidence 높은 순)
      if (alts && alts.length > 0) {
        const sorted = [...alts].sort((a, b) => b.confidence - a.confidence);
        for (const alt of sorted) {
          if (matchAndNavigate(alt.transcript, alt.confidence)) {
            return;
          }
        }
      }
    },
  });

  // 음성 명령 처리 (transcript 감지 - Alternatives 활용)
  useEffect(() => {
    if (!transcript) return;
    // alternatives를 함께 전달하여 confidence 기반 필터링
    onSpeech(transcript, alternatives, location.pathname);
    // 처리 후 transcript 초기화 - 이전 페이지의 transcript가 남지 않도록
    useVoiceStore.getState().resetTranscript();
  }, [transcript, alternatives, onSpeech, location.pathname]);

  return (
    <AppShellMobile title="점자 학습" showBackButton onBack={handleBack}>
      <div className="space-y-4 pb-6">
        {/* 음성 명령 표시줄 */}
        <div className="mb-3">
          <SpeechBar isListening={isListening} transcript={transcript} />
        </div>

        <nav
          className="w-full md:max-w-[560px] md:mx-auto space-y-2"
          aria-label="학습 카테고리"
        >
          <h2 className="text-lg font-bold mb-2">점자 학습</h2>

        {items.map(({ to, label, desc, highlight, command }) => (
          <div
            key={to}
            className={[
              "block rounded-2xl bg-white px-5 py-2 border shadow transition-colors",
              highlight ? "border-sky-200 text-sky-700" : "border-border text-fg",
              "pointer-events-none", // 터치 이벤트 차단
            ].join(" ")}
            aria-label={`${label} - ${desc} (음성으로 "${command}"라고 말하세요)`}
            role="button"
            tabIndex={-1}
          >
            <div className="font-semibold text-base">{label}</div>
            <div className="text-sm text-secondary mt-0.5">{desc}</div>
            <div className="text-xs text-muted mt-1.5">💬 "{command}"라고 말하세요</div>
          </div>
        ))}
        </nav>
      </div>
    </AppShellMobile>
  );
}
