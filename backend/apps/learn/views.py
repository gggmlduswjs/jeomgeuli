from django.http import JsonResponse
from django.conf import settings
import json, os

def _load_json(filename):
    base = os.path.join(settings.BASE_DIR, "data")
    path = os.path.join(base, filename)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def learn_char(request):
    data = _load_json("lesson_chars.json")
    return JsonResponse(data, safe=False)

def learn_word(request):
    data = _load_json("lesson_words.json")
    return JsonResponse(data, safe=False)

def learn_sentence(request):
    data = _load_json("lesson_sentences.json")
    return JsonResponse(data, safe=False)

# 필요 시 간단한 헬스체크(프런트 진단용)
def health(request):
    return JsonResponse({"ok": True})