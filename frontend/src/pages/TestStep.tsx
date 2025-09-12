import { useMemo, useState } from "react";
import AppShellMobile from "../components/AppShellMobile";
import BottomBar from "../components/BottomBar";
import BraillePanel from "../components/BraillePanel";
import { ensureCells } from "../lib/braille";

// 예시용 더미. 실제로는 학습에서 생성한 퀴즈목록 props로 받아도 됨.
const QUIZ = [
  { answer: "기역", cells: ["100000"] },
  { answer: "니은", cells: ["101000"] },
  { answer: "디귿", cells: ["110000"] },
  { answer: "리을", cells: ["111000"] },
  { answer: "미음", cells: ["101100"] },
];

export default function TestStep() {
  const [i, setI] = useState(0);

  const cur = QUIZ[i];
  const cells = useMemo(() => ensureCells(cur), [cur]);

  const prev = () => setI(v => Math.max(0, v-1));
  const next = () => setI(v => Math.min(QUIZ.length-1, v+1));
  const repeat = () => {
    const u = new SpeechSynthesisUtterance("점자를 촉각으로 확인한 뒤 정답을 말씀해주세요.");
    u.lang = "ko-KR";
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  };

  return (
    <AppShellMobile title="테스트">
      <div className="space-y-6 pb-28">
        <div className="card">점자를 촉각으로 확인한 뒤 정답을 말씀해주세요.</div>
        <div className="card text-center">
          <BraillePanel cells={cells} size={22} />
          <div className="mt-3 text-gray-500">곧 질문합니다</div>
        </div>
        <div className="card">정답: {cur.answer}</div>
      </div>

      <BottomBar onLeft={prev} onMid={repeat} onRight={next} rightLabel={i===QUIZ.length-1?"완료":"다음"} />
    </AppShellMobile>
  );
}
