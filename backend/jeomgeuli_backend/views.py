"""
메인 프로젝트 뷰 - 루트 레벨 엔드포인트만 포함
실제 기능은 각 앱에서 처리
"""
from django.http import JsonResponse


def root_health(request):
    """루트 헬스 체크"""
    return JsonResponse({"ok": True, "message": "Server is running"})
