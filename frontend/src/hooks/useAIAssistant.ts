export async function useAIAssistant(q: string) {
  // Mock implementation - in real app, call actual AI API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    mode: "news",
    cards: [
      { title: "경제", desc: "경제 상황 안정", url: "#" },
      { title: "물가", desc: "물가 상승률 완화", url: "#" }
    ],
    keywords: ["경제", "물가", "정부"]
  };
}