# 데이터 아키텍처 개선 요약

## 문제점 분석

### ❌ 기존 구조의 문제
1. **동적 데이터를 JSON 파일로 관리**
   - `review.json`: 복습 데이터를 파일로 저장
   - 동시성 문제 (여러 요청 시 데이터 손실)
   - 확장성 부족 (사용자별 데이터 분리 불가)
   - 트랜잭션 보장 불가

2. **일관성 없는 데이터 관리**
   - 일부는 JSON, 일부는 DB
   - 중복된 데이터 로딩 로직

## 개선된 구조

### ✅ 정적 데이터 (Static Data)
**JSON 파일로 관리 - 적절함**
- `ko_braille.json`: 점자 매핑 테이블
- `lesson_*.json`: 학습 초기 데이터

**이유:**
- 거의 변경되지 않음
- 읽기 전용
- 빠른 로딩 필요
- 파일 크기가 크지 않음

### ✅ 동적 데이터 (Dynamic Data)
**데이터베이스 사용 - 필수**
- `ReviewItem` 모델: 복습 항목
- `ReviewAttempt` 모델: 복습 시도 기록

**이유:**
- 동시성 보장
- 트랜잭션 지원
- 사용자별 데이터 분리
- 검색/필터링/정렬 기능
- 확장성

## 데이터 흐름

### 복습 데이터 저장
```
프론트엔드 → POST /api/learning/save/
  ↓
review_save() → ReviewItem.objects.create()
  ↓
SQLite DB 저장
  ↓
SRS 알고리즘으로 next_due 계산
```

### 복습 데이터 조회
```
프론트엔드 → GET /api/learning/list/
  ↓
review_list() → get_due_items()
  ↓
ReviewItem.objects.filter(next_due__lte=now)
  ↓
JSON 응답 반환
```

## 권장사항

1. **정적 데이터**: JSON 파일 유지 ✅
2. **동적 데이터**: 데이터베이스 사용 ✅ (완료)
3. **초기 데이터**: 필요시 Fixtures로 변환 가능
4. **점자 매핑**: JSON + 캐싱 (현재 구조 적절)

## 결론

현재 구조는 **적절하게 개선되었습니다**:
- ✅ 동적 데이터는 DB 사용
- ✅ 정적 데이터는 JSON 파일 유지
- ✅ 공통 유틸리티로 중복 제거
- ✅ 확장 가능한 구조

