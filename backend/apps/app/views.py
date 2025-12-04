from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json, re
import xml.etree.ElementTree as ET
import urllib.request
from utils.braille_converter import _load_braille_map

# 점자 매핑은 ko_braille.json에서 로드 (업데이트된 데이터 사용)
_braille_map_cache = None

def _get_braille_map():
    """점자 매핑 테이블을 로드 (캐시 사용)"""
    global _braille_map_cache
    if _braille_map_cache is None:
        _braille_map_cache = _load_braille_map()
    return _braille_map_cache

def _cell(ch:str):
    """문자를 점자 셀로 변환"""
    braille_map = _get_braille_map()
    arr = braille_map.get(ch)
    if isinstance(arr, list) and len(arr) == 6:
        return arr
    return [0,0,0,0,0,0]

def _split_korean(text:str):
    # 간단 분해: 글자 단위(완성형 그대로). 상세 초성/중성/종성 분해는 프론트가 가진 사전으로 보완.
    return list(text)

def health(request):
    return JsonResponse({"ok": True})

def api_health(request):
    return JsonResponse({"ok": True})

@csrf_exempt
def braille_convert(request):
    if request.method != "POST":
        return JsonResponse({"error":"POST only"}, status=405)
    try:
        payload = json.loads(request.body.decode("utf-8"))
        text = (payload.get("text") or "").strip()
        if not text:
            return JsonResponse({"items":[]})
        items = []
        for ch in _split_korean(text):
            items.append({"char": ch, "cells":[_cell(ch)]})
        return JsonResponse({"items":items})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def news_list(request):
    # 구글뉴스 RSS 프록시(서버→구글 요청, CORS 회피)
    q = request.GET.get("q","한국 주요 뉴스")
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(q)}&hl=ko&gl=KR&ceid=KR:ko"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            xml = resp.read()
        root = ET.fromstring(xml)
        items=[]
        for it in root.iter("item"):
            title = it.findtext("title") or ""
            link = it.findtext("link") or ""
            desc = (it.findtext("description") or "").strip()
            items.append({"title":title, "link":link, "summary":desc})
            if len(items)>=10: break
        return JsonResponse({"items":items})
    except Exception as e:
        return JsonResponse({"items":[
            {"title":"(DEV) 뉴스 RSS 요청 실패", "link":"", "summary":str(e)}
        ]})
