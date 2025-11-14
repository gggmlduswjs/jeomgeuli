"""
API 통합 뷰 - 레거시 호환성 유지
실제 구현은 각 앱(learn, braille, learning 등)에서 처리
"""
from django.http import JsonResponse

def health(request):
    """헬스 체크"""
    return JsonResponse({"ok": True})
