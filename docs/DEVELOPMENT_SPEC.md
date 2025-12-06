# 점글이 (Jeomgeuli) 개발명세서

**버전**: 1.0.0  
**작성일**: 2024년  
**프로젝트 유형**: 시각장애인 정보접근 및 점자학습 PWA

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기술 스택](#3-기술-스택)
4. [주요 기능 상세](#4-주요-기능-상세)
5. [음성 제어 시스템](#5-음성-제어-시스템)
6. [점자 변환 시스템](#6-점자-변환-시스템)
7. [API 명세](#7-api-명세)
8. [하드웨어 연동](#8-하드웨어-연동)
9. [데이터 구조](#9-데이터-구조)
10. [프로젝트 구조](#10-프로젝트-구조)
11. [개발 환경 설정](#11-개발-환경-설정)
12. [배포 및 운영](#12-배포-및-운영)
13. [테스트](#13-테스트)
14. [성능 최적화](#14-성능-최적화)
15. [접근성](#15-접근성)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목적
점글이는 시각장애인을 위한 정보접근 및 점자학습 PWA(Progressive Web App)입니다. 음성 인터페이스, 점자 출력, AI 기반 정보 처리를 통해 시각장애인의 정보 접근성을 향상시킵니다.

### 1.2 주요 목표
- **음성 기반 인터페이스**: STT/TTS를 통한 완전한 음성 상호작용
- **점자 학습 지원**: 체계적인 점자 학습 과정 제공
- **AI 기반 정보 탐색**: 복잡한 정보를 쉽게 이해할 수 있도록 변환
- **하드웨어 연동**: 실제 점자 디스플레이와의 연동 지원
- **접근성 우선**: WCAG 2.1 AA 수준의 접근성 준수

### 1.3 대상 사용자
- 시각장애인 (전맹, 저시력)
- 점자 학습자
- 점자 교육자

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────┐
│   React PWA (Frontend)                  │
│   - React 18 + TypeScript                │
│   - Vite (빌드 도구)                      │
│   - Web Speech API (STT/TTS)             │
│   - Web Serial API / Web Bluetooth API   │
└──────────────┬──────────────────────────┘
               │ HTTP/HTTPS
               │
┌──────────────▼──────────────────────────┐
│   Django Backend                          │
│   - Django 4.2 + DRF                      │
│   - OpenAI GPT-4o-mini                    │
│   - SQLite (개발용)                        │
└──────────────┬──────────────────────────┘
               │
               │ (선택적)
┌──────────────▼──────────────────────────┐
│   Raspberry Pi 4 (BLE Bridge)            │
│   - BLE → Serial 변환                     │
└──────────────┬──────────────────────────┘
               │ Serial (115200 bps)
               │
┌──────────────▼──────────────────────────┐
│   Arduino UNO                             │
│   - 3셀 점자 모듈 제어                     │
│   - Shift Register (74HC595)              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│   JY-SOFT 점자 모듈 × 3                   │
│   - 18-dot 출력 (3셀 × 6-dot)             │
└─────────────────────────────────────────┘
```

### 2.2 데이터 흐름

#### 2.2.1 음성 명령 처리 흐름

```
사용자 음성 입력
    ↓
Web Speech API (STT)
    ↓
GlobalVoiceRecognition.tsx
    ↓
useVoiceCommands.ts
    ↓
CommandRouter.ts (오인식 보정, 매칭)
    ↓
페이지별 핸들러 실행
    ↓
TTS 피드백 / 네비게이션
```

#### 2.2.2 점자 변환 흐름

```
텍스트 입력
    ↓
backend/utils/braille_converter.py
    ↓
UTF-8 → UTF-16 변환
    ↓
초성/중성/종성 분해
    ↓
ko_braille.json 매핑 조회
    ↓
점자 패턴 생성 (6-bit)
    ↓
frontend/src/lib/encodeHangul.ts
    ↓
CMD + PATTERN 패킷 생성
    ↓
Web Serial API / Web Bluetooth API
    ↓
Arduino 수신 및 출력
```

---

## 3. 기술 스택

### 3.1 Frontend

**핵심 프레임워크**
- React 18.2.0
- TypeScript 5.0.2
- Vite 4.5.14

**상태 관리**
- Zustand 4.3.6 (전역 상태)
- React Query 4.24.6 (서버 상태)

**라우팅**
- React Router DOM 6.8.1

**스타일링**
- Tailwind CSS 3.3.3
- PostCSS 8.4.27
- Autoprefixer 10.4.14

**PWA**
- vite-plugin-pwa 0.14.4
- Workbox (서비스 워커)

**음성 기능**
- Web Speech API (STT/TTS)
- string-similarity 4.0.4 (유사도 계산)

**하드웨어 연동**
- Web Serial API (Chrome/Edge)
- Web Bluetooth API (BLE)

**테스트**
- Vitest 3.2.4
- Playwright 1.40.0
- @axe-core/playwright 4.8.0 (접근성 테스트)

### 3.2 Backend

**프레임워크**
- Django 4.2.*
- Django REST Framework
- django-cors-headers 4.4.0

**AI/LLM**
- OpenAI SDK >= 1.40.0
- GPT-4o-mini 모델

**데이터베이스**
- SQLite (개발용)

**기타**
- python-dotenv >= 1.0.1
- httpx (비동기 HTTP)
- markdown (마크다운 파싱)
- feedparser 6.0.11 (RSS 피드)
- qrcode >= 7.4.2

### 3.3 하드웨어

**Arduino**
- Arduino UNO
- 펌웨어: `arduino/braille_3cell/braille_3cell.ino`
- Serial 통신: 115200 bps

**점자 모듈**
- JY-SOFT 스마트 점자 모듈 × 3
- 3셀 구성 (총 18-dot)

**BLE 브릿지 (선택적)**
- Raspberry Pi 4
- Python bluezero 라이브러리
- BLE → Serial 변환

---

## 4. 주요 기능 상세

### 4.1 정보탐색 모듈 (Explore)

**파일 위치**: `frontend/src/pages/Explore.tsx`

**주요 기능**
- AI 기반 질문답변 (OpenAI GPT-4o-mini)
- 뉴스 요약 (네이버 뉴스 API 통합)
- 키워드 추출 및 점자 출력
- 음성 입력 자동 검색
- 복습 목록 자동 저장

**API 엔드포인트**
- `GET /api/chat/explore/?q={query}` - 정보탐색 통합
- `POST /api/chat/ask/` - 질문답변
- `POST /api/chat/detail/` - 자세한 설명
- `POST /api/learning/save/` - 복습 항목 저장

**음성 명령**
- "탐색", "검색", "정보탐색" - 정보탐색 모드
- "뉴스" - 오늘 뉴스 조회
- "날씨" - 날씨 정보 조회
- "점자 출력" - 키워드 점자 출력
- "복습하기" - 키워드 복습 목록 저장

### 4.2 점자학습 모듈

#### 4.2.1 학습 메뉴 (LearnIndex)

**파일 위치**: `frontend/src/pages/LearnIndex.tsx`

**주요 기능**
- 자모/단어/문장/자유변환/복습 메뉴 선택
- 음성 명령으로 메뉴 이동

**음성 명령**
- "자모" - 자모 학습
- "단어" - 단어 학습
- "문장" - 문장 학습
- "자유변환" - 자유 변환
- "복습" - 복습하기

#### 4.2.2 학습 단계 (LearnStep)

**파일 위치**: `frontend/src/pages/LearnStep.tsx`

**주요 기능**
- 단계별 점자 학습 (자모/단어/문장)
- TTS 자동 안내
- 점자 패턴 시각화
- 학습 진행 상태 저장 (localStorage)

**API 엔드포인트**
- `GET /api/learn/chars/` - 자모 학습 데이터
- `GET /api/learn/words/` - 단어 학습 데이터
- `GET /api/learn/sentences/` - 문장 학습 데이터

#### 4.2.3 퀴즈 (Quiz)

**파일 위치**: `frontend/src/pages/Quiz.tsx`

**주요 기능**
- 점자 패턴을 보고 정답 입력
- 음성 입력 지원
- 오답 자동 저장 (복습 목록)

**API 엔드포인트**
- `POST /api/learning/save/` - 오답 저장

#### 4.2.4 복습 (Review)

**파일 위치**: `frontend/src/pages/Review.tsx`

**주요 기능**
- SRS (Spaced Repetition System) 기반 복습
- 복습 시간 자동 계산
- 오답 집중 복습

**API 엔드포인트**
- `GET /api/learning/list/` - 복습 항목 목록
- `POST /api/learning/grade/{item_id}/` - 복습 결과 제출
- `POST /api/learning/enqueue/` - 복습 항목 추가

#### 4.2.5 자유 변환 (FreeConvert)

**파일 위치**: `frontend/src/pages/FreeConvert.tsx`

**주요 기능**
- 사용자 입력 텍스트 점자 변환
- 실시간 변환 결과 표시
- 점자 패턴 시각화

**API 엔드포인트**
- `POST /api/braille/convert/` - 점자 변환

### 4.3 홈 화면 (Home)

**파일 위치**: `frontend/src/pages/Home.tsx`

**주요 기능**
- 메인 네비게이션 (학습/탐색/복습/변환)
- 원형 메뉴 인터페이스
- 음성 명령으로 메뉴 이동
- 점자 디바이스 연결 관리

---

## 5. 음성 제어 시스템

### 5.1 아키텍처

**핵심 파일**
- `frontend/src/components/input/GlobalVoiceRecognition.tsx` - 전역 음성 인식
- `frontend/src/hooks/useSTT.ts` - STT 훅
- `frontend/src/hooks/useTTS.ts` - TTS 훅
- `frontend/src/hooks/useVoiceCommands.ts` - 음성 명령 처리
- `frontend/src/lib/voice/CommandRouter.ts` - 명령 라우팅
- `frontend/src/lib/voice/MisrecognitionMap.ts` - 오인식 패턴 보정

**데이터 흐름**

```
Web Speech API (STT)
    ↓
useSTT.ts
    ↓
GlobalVoiceRecognition.tsx
    ↓
useVoiceCommands.ts
    ↓
CommandRouter.ts
    ├─ 오인식 보정 (MisrecognitionMap)
    ├─ 유사도 계산 (string-similarity)
    ├─ Confidence 필터링
    └─ 컨텍스트 기반 우선순위
    ↓
페이지별 핸들러 실행
```

### 5.2 주요 기능

#### 5.2.1 Confidence 기반 필터링

**구현 위치**: `frontend/src/lib/voice/CommandRouter.ts`

```typescript
function matchCommand(
  text: string,
  threshold: number = 0.40,
  alternatives?: RecognitionResult[],
  minConfidence: number = 0.5
): string | undefined
```

- Web Speech API의 `alternatives` 활용
- Confidence가 낮은 결과 필터링
- 기본 텍스트 우선 처리, alternatives는 보조

#### 5.2.2 오인식 패턴 보정

**구현 위치**: `frontend/src/lib/voice/MisrecognitionMap.ts`

- 중앙화된 오인식 패턴 사전
- 자모 이름 발음 오인식 보정
- 예: "자무" → "자모", "디긋" → "디귿"

#### 5.2.3 컨텍스트 기반 우선순위

**구현 위치**: `frontend/src/lib/voice/CommandRouter.ts`

```typescript
const CONTEXT_COMMANDS: Record<string, { priority: string[]; fallback: string[] }> = {
  '/learn': {
    priority: ['jamo', 'word', 'sentence', 'freeConvert', 'review'],
    fallback: ['learn', 'home', 'back']
  },
  // ...
};
```

- 현재 페이지 경로 기반 명령 우선순위
- 학습 메뉴에서는 "자모", "단어" 등이 우선

#### 5.2.4 사용자 피드백 수집

**구현 위치**: `frontend/src/services/VoiceFeedbackService.ts`

- 오인식 로그 수집
- 원본 transcript, 보정된 명령, 컨텍스트, confidence 저장
- 향후 개선을 위한 데이터 수집

### 5.3 명령어 목록

#### 5.3.1 기본 제어

| 명령어 | 설명 | 핸들러 |
|--------|------|--------|
| "다음" | 다음 항목으로 이동 | `next` |
| "이전" | 이전 항목으로 이동 | `prev` |
| "반복" | 현재 항목 반복 | `repeat` |
| "정지" | 재생 정지 | `stop` |
| "시작" | 재생 시작 | `start` |

#### 5.3.2 네비게이션

| 명령어 | 설명 | 핸들러 |
|--------|------|--------|
| "홈" | 홈 화면으로 이동 | `home` |
| "뒤로" | 이전 페이지로 이동 | `back` |
| "학습" | 학습 메뉴로 이동 | `learn` |
| "탐색" | 정보탐색으로 이동 | `explore` |
| "복습" | 복습 모드로 이동 | `review` |
| "자유변환" | 자유 변환으로 이동 | `freeConvert` |

#### 5.3.3 학습 메뉴 항목

| 명령어 | 설명 | 핸들러 |
|--------|------|--------|
| "자모" | 자모 학습 | `speak` (LearnIndex) |
| "단어" | 단어 학습 | `speak` (LearnIndex) |
| "문장" | 문장 학습 | `speak` (LearnIndex) |

### 5.4 구현 파일

**Frontend**
- `frontend/src/components/input/GlobalVoiceRecognition.tsx`
- `frontend/src/hooks/useSTT.ts`
- `frontend/src/hooks/useTTS.ts`
- `frontend/src/hooks/useVoiceCommands.ts`
- `frontend/src/lib/voice/CommandRouter.ts`
- `frontend/src/lib/voice/MisrecognitionMap.ts`
- `frontend/src/services/VoiceFeedbackService.ts`
- `frontend/src/store/voice.ts` (Zustand)

---

## 6. 점자 변환 시스템

### 6.1 한글 인코딩

**구현 위치**: `backend/utils/encode_hangul.py`, `frontend/src/lib/encodeHangul.ts`

**처리 과정**
1. UTF-8 바이트 분석
2. UTF-16 변환
3. 한글 유니코드 범위 확인 (0xAC00 ~ 0xD7A3)
4. 초성/중성/종성 분해

**분해 공식**
```python
utf16 = (byte1 & 0x0F) << 12 | (byte2 & 0x3F) << 6 | (byte3 & 0x3F)
val = utf16 - 0xAC00
jong = val % 28
jung = (val % (28 * 21)) / 28
cho = val / (28 * 21)
```

### 6.2 점자 매핑

**데이터 파일**: `backend/data/ko_braille.json`

**구조**
- 초성 19자
- 중성 21자
- 종성 28자 (없음 포함)
- ASCII 문자 매핑

**변환 로직**
- `backend/utils/braille_converter.py` - `text_to_cells()`
- `frontend/src/lib/brailleMap.ts` - 클라이언트 매핑

### 6.3 3셀 점자 표시

**Arduino 펌웨어**: `arduino/braille_3cell/braille_3cell.ino`

**표시 규칙**
- 한글 1자 = 3셀 (초성 + 중성 + 종성)
- ASCII 1자 = 1셀
- 새 문자는 셀1에, 기존은 오른쪽으로 이동

**패킷 형식**
```
[CMD, PATTERN]
- CMD_SINGLE (0x80): 단일 자모
- CMD_MULTI (0x81): 완성형 한글 (3셀)
- CMD_CLEAR (0x00): 모든 셀 클리어
```

### 6.4 구현 파일

**Backend**
- `backend/utils/braille_converter.py`
- `backend/utils/encode_hangul.py`
- `backend/data/ko_braille.json`

**Frontend**
- `frontend/src/lib/brailleMap.ts`
- `frontend/src/lib/encodeHangul.ts`
- `frontend/src/lib/braille.ts`
- `frontend/src/hooks/useBrailleSerial.ts`
- `frontend/src/hooks/useBraillePlayback.ts`

**Arduino**
- `arduino/braille_3cell/braille_3cell.ino`
- `arduino/braille_3cell/braille.h`
- `arduino/braille_3cell/braille.cpp`

---

## 7. API 명세

### 7.1 Base URL

- 개발: `http://localhost:8000`
- 프로덕션: 환경 변수 `API_BASE_URL` 설정

### 7.2 주요 엔드포인트

#### 7.2.1 헬스 체크

**GET** `/api/health/`

```json
{
  "ok": true,
  "message": "Server is running"
}
```

#### 7.2.2 채팅 API

**POST** `/api/chat/ask/`

**요청**
```json
{
  "query": "질문 내용"
}
```

**응답**
```json
{
  "answer": "답변 내용",
  "keywords": ["키워드1", "키워드2", "키워드3"]
}
```

**POST** `/api/chat/explore/`

**요청**
```
GET /api/chat/explore/?q=검색어
```

**응답**
```json
{
  "answer": "GPT 답변",
  "news": [...],
  "query": "검색어",
  "timestamp": 1234567890
}
```

#### 7.2.3 점자 변환

**POST** `/api/braille/convert/`

**요청**
```json
{
  "text": "변환할 텍스트"
}
```

**응답**
```json
{
  "cells": [[0,1,0,0,0,0], ...],
  "packets": [[0x81, 0x08], ...]
}
```

#### 7.2.4 학습 API

**GET** `/api/learn/chars/` - 자모 학습 데이터
**GET** `/api/learn/words/` - 단어 학습 데이터
**GET** `/api/learn/sentences/` - 문장 학습 데이터

**응답**
```json
{
  "items": [
    {
      "char": "ㄱ",
      "name": "기역",
      "cell": [0,0,0,1,0,0]
    }
  ]
}
```

### 7.3 상세 API 문서

자세한 내용은 `docs/API.md` 참조

---

## 8. 하드웨어 연동

### 8.1 하드웨어 구성

- Arduino UNO
- JY-SOFT 스마트 점자 모듈 × 3
- Shift Register (74HC595) × 3
- 5V, 2A 이상 전원 어댑터

### 8.2 연결 방법

#### 방법 A: Web Serial API (권장)

**장점**: Raspberry Pi 불필요, 직접 연결

**구현**: `frontend/src/hooks/useBrailleSerial.ts`

**사용법**
```typescript
const braille = useBraillePlayback({
  serial: {
    baudRate: 115200,
  },
});

await braille.connect();
braille.enqueueKeywords(['키워드1', '키워드2']);
```

#### 방법 B: BLE 서버

**구현**: `raspberrypi/ble_server.py`

**BLE 설정**
- Service UUID: `12345678-1234-5678-1234-56789abcdef0`
- Characteristic UUID: `abcdabcd-1234-5678-1111-abcdefabcdef`
- 디바이스 이름: `Jeomgeuli`

### 8.3 펌웨어

**파일**: `arduino/braille_3cell/braille_3cell.ino`

**주요 기능**
- 3셀 버퍼 관리
- 한글/ASCII 점자 변환
- Serial 통신 (115200 bps)
- 테스트 명령 지원 (`test`, `all`, `cell1`, `cell2`, `cell3`)

### 8.4 프로토콜

**Serial 패킷 형식**
```
[CMD, PATTERN]
- CMD: 0x80 (단일), 0x81 (다중), 0x00 (클리어)
- PATTERN: 6-bit 점자 패턴
```

자세한 내용은 `docs/HARDWARE.md` 참조

---

## 9. 데이터 구조

### 9.1 학습 데이터

**파일 위치**: `backend/data/`

- `lesson_chars.json` - 자모 학습 데이터
- `lesson_words.json` - 단어 학습 데이터
- `lesson_sentences.json` - 문장 학습 데이터
- `lesson_keywords.json` - 키워드 학습 데이터

**형식**
```json
{
  "items": [
    {
      "char": "ㄱ",
      "name": "기역",
      "cell": [0,0,0,1,0,0],
      "tts": "기역"
    }
  ]
}
```

### 9.2 점자 매핑 데이터

**파일**: `backend/data/ko_braille.json`

**구조**
```json
{
  "cho": {
    "ㄱ": {"dots": [4], "pattern": 8},
    ...
  },
  "jung": {
    "ㅏ": {"dots": [1,2,4,6], "pattern": 35},
    ...
  },
  "jong": {
    "": {"dots": [], "pattern": 0},
    "ㄱ": {"dots": [6], "pattern": 32},
    ...
  }
}
```

### 9.3 데이터베이스

**모델**: `backend/apps/learning/models.py`

**ReviewItem**
- `type`: char/word/sentence/braille
- `content`: JSON 필드 (텍스트, 점자 패턴 등)
- `next_due`: 다음 복습 시간 (SRS)
- `ease_factor`: 난이도 계수
- `interval`: 복습 간격 (일)
- `repetitions`: 반복 횟수

---

## 10. 프로젝트 구조

```
jeomgeuli/
├── frontend/                    # React 프론트엔드
│   ├── src/
│   │   ├── app/                 # App.tsx (라우팅)
│   │   ├── components/          # UI 컴포넌트
│   │   │   ├── braille/         # 점자 표시 컴포넌트
│   │   │   ├── input/           # 입력 컴포넌트 (음성 인식)
│   │   │   ├── system/          # 시스템 컴포넌트 (Toast, ErrorBoundary)
│   │   │   └── ui/              # 공통 UI 컴포넌트
│   │   ├── hooks/               # 커스텀 훅
│   │   │   ├── useSTT.ts        # STT 훅
│   │   │   ├── useTTS.ts        # TTS 훅
│   │   │   ├── useVoiceCommands.ts
│   │   │   ├── useBrailleSerial.ts
│   │   │   └── useBraillePlayback.ts
│   │   ├── lib/                 # 유틸리티
│   │   │   ├── voice/           # 음성 제어 로직
│   │   │   ├── brailleMap.ts   # 점자 매핑
│   │   │   └── encodeHangul.ts # 한글 인코딩
│   │   ├── pages/               # 페이지 컴포넌트
│   │   │   ├── Home.tsx
│   │   │   ├── LearnIndex.tsx
│   │   │   ├── LearnStep.tsx
│   │   │   ├── Explore.tsx
│   │   │   ├── Quiz.tsx
│   │   │   ├── Review.tsx
│   │   │   └── FreeConvert.tsx
│   │   ├── services/            # 서비스 레이어
│   │   ├── store/               # Zustand 스토어
│   │   └── types/                # TypeScript 타입
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Django 백엔드
│   ├── apps/
│   │   ├── chat/                # 채팅/정보탐색 API
│   │   ├── learn/               # 학습 데이터 API
│   │   ├── braille/             # 점자 변환 API
│   │   └── learning/            # 복습 시스템
│   ├── utils/
│   │   ├── braille_converter.py
│   │   └── encode_hangul.py
│   ├── data/                    # JSON 데이터 파일
│   ├── jeomgeuli_backend/       # Django 설정
│   └── requirements.txt
│
├── arduino/                      # Arduino 펌웨어
│   └── braille_3cell/
│       ├── braille_3cell.ino
│       ├── braille.h
│       └── braille.cpp
│
├── raspberrypi/                  # BLE 서버 (선택적)
│   └── ble_server.py
│
└── docs/                         # 문서
    ├── DEVELOPMENT_SPEC.md
    ├── API.md
    ├── HARDWARE.md
    ├── SCREEN_SPEC.md
    └── PROJECT_REPORT.md
```

---

## 11. 개발 환경 설정

### 11.1 사전 요구사항

- Node.js 18+
- Python 3.8+
- Arduino IDE (하드웨어 연동 시)
- Chrome/Edge 브라우저 (Web Serial API 지원)

### 11.2 설치 및 실행

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 OPENAI_API_KEY 설정

# 데이터베이스 마이그레이션
python manage.py migrate

# 개발 서버 실행
python manage.py runserver
```

#### Frontend

```bash
cd frontend
npm install

# 개발 서버 실행
npm run dev
```

### 11.3 환경 변수

#### Backend (.env)

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=True
OPENAI_API_KEY=your-openai-api-key
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
```

#### Frontend (.env.local)

```env
# Vite proxy를 사용하므로 /api로 설정
VITE_API_BASE_URL=/api
```

---

## 12. 배포 및 운영

### 12.1 PWA 빌드

```bash
cd frontend
npm run build
```

**출력**: `frontend/dist/`

### 12.2 프로덕션 설정

**Django 설정**
- `DEBUG=False`
- `ALLOWED_HOSTS` 설정
- 정적 파일 서빙 (WhiteNoise 또는 Nginx)

**PWA 설정**
- `vite.config.ts`의 `manifest` 설정 확인
- Service Worker 자동 등록

### 12.3 모니터링

- Django 로그: `backend/logs/`
- 프론트엔드 콘솔: 브라우저 개발자 도구
- 음성 인식 피드백: `VoiceFeedbackService` 로그

---

## 13. 테스트

### 13.1 단위 테스트

```bash
cd frontend
npm run test
```

**테스트 파일**
- `frontend/src/lib/__tests__/encodeHangul.test.ts`
- `frontend/src/services/__tests__/CommandService.test.ts`
- `frontend/src/store/__tests__/voice.test.ts`

### 13.2 E2E 테스트

```bash
npm run test:e2e
```

**테스트 파일**
- `frontend/e2e/accessibility.spec.ts`
- `frontend/e2e/explore.spec.ts`
- `frontend/e2e/home.spec.ts`
- `frontend/e2e/voice-control.spec.ts`

### 13.3 테스트 파일

**Backend**
- `backend/tests/test_encode_hangul.py`

---

## 14. 성능 최적화

### 14.1 음성 인식 최적화

- 기본 텍스트 우선 처리 (가장 빠름)
- Alternatives는 confidence 높은 순으로 처리
- 매칭 함수 최적화 (조기 종료)

### 14.2 점자 변환 최적화

- 점자 매핑 캐싱 (`_BRAILLE_MAP`)
- 파일 수정 시간 체크 (캐시 무효화)
- 배치 처리 (여러 문자 한 번에 변환)

### 14.3 렌더링 최적화

- React.memo 사용 (컴포넌트 메모이제이션)
- useMemo/useCallback 활용
- Zustand 선택자 최적화

---

## 15. 접근성

### 15.1 WCAG 2.1 AA 준수

- 키보드 네비게이션 지원
- ARIA 레이블 제공
- 색상 대비 비율 준수
- 스크린 리더 호환

### 15.2 음성 안내

- 모든 주요 기능에 TTS 지원
- 페이지 진입 시 자동 안내
- 상태 변경 시 음성 피드백

### 15.3 점자 출력

- 하드웨어 점자 디스플레이 연동
- 시각적 점자 패턴 표시 (화면)
- 점자 재생 제어 (다음/반복/정지)

---

## 부록

### A. 참고 문서
- `docs/API.md`: API 명세
- `docs/HARDWARE.md`: 하드웨어 명세
- `docs/SCREEN_SPEC.md`: 화면 정의서
- `docs/PROJECT_REPORT.md`: 프로젝트 보고서

### B. 라이선스
MIT License

### C. 기여 가이드
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request
