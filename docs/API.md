# API 문서

## 개요

점글이 프로젝트의 백엔드 API 명세서입니다. Django REST Framework를 사용하여 구현되었습니다.

## Base URL

- 개발: `http://localhost:8000`
- 프로덕션: 환경 변수 `API_BASE_URL` 설정

## 인증

현재 버전에서는 인증이 필요하지 않습니다. (개발 단계)

---

## 엔드포인트

### 1. 헬스 체크

#### `GET /api/health/`

서버 상태 확인

**응답**
```json
{
  "ok": true,
  "message": "Server is running"
}
```

**상태 코드**: 200

---

### 2. 채팅 API

#### `POST /api/chat/ask/`

AI 기반 질문답변 처리

**요청 본문**
```json
{
  "query": "질문 내용",
  "q": "질문 내용 (대체 필드)"
}
```

**응답**
```json
{
  "answer": "답변 내용 (불릿 포인트 형식)",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}
```

**에러 응답**
```json
{
  "error": "too_many_requests",
  "detail": "잠시 후 다시 시도해주세요."
}
```

**상태 코드**
- 200: 성공
- 400: 잘못된 요청 (query 필수)
- 429: Rate limit 초과
- 500: 서버 오류

**Rate Limit**: IP당 1초에 1회

**구현 파일**: `backend/apps/chat/views.py::chat_ask`

---

#### `POST /api/chat/detail/`

특정 주제에 대한 자세한 설명

**요청 본문**
```json
{
  "topic": "주제"
}
```

**응답**
```json
{
  "answer": "자세한 설명 내용",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "mode": "detail"
}
```

**상태 코드**
- 200: 성공
- 400: topic 필수
- 429: Rate limit 초과
- 500: 서버 오류

**구현 파일**: `backend/apps/chat/views.py::chat_detail`

---

#### `GET /api/chat/explore/`

정보탐색 모드: GPT 답변 + 네이버 뉴스 통합

**쿼리 파라미터**
- `q` (필수): 검색어

**응답**
```json
{
  "answer": "GPT 답변 내용",
  "news": [
    {
      "title": "뉴스 제목",
      "description": "뉴스 설명",
      "link": "뉴스 링크",
      "pubDate": "2024-01-01T00:00:00+09:00"
    }
  ],
  "query": "검색어",
  "timestamp": 1234567890
}
```

**상태 코드**
- 200: 성공
- 400: q 파라미터 필수
- 503: API 키 미설정

**구현 파일**: `backend/apps/chat/views.py::explore`

---

#### `POST /api/chat/news/summary/`

뉴스 요약 (OpenAI 사용)

**요청 본문**
```json
{
  "q": "검색어",
  "query": "검색어 (대체 필드)"
}
```

**또는 GET 요청**
```
GET /api/chat/news/summary/?q=검색어
```

**응답**
```json
{
  "ok": true,
  "items": [
    {
      "title": "뉴스 제목",
      "summary": "뉴스 요약"
    }
  ],
  "q": "검색어",
  "answer": "전체 요약 텍스트"
}
```

**구현 파일**: `backend/apps/chat/views.py::news_summary`

---

#### `GET /api/chat/news/`

네이버 뉴스 API 프록시

**쿼리 파라미터**
- `q` (필수): 검색어
- `display` (선택): 결과 개수 (기본값: 10)
- `start` (선택): 시작 위치 (기본값: 1)
- `sort` (선택): 정렬 방식 (sim: 정확도순, date: 날짜순, 기본값: sim)

**응답**
```json
{
  "lastBuildDate": "Mon, 01 Jan 2024 00:00:00 +0900",
  "total": 1000,
  "start": 1,
  "display": 10,
  "items": [
    {
      "title": "뉴스 제목",
      "originallink": "원본 링크",
      "link": "링크",
      "description": "설명",
      "pubDate": "Mon, 01 Jan 2024 00:00:00 +0900"
    }
  ]
}
```

**상태 코드**
- 200: 성공
- 400: q 파라미터 필수
- 503: 네이버 API 키 미설정
- 504: 타임아웃

**구현 파일**: `backend/apps/chat/views.py::naver_news`

---

#### `GET /api/chat/health/`

채팅 API 헬스 체크

**응답**
```json
{
  "ok": true
}
```

---

#### `GET /api/chat/llm/health/`

LLM 연결 상태 확인

**응답**
```json
{
  "ok": true,
  "provider": "openai",
  "model": "gpt-4o-mini"
}
```

---

### 3. 점자 변환 API

#### `POST /api/braille/convert/`

텍스트를 점자 패턴으로 변환

**요청 본문**
```json
{
  "text": "변환할 텍스트"
}
```

**또는 GET 요청**
```
GET /api/braille/convert/?text=변환할텍스트
```

**응답**
```json
{
  "cells": [
    [0, 0, 0, 1, 0, 0],
    [1, 0, 1, 0, 0, 1],
    [0, 0, 0, 0, 0, 0]
  ],
  "packets": [
    [129, 8],
    [129, 35],
    [129, 0]
  ]
}
```

**응답 필드**
- `cells`: 점자 셀 배열 (하위 호환성)
  - 각 셀은 6-bit 배열 `[dot1, dot2, dot3, dot4, dot5, dot6]`
- `packets`: 점자 패킷 배열
  - 각 패킷은 `[CMD, PATTERN]` 형식
  - CMD: `0x80` (단일), `0x81` (다중), `0x00` (클리어)
  - PATTERN: 6-bit 점자 패턴 (0-63)

**상태 코드**
- 200: 성공
- 500: 변환 오류

**구현 파일**: `backend/apps/braille/views.py::braille_convert`

---

#### `POST /api/braille/packets/`

점자 패킷만 반환 (cells 제외)

**요청 본문**
```json
{
  "text": "변환할 텍스트"
}
```

**응답**
```json
{
  "packets": [
    [129, 8],
    [129, 35],
    [129, 0]
  ]
}
```

**구현 파일**: `backend/apps/braille/views.py::braille_packets`

---

### 4. 학습 데이터 API

#### `GET /api/learn/chars/`

자모 학습 데이터 조회

**응답**
```json
{
  "items": [
    {
      "char": "ㄱ",
      "name": "기역",
      "cell": [0, 0, 0, 1, 0, 0],
      "tts": "기역"
    }
  ]
}
```

**구현 파일**: `backend/apps/learn/views.py::learn_char`  
**데이터 파일**: `backend/data/lesson_chars.json`

---

#### `GET /api/learn/words/`

단어 학습 데이터 조회

**응답**
```json
{
  "items": [
    {
      "word": "가나",
      "cells": [
        [0, 0, 0, 1, 0, 0],
        [1, 0, 1, 0, 0, 1]
      ],
      "tts": "가나"
    }
  ]
}
```

**구현 파일**: `backend/apps/learn/views.py::learn_word`  
**데이터 파일**: `backend/data/lesson_words.json`

---

#### `GET /api/learn/sentences/`

문장 학습 데이터 조회

**응답**
```json
{
  "items": [
    {
      "sentence": "안녕하세요",
      "cells": [
        [0, 0, 0, 1, 0, 0],
        [1, 0, 1, 0, 0, 1],
        ...
      ],
      "tts": "안녕하세요"
    }
  ]
}
```

**구현 파일**: `backend/apps/learn/views.py::learn_sentence`  
**데이터 파일**: `backend/data/lesson_sentences.json`

---

#### `GET /api/learn/keywords/`

키워드 학습 데이터 조회

**응답**
```json
{
  "ok": true,
  "items": [
    {
      "keyword": "키워드",
      "cells": [...]
    }
  ]
}
```

**구현 파일**: `backend/apps/learn/views.py::learn_keyword`  
**데이터 파일**: `backend/data/lesson_keywords.json`

---

### 5. 복습 API

#### `GET /api/learning/list/`

복습 항목 목록 조회 (SRS 기반)

**쿼리 파라미터**
- `n` (선택): 가져올 항목 수 (기본값: 50, 최대: 100)

**응답**
```json
{
  "items": [
    {
      "id": 1,
      "kind": "wrong",
      "payload": {
        "type": "word",
        "content": "가나",
        "text": "가나"
      },
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**응답 필드**
- `items`: 복습할 항목 목록
  - `id`: 항목 ID
  - `kind`: "wrong" (오답) 또는 "keyword" (키워드)
  - `payload`: 학습 내용
  - `timestamp`: 생성 시간

**구현 파일**: `backend/apps/learning/views_review.py::review_list`

---

#### `POST /api/learning/save/`

복습 항목 저장

**요청 본문**
```json
{
  "kind": "wrong",
  "payload": {
    "type": "word",
    "content": "가나",
    "text": "가나",
    "word": "가나"
  }
}
```

**응답**
```json
{
  "ok": true,
  "id": 1
}
```

**요청 필드**
- `kind`: "wrong" (오답) 또는 "keyword" (키워드)
- `payload.type`: "char", "word", "sentence", "braille"
- `payload.content`: 학습 내용 (텍스트)
- `payload.text`: 표시용 텍스트
- `payload.word`: 단어 (단어 타입인 경우)

**구현 파일**: `backend/apps/learning/views_review.py::review_save`

---

#### `POST /api/learning/enqueue/`

복습 항목 추가 (review_save와 동일)

**요청 본문**
```json
{
  "kind": "keyword",
  "payload": {
    "type": "word",
    "content": "키워드",
    "text": "키워드"
  }
}
```

**응답**
```json
{
  "ok": true,
  "id": 1
}
```

**구현 파일**: `backend/apps/learning/views_review.py::review_enqueue`

---

#### `POST /api/learning/grade/{item_id}/`

복습 결과 제출 (SRS 계산)

**경로 파라미터**
- `item_id`: 복습 항목 ID

**요청 본문**
```json
{
  "grade": 3,
  "response_time": 2.5
}
```

**요청 필드**
- `grade` (필수): 0(틀림) ~ 4(완벽)
- `response_time` (선택): 응답 시간 (초)

**응답**
```json
{
  "success": true,
  "next_due": "2024-01-08T00:00:00Z",
  "ease_factor": 2.6,
  "interval": 6,
  "repetitions": 1
}
```

**응답 필드**
- `next_due`: 다음 복습 시간 (ISO 8601)
- `ease_factor`: 난이도 계수 (SM-2)
- `interval`: 복습 간격 (일)
- `repetitions`: 반복 횟수

**SRS 알고리즘**: SM-2 (Spaced Repetition System)

**구현 파일**: `backend/apps/learning/views_review.py::grade_review`

---

#### `GET /api/learning/` (레거시)

복습 항목 목록 조회 (review_list와 동일)

---

#### `POST /api/learning/add/` (레거시)

복습 항목 추가 (review_save와 동일)

---

#### `GET /api/learning/today/` (레거시)

오늘 복습 항목 조회 (review_list와 동일)

---

## 에러 처리

### 에러 응답 형식

```json
{
  "error": "error_code",
  "detail": "에러 상세 메시지"
}
```

### 에러 코드

| 코드 | 설명 | HTTP 상태 |
|------|------|-----------|
| `bad_request` | 잘못된 요청 | 400 |
| `method_not_allowed` | 허용되지 않은 HTTP 메서드 | 405 |
| `too_many_requests` | Rate limit 초과 | 429 |
| `config_error` | 설정 오류 (API 키 미설정 등) | 503 |
| `openai_key_not_set` | OpenAI API 키 미설정 | 503 |
| `naver_keys_not_set` | 네이버 API 키 미설정 | 503 |
| `timeout` | 타임아웃 | 504 |
| `network_error` | 네트워크 오류 | 502 |
| `internal_error` | 내부 서버 오류 | 500 |

---

## 레이트 리밋

### 채팅 API

- **제한**: IP당 1초에 1회
- **에러**: 429 Too Many Requests
- **구현**: `backend/apps/chat/views.py::_ok_rate()`

---

## 프론트엔드 사용 예시

### TypeScript/React

```typescript
import { askChat, fetchLearn, convertBraille, saveReview } from '@/lib/api';

// 질문답변
const result = await askChat('질문 내용');
console.log(result.answer, result.keywords);

// 학습 데이터
const chars = await fetchLearn('char');
console.log(chars.items);

// 점자 변환
const braille = await convertBraille('가나');
console.log(braille.cells, braille.packets);

// 복습 항목 저장
await saveReview('keyword', {
  type: 'word',
  content: '키워드',
  text: '키워드'
});
```

### 에러 처리

```typescript
try {
  const result = await askChat('질문');
} catch (error: any) {
  if (error.response?.status === 429) {
    console.error('Rate limit 초과');
  } else if (error.response?.status === 503) {
    console.error('API 키 미설정');
  } else {
    console.error('알 수 없는 오류:', error);
  }
}
```

---

## 데이터 모델

### ReviewItem

**필드**
- `id`: 항목 ID (자동 증가)
- `type`: "char" | "word" | "sentence" | "braille"
- `source`: "manual" | "quiz_wrong" | "free_convert" | "learning_queue"
- `content`: JSON 필드 (학습 내용)
- `ease_factor`: 난이도 계수 (기본값: 2.5)
- `interval`: 복습 간격 (일, 기본값: 1)
- `repetitions`: 반복 횟수 (기본값: 0)
- `next_due`: 다음 복습 시간 (DateTime)
- `created_at`: 생성 시간
- `updated_at`: 수정 시간

**인덱스**
- `(next_due, type)`
- `(type, source)`

**구현 파일**: `backend/apps/learning/models.py::ReviewItem`

---

## 버전 정보

- **API 버전**: 1.0.0
- **Django 버전**: 4.2.*
- **DRF 버전**: 최신

---

## 참고 자료

- Django REST Framework: https://www.django-rest-framework.org/
- OpenAI API: https://platform.openai.com/docs
- 네이버 검색 API: https://developers.naver.com/docs/serviceapi/search/news/news.md
