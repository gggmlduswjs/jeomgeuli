from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from utils.braille_converter import text_to_cells

@csrf_exempt
def braille_convert(request):
    """
    POST {"text": "..."} -> {"cells": [[0|1 x 6], ...]}
    프론트엔드 호환을 위한 점자 변환 API
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
        cells = text_to_cells(text)
        print(f"[braille_convert] Generated {len(cells)} cells")
        
        return JsonResponse({"cells": cells})
    except Exception as e:
        print(f"[braille_convert] Error: {e}")
        import traceback
        traceback.print_exc()
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def convert(request):
    """레거시 호환"""
    return braille_convert(request)