from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from utils.braille_converter import text_to_cells
from utils.encode_hangul import text_to_packets

@csrf_exempt
def braille_convert(request):
    """
    POST {"text": "..."} -> {"cells": [[0|1 x 6], ...], "packets": [[cmd, pattern], ...]}
    프론트엔드 호환을 위한 점자 변환 API (cells와 packets 모두 반환)
    """
    try:
        print(f"[braille_convert] Request method: {request.method}")
        print(f"[braille_convert] Request body: {request.body}")
        
        if request.method == "GET":
            text = request.GET.get("text","")
        else:
            payload = json.loads(request.body.decode("utf-8") or "{}")
            text = payload.get("text","")
        
        print(f"[braille_convert] Text to convert: '{text}'")
        
        # 기존 cells 형식 (하위 호환성)
        cells = text_to_cells(text)
        print(f"[braille_convert] Generated {len(cells)} cells")
        
        # 새로운 packets 형식
        packets = text_to_packets(text)
        print(f"[braille_convert] Generated {len(packets)} packets")
        if packets:
            print(f"[braille_convert] First packet: [{packets[0][0]}, {packets[0][1]}]")
            if len(packets) > 1:
                print(f"[braille_convert] Second packet: [{packets[1][0]}, {packets[1][1]}]")
        
        if cells:
            print(f"[braille_convert] First cell: {cells[0]}")
            if len(cells) > 1:
                print(f"[braille_convert] Second cell: {cells[1]}")
        else:
            print(f"[braille_convert] Warning: No cells generated!")
        
        return JsonResponse({
            "cells": cells,  # 하위 호환성
            "packets": packets  # 새로운 형식
        })
    except Exception as e:
        print(f"[braille_convert] Error: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def braille_packets(request):
    """
    POST {"text": "..."} -> {"packets": [[cmd, pattern], ...]}
    패킷 형식만 반환하는 새로운 API 엔드포인트
    """
    try:
        print(f"[braille_packets] Request method: {request.method}")
        print(f"[braille_packets] Request body: {request.body}")
        
        if request.method == "GET":
            text = request.GET.get("text","")
        else:
            payload = json.loads(request.body.decode("utf-8") or "{}")
            text = payload.get("text","")
        
        print(f"[braille_packets] Text to convert: '{text}'")
        packets = text_to_packets(text)
        print(f"[braille_packets] Generated {len(packets)} packets")
        if packets:
            print(f"[braille_packets] First packet: [{packets[0][0]}, {packets[0][1]}]")
        
        return JsonResponse({"packets": packets})
    except Exception as e:
        print(f"[braille_packets] Error: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def convert(request):
    """레거시 호환"""
    return braille_convert(request)