import React, { useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import { convertToBraille, enqueueReview } from "../lib/api";
import { useTTS } from "../hooks/useTTS";
import { localToBrailleCells } from "../lib/braille";
import type { Cell } from "../lib/braille";

function Dot({ on }: { on: boolean }) {
  return (
    <span 
      className={`inline-block w-5 h-5 rounded-full mx-0.5 my-0.5 border-2 transition-all duration-200 ${
        on 
          ? "bg-blue-600 border-blue-600 shadow-md" 
          : "bg-gray-100 border-gray-300"
      }`} 
    />
  );
}

function CellView({ c }: { c: Cell }) {
  const [a,b,c2,d,e,f] = c || [0,0,0,0,0,0];
  return (
    <div className="inline-flex flex-col px-3 py-2 rounded-lg border-2 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex">
        <Dot on={!!a}/>
        <Dot on={!!d}/>
      </div>
      <div className="flex">
        <Dot on={!!b}/>
        <Dot on={!!e}/>
      </div>
      <div className="flex">
        <Dot on={!!c2}/>
        <Dot on={!!f}/>
      </div>
    </div>
  );
}

export default function FreeConvert() {
  const { speak } = useTTS();
  
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
    }
  };

  const handleSegmentOutput = (segment: any) => {
    speak(`${segment.original}은 점자로 ${segment.braille}입니다.`);
  };

  return (
    <AppShellMobile title="자유 변환">
      <div className="space-y-6 pb-32">
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
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800 mb-2">{conversion.original}</div>
                  <div className="text-3xl font-mono text-blue-600 mb-3">{conversion.full_braille}</div>
                  <div className="flex flex-wrap justify-center gap-1">
                    {localToBrailleCells(conversion.original).map((cell, idx) => (
                      <CellView key={idx} c={cell} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 세그먼트별 결과 */}
            {conversion.segments && conversion.segments.length > 0 && (
              <div className="card">
                <div className="text-sm font-semibold text-gray-700 mb-3">단어별 변환</div>
                <div className="space-y-3">
                  {conversion.segments.map((segment: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-gray-800">{segment.original}</div>
                        <div className="text-sm text-gray-500">클릭하여 듣기</div>
                      </div>
                      <button
                        onClick={() => handleSegmentOutput(segment)}
                        className="flex items-center gap-2 bg-white hover:bg-gray-100 px-3 py-2 rounded-lg border transition-colors"
                      >
                        <span className="text-xl font-mono text-blue-600">{segment.braille}</span>
                        <div className="flex gap-1">
                          {localToBrailleCells(segment.original).map((cell, idx) => (
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
    </AppShellMobile>
  );
}
