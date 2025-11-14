# 데이터 관리 전략

## 현재 문제점

### 1. 동적 데이터를 JSON 파일로 관리
- **`review.json`**: 복습 데이터를 파일로 저장
  - ❌ 동시성 문제 (여러 요청 시 데이터 손실 가능)
  - ❌ 확장성 부족 (사용자별 데이터 분리 불가)
  - ❌ 트랜잭션 보장 불가
  - ❌ 검색/필터링 기능 제한적

### 2. 정적 데이터 관리 방식
- **`lesson_*.json`**: 학습 데이터를 JSON 파일로 관리
  - ⚠️ 초기 데이터는 괜찮지만, Fixtures로 관리하는 것이 더 나음
  - ⚠️ 버전 관리 및 배포 시 관리 어려움

### 3. 점자 매핑 데이터
- **`ko_braille.json`**: 점자 매핑 테이블
  - ✅ 정적 데이터이므로 JSON 파일 유지 가능
  - ✅ 거의 변경되지 않는 참조 데이터

## 권장 데이터 관리 전략

### 📊 데이터 분류

#### 1. 정적 참조 데이터 (Static Reference Data)
**JSON 파일 유지 가능**
- `ko_braille.json`: 점자 매핑 테이블
- `ko_braille_core.json`: 핵심 점자 매핑
- `braille_catalog.json`: 점자 카탈로그

**이유:**
- 거의 변경되지 않음
- 읽기 전용
- 파일 크기가 크지 않음
- 빠른 로딩 필요

#### 2. 초기 데이터 (Seed Data)
**Django Fixtures로 변환 권장**
- `lesson_chars.json` → `fixtures/lesson_chars.json`
- `lesson_words.json` → `fixtures/lesson_words.json`
- `lesson_sentences.json` → `fixtures/lesson_sentences.json`
- `lesson_keywords.json` → `fixtures/lesson_keywords.json`

**이유:**
- 버전 관리 용이
- 마이그레이션과 함께 관리
- 환경별 다른 데이터 설정 가능
- `python manage.py loaddata`로 쉽게 로드

#### 3. 동적 사용자 데이터 (Dynamic User Data)
**데이터베이스 사용 필수**
- `review.json` → `ReviewItem` 모델 사용
- 사용자별 복습 데이터
- 학습 진행 상태
- 퀴즈 결과

**이유:**
- 동시성 보장
- 트랜잭션 지원
- 사용자별 데이터 분리
- 검색/필터링/정렬 기능
- 확장성

## 개선 완료 ✅

### ✅ Phase 1: 동적 데이터를 DB로 마이그레이션 (완료)
- `ReviewItem` 모델 사용하도록 변경
- `review_save()`, `review_list()` 함수가 DB 사용
- JSON 파일 대신 ORM 사용
- 동시성 및 트랜잭션 보장

### 📝 Phase 2: 초기 데이터 관리 (현재 상태)
- `lesson_*.json`: JSON 파일로 유지 (읽기 전용)
- 필요시 Fixtures로 변환 가능
- 현재는 JSON 파일로 충분

### ✅ Phase 3: 정적 데이터 최적화 (완료)
- 점자 매핑은 `utils/braille_converter.py`에서 캐싱
- 전역 캐시로 성능 최적화

## 최종 데이터 관리 구조

### ✅ 정적 참조 데이터 (JSON 파일)
- `ko_braille.json`: 점자 매핑 테이블
- `lesson_*.json`: 학습 초기 데이터

### ✅ 동적 사용자 데이터 (데이터베이스)
- `ReviewItem`: 복습 항목
- `ReviewAttempt`: 복습 시도 기록
- SRS 알고리즘 지원

## 마이그레이션 필요 시

기존 `review.json` 데이터를 DB로 마이그레이션하려면:

```python
# 마이그레이션 스크립트 (필요시)
from apps.learning.models import ReviewItem
from utils.data_loader import load_json

data = load_json("review.json", [])
for item in data:
    ReviewItem.objects.create(
        type=item.get("payload", {}).get("type", "word"),
        source="quiz_wrong" if item.get("kind") == "wrong" else "learning_queue",
        content=item.get("payload", {}),
        next_due=timezone.now()
    )
```

