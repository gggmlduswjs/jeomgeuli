"""
공통 데이터 로딩 유틸리티
"""
import json
from pathlib import Path
from django.conf import settings
from typing import Any, Dict, List, Union

DATA_DIR = Path(settings.BASE_DIR) / "data"


def load_json(filename: str, default: Any = None) -> Union[Dict, List, Any]:
    """
    JSON 파일을 안전하게 로드합니다.
    
    Args:
        filename: 로드할 JSON 파일명
        default: 파일이 없거나 오류 발생 시 반환할 기본값
    
    Returns:
        로드된 JSON 데이터 또는 default 값
    """
    file_path = DATA_DIR / filename
    
    if not file_path.exists():
        return default if default is not None else {}
    
    try:
        # BOM 포함 가능성 대비 utf-8-sig 사용
        with open(file_path, "r", encoding="utf-8-sig") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return default if default is not None else {}
    except Exception:
        return default if default is not None else {}


def save_json(filename: str, data: Any) -> bool:
    """
    JSON 파일을 안전하게 저장합니다.
    
    Args:
        filename: 저장할 JSON 파일명
        data: 저장할 데이터
    
    Returns:
        저장 성공 여부
    """
    file_path = DATA_DIR / filename
    
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        return True
    except Exception:
        return False

