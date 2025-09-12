import json, os, datetime
from django.http import JsonResponse, HttpResponseBadRequest
from django.views.decorators.csrf import csrf_exempt
import feedparser

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
REVIEW_FILE = os.path.join(DATA_DIR, "review.json")

def _load_json(filename, default):
    try:
        with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default

def _save_review(obj):
    try:
        with open(REVIEW_FILE, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def health(_):
    return JsonResponse({"ok": True})

# -------- 학습 데이터 --------
def learn_chars(_):
    return JsonResponse(_load_json("lesson_chars.json", {"items": []}))

def learn_words(_):
    return JsonResponse(_load_json("lesson_words.json", {"items": []}))

def learn_sentences(_):
    return JsonResponse(_load_json("lesson_sentences.json", {"items": []}))

# -------- 간단 한국점자 매핑(서버용 fallback) --------
JAMO = {
    "ㄱ":[1,0,0,0,0,0], "ㄲ":[1,1,0,0,0,0], "ㄴ":[1,0,1,0,0,0], "ㄷ":[1,1,0,0,1,0],
    "ㄹ":[1,0,0,1,0,0], "ㅁ":[1,0,1,1,0,0], "ㅂ":[1,1,0,1,0,0], "ㅅ":[0,1,0,1,0,0],
    "ㅆ":[0,1,1,1,0,0], "ㅇ":[0,0,1,1,0,0], "ㅈ":[1,0,0,0,1,0], "ㅊ":[1,0,0,1,1,0],
    "ㅋ":[1,0,1,0,1,0], "ㅌ":[1,1,0,0,1,0], "ㅍ":[1,1,1,0,1,0], "ㅎ":[0,1,0,0,1,0],
    "ㅏ":[0,0,1,0,0,0], "ㅓ":[0,1,0,0,0,0], "ㅗ":[0,0,1,1,0,0], "ㅜ":[0,1,1,0,0,0],
    "ㅡ":[0,1,0,1,0,0], "ㅣ":[0,0,0,1,0,0], "ㅑ":[0,0,1,0,1,0], "ㅕ":[0,1,0,0,1,0],
    "ㅛ":[0,0,1,1,1,0], "ㅠ":[0,1,1,0,1,0], "ㅐ":[0,0,1,0,0,1], "ㅔ":[0,1,0,0,0,1],
    "·":[0,0,0,0,0,0], " ":[0,0,0,0,0,0], ".":[0,1,0,1,1,0]
}
import unicodedata
def _text_to_cells(txt):
    cells=[]
    for ch in txt.strip():
        if ch in JAMO:
            cells.append(JAMO[ch])
            continue
        # 한글 낱자 분해
        try:
            dec=unicodedata.normalize("NFD", ch)
            for j in dec:
                if j in JAMO: cells.append(JAMO[j])
        except Exception:
            pass
    return cells

@csrf_exempt
def braille_convert(request):
    if request.method!="POST":
        return HttpResponseBadRequest("POST only")
    try:
        body=json.loads(request.body.decode("utf-8"))
        text=body.get("text","")
        cells=_text_to_cells(text)
        return JsonResponse({"cells": cells})
    except Exception as e:
        return HttpResponseBadRequest(str(e))

# -------- 복습노트(파일 기반) --------
@csrf_exempt
def review_add(request):
    if request.method!="POST": return HttpResponseBadRequest("POST only")
    try:
        body=json.loads(request.body.decode("utf-8"))
        item_type=body.get("type")   # char|word|sentence|keyword
        content=body.get("content","")
        src=body.get("source","")
        today=datetime.date.today().isoformat()
        db=_load_json("review.json", {})
        day=db.get(today, [])
        day.append({"type":item_type,"content":content,"source":src,"ts":datetime.datetime.now().isoformat()})
        db[today]=day
        _save_review(db)
        return JsonResponse({"ok":True, "saved": len(day)})
    except Exception as e:
        return HttpResponseBadRequest(str(e))

def review_today(_):
    today=datetime.date.today().isoformat()
    db=_load_json("review.json", {})
    return JsonResponse({"date": today, "items": db.get(today, [])})

# -------- 뉴스 카드 (구글 뉴스 RSS) --------
def news_cards(_):
    url="https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    feed=feedparser.parse(url)
    items=[]
    for e in feed.entries[:5]:
        items.append({
            "title": e.title,
            "summary": (getattr(e, "summary", "") or "")[:180],
            "link": getattr(e, "link", "")
        })
    return JsonResponse({"items": items})
