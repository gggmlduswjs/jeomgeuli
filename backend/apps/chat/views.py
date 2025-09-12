import json
import re
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .services import GeminiService


@csrf_exempt
@require_http_methods(["POST"])
def ask(request):
    try:
        # Validate input
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        
        query = data.get('query', '')
        if not query or not query.strip():
            return JsonResponse({'error': 'Query is required and cannot be empty'}, status=400)
        
        # Check if GEMINI_API_KEY is available
        gemini_key = os.getenv('GEMINI_API_KEY')
        if not gemini_key:
            # Return demo response when no API key
            mode = determine_mode(query)
            demo_response = get_demo_response(query, mode)
            return JsonResponse(demo_response)
        
        # Try to use Gemini service
        try:
            gemini_service = GeminiService()
            mode = determine_mode(query)
            
            if mode == 'news':
                response_data = gemini_service.generate_news_response(query)
            elif mode == 'explain':
                response_data = gemini_service.generate_explain_response(query)
            else:  # qa
                response_data = gemini_service.generate_qa_response(query)
            
            return JsonResponse(response_data)
            
        except Exception as gemini_error:
            # Fallback to demo response if Gemini fails
            print(f"Gemini API error: {gemini_error}")
            mode = determine_mode(query)
            demo_response = get_demo_response(query, mode)
            return JsonResponse(demo_response)
        
    except Exception as e:
        print(f"Chat ask error: {e}")
        return JsonResponse({'error': 'Internal server error'}, status=500)


def determine_mode(query):
    """Determine the mode based on query content"""
    query_lower = query.lower()
    
    # News keywords
    news_keywords = ['뉴스', 'news', '오늘', '최신', '속보', '기사', '요약']
    if any(keyword in query_lower for keyword in news_keywords):
        return 'news'
    
    # Explain keywords
    explain_keywords = ['설명', 'explain', '쉽게', '어떻게', '뭐야', '무엇', '뜻']
    if any(keyword in query_lower for keyword in explain_keywords):
        return 'explain'
    
    # Default to Q&A
    return 'qa'


def get_demo_response(query, mode):
    """Get demo response when Gemini API is not available"""
    if mode == 'news':
        return {
            "summary": f"'{query}'에 대한 뉴스 요약입니다.",
            "simple": "쉬운 설명: 최신 뉴스를 세 줄로 정리했습니다.",
            "keywords": ["뉴스", "최신", "요약"],
            "cards": [
                {"title": "주요 뉴스 1", "desc": "첫 번째 주요 뉴스 요약", "url": ""},
                {"title": "주요 뉴스 2", "desc": "두 번째 주요 뉴스 요약", "url": ""},
            ]
        }
    elif mode == 'explain':
        return {
            "summary": f"'{query}'에 대한 설명입니다.",
            "simple": "쉬운 설명: 핵심 내용을 간단히 설명했습니다.",
            "keywords": ["설명", "핵심", "요약"],
            "cards": [
                {"title": "기본 개념", "desc": "기본적인 개념 설명", "url": ""},
                {"title": "상세 정보", "desc": "더 자세한 정보", "url": ""},
            ]
        }
    else:  # qa
        return {
            "summary": f"'{query}'에 대한 답변입니다.",
            "simple": "쉬운 설명: 질문에 대한 답을 간단히 정리했습니다.",
            "keywords": ["답변", "정보", "도움"],
            "cards": [
                {"title": "답변 요약", "desc": "질문에 대한 핵심 답변", "url": ""},
            ]
        }


@csrf_exempt
@require_http_methods(["GET"])
def news_top(request):
    """Get top news with fallback data"""
    try:
        # Try to get real news from NewsAPI if key is available
        newsapi_key = os.getenv('NEWSAPI_KEY')
        if newsapi_key:
            # TODO: Implement real NewsAPI call
            pass
        
        # Fallback news data
        return JsonResponse({
            "summary": "오늘 주요 뉴스를 카드로 정리했습니다.",
            "simple": "쉬운 설명: 첫 번째 뉴스는 경제, 두 번째는 과학입니다.",
            "keywords": ["경제", "과학", "스포츠"],
            "cards": [
                {"title": "경제 성장률 2% 전망", "desc": "올해 경제 성장률이 2%대로 전망됩니다.", "url": "https://example.com/1"},
                {"title": "신기술 연구 성과", "desc": "최신 기술 연구에서 새로운 성과가 나왔습니다.", "url": "https://example.com/2"},
            ],
        })
        
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)
