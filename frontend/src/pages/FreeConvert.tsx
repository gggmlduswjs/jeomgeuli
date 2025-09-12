import React, { useState } from "react";
import MobileShell from "../components/MobileShell";
import { convertToBraille, enqueueReview } from "../lib/api";
import { useTTS } from "../hooks/useTTS";
import { useBraille } from "../hooks/useBraille";

export default function FreeConvert() {
  const { speak } = useTTS();
  const { output } = useBraille();
  
  const [inputText, setInputText] = useState("");
  const [conversion, setConversion] = useState<any>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!inputText.trim()) {
      setError("변환할 텍스트를 입력하세요.");
      return;
    }

    try {
      setIsConverting(true);
      setError(null);
      const result = await convertToBraille(inputText);
      setConversion(result);
      
      // TTS로 변환 결과 읽기
      speak(`변환 완료. ${result.original}은 점자로 ${result.full_braille}입니다.`);
      
      // 점자 출력
      output(result.full_braille);
    } catch (e) {
      setError("점자 변환 중 오류가 발생했습니다.");
      console.error("Conversion error:", e);
    } finally {
      setIsConverting(false);
    }
  };

  const handleEnqueueForReview = async () => {
    if (!conversion) return;

    try {
      setIsEnqueuing(true);
      await enqueueReview('braille', {
        text: conversion.original,
        braille: conversion.full_braille,
        segments: conversion.segments
      }, 'free_convert');
      
      speak("복습 목록에 추가되었습니다.");
    } catch (e) {
      setError("복습 목록 추가 중 오류가 발생했습니다.");
      console.error("Enqueue error:", e);
    } finally {
      setIsEnqueuing(false);
    }
  };

  const handleRepeat = () => {
    if (conversion) {
      speak(`변환 결과. ${conversion.original}은 점자로 ${conversion.full_braille}입니다.`);
      output(conversion.full_braille);
    }
  };

  const handleSegmentOutput = (segment: any) => {
    speak(`${segment.original}은 점자로 ${segment.braille}입니다.`);
    output(segment.braille);
  };

  return (
    <MobileShell title="자유 변환" brailleToggle={true}>
      <div className="space-y-6">
        {/* 입력 영역 */}
        <div className="card">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              변환할 텍스트
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 border rounded-xl resize-none"
              rows={3}
              placeholder="한글 텍스트를 입력하세요"
            />
          </div>
          
          <button
            onClick={handleConvert}
            disabled={isConverting || !inputText.trim()}
            className="btn-primary w-full"
          >
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
        {conversion && (
          <div className="space-y-4">
            {/* 전체 결과 */}
            <div className="card">
              <div className="text-sm font-semibold text-gray-700 mb-3">전체 변환 결과</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{conversion.original}</span>
                  <span className="text-2xl font-mono">{conversion.full_braille}</span>
                </div>
              </div>
            </div>

            {/* 세그먼트별 결과 */}
            {conversion.segments && conversion.segments.length > 0 && (
              <div className="card">
                <div className="text-sm font-semibold text-gray-700 mb-3">단어별 변환</div>
                <div className="space-y-2">
                  {conversion.segments.map((segment: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-base">{segment.original}</span>
                      <button
                        onClick={() => handleSegmentOutput(segment)}
                        className="text-xl font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                      >
                        {segment.braille}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRepeat}
                className="btn-dark"
              >
                다시 듣기
              </button>
              
              <button
                onClick={handleEnqueueForReview}
                disabled={isEnqueuing}
                className="btn-primary"
              >
                {isEnqueuing ? "추가 중..." : "복습하기"}
              </button>
            </div>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
