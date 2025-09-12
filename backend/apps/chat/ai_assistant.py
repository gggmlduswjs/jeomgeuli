"""
AI Assistant for visually impaired users
Provides structured responses with keyword extraction for braille output
"""

import json
import re
from typing import Dict, List, Optional, Any
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import google.generativeai as genai
import os

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

class AIAssistantProcessor:
    """Processes queries for visually impaired users with structured responses"""
    
    def __init__(self):
        self.prompt_template = """
당신은 시각장애인 친화 모바일 PWA의 대화형 AI 어시스턴트입니다.

목표: (1) 짧고 선명한 대답, (2) 쉬운 한국어 요약/설명, (3) 핵심 키워드 2~3개 추출 → 점자셀 출력/학습 연동.

규칙:
- 말투: 또렷하고 친절하게. 한 화면에 2~4문장(모바일 기준).
- 항상 "핵심 키워드 2~3개"를 뽑아 준다(명사 위주, 1~3글자 선호).
- 뉴스/개념 설명/일반 Q&A 모두 동일한 구조(본문 → 쉬운말 1줄 → 키워드).
- 점자 규정 준수(6점식). 한글 풀어쓰기 원칙, 첫소리 'ㅇ'은 표기 생략, 된소리는 된소리표 후 원 자음 표기.
- 안전/민감 정보는 회피하고, 출처가 필요한 사실은 "간단 근거"를 말로 덧붙인다.

응답 형식 (JSON만 반환):
{{
  "mode": "{mode}",
  "chat_markdown": "모바일에 보일 본문(마크다운 가능). 2~4문장. 번호/불릿 OK.",
  "simple_tts": "한 줄 쉬운말 요약(음성 낭독용, 20~40자).",
  "keywords": ["키워드1","키워드2","키워드3"],
  "braille_words": ["키워드1","키워드2","키워드3"],
  "actions": {{
    "voice_hint": "예: '다음', '반복', '학습하기', '점자 출력 켜'",
    "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
  }},
  "meta": {{
    "source_hint": "필요시 짧은 근거/출처 설명(한 줄)"
  }}
}}

스타일:
- news(뉴스 요약): 3~5개 불릿 핵심 → 한 줄 쉬운말 → 키워드 2~3.
- explain(쉬운 설명): 개념을 3~4 불릿로 단계화, 마지막 줄에 '쉽게 말해…' 비유 1개.
- qa(일반 질의응답): 직접 답 + 필요한 경우 예시 1개 + 주의/한계 1줄.

사용자 질문: {query}
모드: {mode}
"""

    def process_query(self, query: str, mode: str = "qa") -> Dict[str, Any]:
        """Process user query and return structured AI response"""
        try:
            # Create prompt with mode-specific instructions
            prompt = self.prompt_template.format(query=query, mode=mode)
            
            # Get response from Gemini
            response = model.generate_content(prompt)
            
            # Parse JSON response
            try:
                ai_response = json.loads(response.text)
                return self.validate_response(ai_response, mode)
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return self.create_fallback_response(query, mode, response.text)
                
        except Exception as e:
            print(f"AI Assistant error: {e}")
            return self.create_error_response(query, mode)

    def validate_response(self, response: Dict[str, Any], mode: str) -> Dict[str, Any]:
        """Validate and clean AI response"""
        # Ensure required fields
        if "keywords" not in response:
            response["keywords"] = self.extract_keywords(response.get("chat_markdown", ""))
        
        if "braille_words" not in response:
            response["braille_words"] = response["keywords"]
        
        if "actions" not in response:
            response["actions"] = {
                "voice_hint": "'다음', '반복', '학습하기'",
                "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
            }
        
        if "meta" not in response:
            response["meta"] = {}
        
        # Ensure mode is correct
        response["mode"] = mode
        
        # Limit keywords to 3
        response["keywords"] = response["keywords"][:3]
        response["braille_words"] = response["braille_words"][:3]
        
        return response

    def extract_keywords(self, text: str) -> List[str]:
        """Extract 2-3 key nouns from text (1-3 characters preferred for braille)"""
        # Extract Korean words
        words = re.findall(r'[가-힣]{1,3}', text)
        
        # Filter meaningful words (avoid particles, common words)
        meaningful_words = [
            word for word in words 
            if len(word) >= 2 and word not in [
                "것이", "하는", "있는", "되는", "입니다", "하고", "에서", "으로", "에서", "에게"
            ]
        ]
        
        return list(set(meaningful_words))[:3]  # Remove duplicates and limit to 3

    def create_fallback_response(self, query: str, mode: str, raw_text: str) -> Dict[str, Any]:
        """Create fallback response when JSON parsing fails"""
        keywords = self.extract_keywords(raw_text)
        
        return {
            "mode": mode,
            "chat_markdown": raw_text[:200] + "..." if len(raw_text) > 200 else raw_text,
            "simple_tts": "답변해 드릴게요.",
            "keywords": keywords,
            "braille_words": keywords,
            "actions": {
                "voice_hint": "'다음', '반복', '학습하기'",
                "learn_suggestion": "이 키워드로 학습을 이어가 보세요."
            },
            "meta": {
                "source_hint": "AI 응답"
            }
        }

    def create_error_response(self, query: str, mode: str) -> Dict[str, Any]:
        """Create error response when AI fails"""
        return {
            "mode": mode,
            "chat_markdown": "죄송해요. 잠시 후 다시 시도해주세요.",
            "simple_tts": "연결에 문제가 있어요.",
            "keywords": [],
            "braille_words": [],
            "actions": {
                "voice_hint": "'다시', '학습하기'",
                "learn_suggestion": "다시 시도해 보세요."
            },
            "meta": {
                "source_hint": "네트워크 연결을 확인해주세요."
            }
        }

# Global processor instance
processor = AIAssistantProcessor()

@csrf_exempt
@require_http_methods(["POST"])
def ai_assistant_view(request):
    """Handle AI Assistant requests"""
    try:
        data = json.loads(request.body)
        query = data.get('q', '').strip()
        mode = data.get('mode', 'qa')
        format_type = data.get('format', '')
        
        if not query:
            return JsonResponse({
                "error": "질문을 입력해주세요."
            }, status=400)
        
        # Validate mode
        if mode not in ['news', 'explain', 'qa']:
            mode = 'qa'
        
        # Process with AI Assistant
        if format_type == 'ai_assistant':
            response = processor.process_query(query, mode)
            return JsonResponse(response)
        else:
            # Fallback to regular chat processing
            from .views import chat_ask_view
            return chat_ask_view(request)
            
    except json.JSONDecodeError:
        return JsonResponse({
            "error": "잘못된 요청 형식입니다."
        }, status=400)
    except Exception as e:
        print(f"AI Assistant view error: {e}")
        return JsonResponse({
            "error": "서버 오류가 발생했습니다."
        }, status=500)
