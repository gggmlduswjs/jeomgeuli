import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AppShellMobile from "../components/ui/AppShellMobile";
import SpeechBar from "../components/input/SpeechBar";
import ToastA11y from "../components/system/ToastA11y";
import { convertBraille, saveReview } from "@/lib/api";
import { useTTS } from "../hooks/useTTS";
import useSTT from "../hooks/useSTT";
import useVoiceCommands from "../hooks/useVoiceCommands";
import { normalizeCells } from "@/lib/brailleSafe";
import { maskToGrid6 } from "@/lib/brailleGrid";
import type { Cell } from "@/lib/brailleMap"; // [0|1,0|1,0|1,0|1,0|1,0|1]

function Dot({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block w-5 h-5 rounded-full mx-0.5 my-0.5 border-2 transition-all duration-200 ${
        on ? "bg-blue-600 border-blue-600 shadow-md" : "bg-gray-100 border-gray-300"
      }`}
    />
  );
}

function CellView({ c }: { c: Cell }) {
  const [a, b, c2, d, e, f] = c || [0, 0, 0, 0, 0, 0];
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        <Dot on={!!a} />
        <Dot on={!!d} />
      </div>
      <div className="flex">
        <Dot on={!!b} />
        <Dot on={!!e} />
      </div>
      <div className="flex">
        <Dot on={!!c2} />
        <Dot on={!!f} />
      </div>
    </div>
  );
}

type Conversion = {
  original: string;
  cells: Cell[];
  bins?: number[]; // 서버가 bins를 주면 이걸로 격자 재계산
  // 서버가 단어/토큰별 세그먼트를 주면 여기에 담아 표시 (옵션)
  segments?: Array<{ original: string; cells: Cell[] }>;
};

export default function FreeConvert() {
  const navigate = useNavigate();
  const { speak, stop: stopTTS } = useTTS();
  const { start: startSTT, stop: stopSTT, isListening, transcript } = useSTT();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputText, setInputText] = useState("");
  const [conversion, setConversion] = useState<Conversion | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 페이지 진입 시 자동 음성 안내
  useEffect(() => {
    const welcomeMessage = '자유 변환 모드입니다. 원하는 텍스트를 입력하면 점자로 변환됩니다.';
    
    const timer = setTimeout(() => {
      speak(welcomeMessage);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [speak]);

  // 뒤로가기 버튼 클릭 시 홈으로 이동
  const handleBack = () => {
    navigate('/');
  };

  const handleConvert = async () => {
    const text = inputText.trim();
    if (!text) {
      setError("변환할 텍스트를 입력하세요.");
      return;
    }

    try {
      setIsConverting(true);
      setError(null);

      // 백엔드 점자 변환 API 사용
      const res = await convertBraille(text);
      console.log('[FreeConvert] API response:', res);
      const raw = (res as any)?.cells ?? res;
      console.log('[FreeConvert] Raw cells:', raw);
      const cells = normalizeCells(raw) as unknown as Cell[];
      console.log('[FreeConvert] Normalized cells:', cells);
      const bins = (res as any)?.bins;

      const next: Conversion = {
        original: text,
        cells,
        bins, // 서버가 bins를 주면 이걸로 격자 재계산
        // 서버가 세그먼트를 응답한다면 아래처럼 파싱해서 넣으세요.
        // segments: (res as any)?.segments?.map((s: any) => ({
        //   original: s.original,
        //   cells: normalizeCells(s.cells) as unknown as Cell[],
        // })),
      };

      setConversion(next);
      speak(`변환 완료. ${text}의 점자 변환이 완료되었습니다.`);
    } catch (e: any) {
      console.error("[FreeConvert] Conversion error:", e);
      setError(e?.message || "점자 변환 중 오류가 발생했습니다.");
      setConversion(null);
    } finally {
      setIsConverting(false);
    }
  };

  const handleEnqueueForReview = async () => {
    if (!conversion) return;
    try {
      setIsEnqueuing(true);
      setError(null);

      // 백엔드에 복습 항목 저장
      const payload = {
        type: "braille",
        content: conversion.original,
        text: conversion.original,
        word: conversion.original,
        cells: conversion.cells,
        bins: conversion.bins,
        segments: conversion.segments,
      };

      const result = await saveReview("keyword", payload);
      
      if (result.ok) {
        // 성공 시 팝업 표시
        const successMessage = `"${conversion.original}"이(가) 복습 목록에 추가되었습니다.`;
        setToastMessage(successMessage);
        setShowToast(true);
        speak(successMessage);
      } else {
        throw new Error("복습 목록 추가 실패");
      }
    } catch (e: any) {
      console.error("Enqueue error:", e);
      const errorMessage = e?.message || "복습 목록 추가 중 오류가 발생했습니다.";
      setError(errorMessage);
      speak(errorMessage);
      setToastMessage(errorMessage);
      setShowToast(true);
    } finally {
      setIsEnqueuing(false);
    }
  };

  const handleRepeat = () => {
    if (!conversion) return;
    // 점자 패턴 자체를 읽는 대신 결과 안내만 자연어로 읽어줍니다.
    speak(`변환 결과. ${conversion.original}의 점자 셀 ${conversion.cells.length}개가 생성되었습니다.`);
  };

  // 음성 명령 처리
  const { onSpeech } = useVoiceCommands({
    home: () => {
      stopTTS();
      navigate('/');
      stopSTT();
    },
    back: handleBack,
    clear: () => {
      setInputText("");
      setError(null);
      setConversion(null);
      speak("입력 내용이 지워졌습니다.");
    },
    submit: () => {
      if (inputText.trim()) {
        handleConvert();
      } else {
        speak("변환할 텍스트를 입력하거나 말해주세요.");
      }
    },
    repeat: () => {
      if (conversion) {
        handleRepeat();
      } else if (inputText.trim()) {
        handleConvert();
      } else {
        speak("변환할 텍스트를 입력하거나 말해주세요.");
      }
    },
  });

  // 음성 명령 처리 (transcript 감지)
  useEffect(() => {
    if (!transcript || !transcript.trim()) return;
    
    const normalized = transcript.toLowerCase().trim();
    const isCommand = /(홈|뒤로|지워|삭제|초기화|전송|제출|확인|반복|다시|변환|홈으로|뒤로가기|이전)/.test(normalized);
    
    if (isCommand) {
      // 명령어인 경우
      onSpeech(transcript);
    } else if (!isListening) {
      // 명령어가 아니고 음성 입력이 끝난 경우 텍스트 추가
      setInputText(prev => {
        const newText = prev.trim() ? prev + ' ' + transcript : transcript;
        return newText;
      });
    }
  }, [transcript, isListening, onSpeech]);

  return (
    <AppShellMobile title="자유 변환" showBackButton onBack={handleBack}>
      <div className="space-y-6 pb-8">
        {/* 음성 명령 표시줄 */}
        <div className="mb-4">
          <SpeechBar isListening={isListening} transcript={transcript} />
        </div>

        {/* 입력 영역 */}
        <div className="card">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">변환할 텍스트</label>
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 border rounded-xl resize-none"
              rows={3}
              placeholder="한글 텍스트를 입력하거나 음성으로 말하세요"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-muted">
                💡 음성 입력: 마이크 버튼을 눌러 음성으로 텍스트를 입력하세요
              </div>
              <button
                type="button"
                onPointerDown={startSTT}
                onPointerUp={stopSTT}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isListening
                    ? 'bg-primary text-white animate-pulse'
                    : 'bg-card text-fg border border-border hover:bg-border'
                }`}
                aria-label="음성 입력"
              >
                {isListening ? '🎤 음성 입력 중...' : '🎤 음성 입력'}
              </button>
            </div>
          </div>

          <button onClick={handleConvert} disabled={isConverting || !inputText.trim()} className="btn-primary w-full">
            {isConverting ? "변환 중..." : "점자로 변환"}
          </button>
        </div>

        {/* 오류 표시 */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <div className="text-red-600">{error}</div>
          </div>
        )}

        {/* 변환 결과 */}
        {conversion && conversion.original && (
          <div className="space-y-4">
            {/* 전체 결과 */}
            <div className="card">
              <div className="text-sm font-semibold text-gray-700 mb-3">전체 변환 결과</div>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800 mb-2">{conversion.original}</div>

                  {/* 간단 텍스트 비주얼 (●/○) */}
                  <div className="text-3xl font-mono text-blue-600 mb-3">
                    {conversion.cells
                      .map((cell) => cell.map((d) => (d ? "●" : "○")).join(""))
                      .join(" ")}
                  </div>

                  {/* 6점 점자 셀 UI - bins 우선 사용 */}
                  <div className="flex flex-wrap justify-center gap-1">
                    {(conversion.bins || []).length > 0 ? (
                      // 서버 응답 { bins: number[] } 사용 권장 (없으면 클라 계산)
                      conversion.bins?.map((mask: any, idx: number) => {
                        const grid = maskToGrid6(mask as any);
                        return (
                          <div className="inline-flex flex-col px-3 py-2 rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow" key={idx}>
                            {grid.map((row, rowIdx) => (
                              <div className="flex" key={rowIdx}>
                                {row.map((on, colIdx) => (
                                  <Dot key={colIdx} on={on} />
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      })
                    ) : (
                      // 폴백: 기존 cells 사용
                      conversion.cells.map((cell, idx) => (
                        <CellView key={idx} c={cell} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 세그먼트별 결과(옵션) */}
            {!!conversion.segments?.length && (
              <div className="card">
                <div className="text-sm font-semibold text-gray-700 mb-3">단어별 변환</div>
                <div className="space-y-3">
                  {conversion.segments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-gray-800">{segment.original}</div>
                        <div className="text-sm text-gray-500">클릭하여 듣기</div>
                      </div>
                      <button
                        onClick={() => speak(`${segment.original} 변환 결과가 준비되었습니다.`)}
                        className="flex items-center gap-2 bg-white hover:bg-gray-100 px-3 py-2 rounded-lg border transition-colors"
                      >
                        <div className="flex gap-1">
                          {segment.cells.map((cell, idx) => (
                            <CellView key={idx} c={cell} />
                          ))}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleRepeat} className="btn-dark">
                다시 듣기
              </button>

              <button onClick={handleEnqueueForReview} disabled={isEnqueuing} className="btn-primary">
                {isEnqueuing ? "추가 중..." : "복습하기"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 토스트 알림 */}
      <ToastA11y
        message={toastMessage}
        isVisible={showToast}
        duration={3000}
        onClose={() => setShowToast(false)}
        position="top"
      />
    </AppShellMobile>
  );
}
