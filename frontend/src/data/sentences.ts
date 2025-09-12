// frontend/src/data/sentences.ts
// 문장 학습 폴백 데이터 (tts는 문자열로 통일)
export default {
  items: [
    {
      id: "s1",
      sentence: "오늘 날씨가 맑다.",
      tts: "오늘 날씨가 맑다 문장을 학습합니다. 세 글자씩 읽겠습니다.",
      chunks: ["오늘 ", "날씨가 ", "맑다."],
    },
    {
      id: "s2",
      sentence: "나는 학생이다.",
      tts: "나는 학생이다 문장을 학습합니다.",
      chunks: ["나는 ", "학생이다."],
    },
    {
      id: "s3",
      sentence: "책을 읽습니다.",
      tts: "책을 읽습니다 문장을 학습합니다.",
      chunks: ["책을 ", "읽습니다."],
    },
    {
      id: "s4",
      sentence: "안녕하세요.",
      tts: "안녕하세요 문장을 학습합니다.",
      chunks: ["안녕", "하세요."],
    },
  ],
};
