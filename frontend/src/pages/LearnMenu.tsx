import React from "react";
import { useNavigate } from "react-router-dom";
import MobileShell from "../components/MobileShell";
import { useTTS } from "../hooks/useTTS";

export default function LearnMenu() {
  const navigate = useNavigate();
  const { speak } = useTTS();

  const modes = [
    { id: 'char', label: '자모 학습', desc: '한글 자음과 모음 학습' },
    { id: 'word', label: '단어 학습', desc: '기본 단어와 점자 학습' },
    { id: 'sent', label: '문장 학습', desc: '문장 구성과 점자 학습' },
    { id: 'free', label: '자유 변환', desc: '자유로운 텍스트 점자 변환' }
  ];

  const handleModeSelect = (mode: string) => {
    speak(`${modes.find(m => m.id === mode)?.label}를 시작합니다.`);
    navigate(`/learn/${mode}`);
  };

  return (
    <MobileShell title="점자 학습" brailleToggle={true}>
      <div className="space-y-4">
        {modes.map((mode) => (
          <div
            key={mode.id}
            className="card cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleModeSelect(mode.id)}
          >
            <h3 className="h2 mb-2">{mode.label}</h3>
            <p className="text-gray-600 text-sm">{mode.desc}</p>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
