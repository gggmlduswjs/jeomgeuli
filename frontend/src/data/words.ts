// frontend/src/data/words.ts
// 단어 학습 폴백 데이터 (tts는 문자열로 통일)
export default {
  items: [
    { id: "school", word: "학교", tts: "학교. 학은 ㅎ+ㅏ+ㄱ, 교는 ㄱ+ㅛ 입니다.", parts: ["학","교"] },
    { id: "friend", word: "친구", tts: "친구. 친은 ㅊ+ㅣ+ㄴ, 구는 ㄱ+ㅜ 입니다.", parts: ["친","구"] },
    { id: "mom",    word: "엄마", tts: "엄마 라는 단어를 학습합니다.", parts: ["엄","마"] },
    { id: "dad",    word: "아빠", tts: "아빠 라는 단어를 학습합니다.", parts: ["아","빠"] },
    { id: "desk",   word: "책상", tts: "책상. 책 과 상 으로 나누어 학습합니다.", parts: ["책","상"] },
    { id: "pencil", word: "연필", tts: "연필. 연 과 필 로 구성됩니다.", parts: ["연","필"] },
    { id: "love",   word: "사랑", tts: "사랑 이라는 단어를 학습합니다.", parts: ["사","랑"] },
    { id: "sea",    word: "바다", tts: "바다 라는 단어를 학습합니다.", parts: ["바","다"] },
    { id: "tree",   word: "나무", tts: "나무 라는 단어를 학습합니다.", parts: ["나","무"] },
    { id: "star",   word: "별",   tts: "별, 한 글자 단어를 학습합니다.", parts: ["별"] },
  ],
};
