from django.http import JsonResponse
from utils.data_loader import load_json

def learn_char(request):
    """자모 학습 데이터 반환"""
    data = load_json("lesson_chars.json", {"items": []})
    return JsonResponse(data if data else {"items": []})

def learn_word(request):
    """단어 학습 데이터 반환"""
    data = load_json("lesson_words.json", {"items": []})
    return JsonResponse(data if data else {"items": []})

def learn_sentence(request):
    """문장 학습 데이터 반환"""
    data = load_json("lesson_sentences.json", {"items": []})
    return JsonResponse(data if data else {"items": []})

def learn_keyword(request):
    """키워드 학습 데이터 반환"""
    data = load_json("lesson_keywords.json", [])
    return JsonResponse({"ok": True, "items": data if isinstance(data, list) else []})

# 필요 시 간단한 헬스체크(프런트 진단용)
def health(request):
    return JsonResponse({"ok": True})