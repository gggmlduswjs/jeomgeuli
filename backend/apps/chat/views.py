import json
import re
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .services import GeminiService


@csrf_exempt
@require_http_methods(["POST"])
def ask(request):
    try:
        data = json.loads(request.body)
        query = data.get('query', '')
        
        if not query:
            return JsonResponse({'error': 'Query is required'}, status=400)
        
        # Determine mode based on query content
        mode = determine_mode(query)
        
        # Initialize Gemini service
        gemini_service = GeminiService()
        
        if mode == 'news':
            response_data = gemini_service.generate_news_response(query)
        elif mode == 'explain':
            response_data = gemini_service.generate_explain_response(query)
        else:  # qa
            response_data = gemini_service.generate_qa_response(query)
        
        return JsonResponse(response_data)
        
    except Exception as e:
        return JsonResponse({'error': f'Server error: {str(e)}'}, status=500)


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
