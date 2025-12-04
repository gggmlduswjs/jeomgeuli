# 점글이 (Jeomgeuli) - 시각장애인 정보접근 PWA

점글이는 시각장애인을 위한 정보접근 및 점자학습 PWA(Progressive Web App)입니다. React 프론트엔드와 Django 백엔드를 통해 음성 인터페이스, 점자 출력, AI 기반 정보 처리를 제공합니다.

## 주요 기능

### 정보탐색 모듈
- **뉴스 요약**: 최신 뉴스를 5개 카드 형태로 요약
- **쉬운 설명**: 복잡한 개념을 불릿 포인트와 쉬운 말로 설명
- **질문답변**: 일반적인 질문에 대한 AI 답변
- **음성 인터페이스**: STT/TTS를 통한 음성 상호작용
- **점자 출력**: 핵심 키워드를 점자로 순차 출력

### 점자학습 모듈
- **자모 학습**: 한글 자모의 점자 패턴 학습
- **단어 학습**: 단어 단위 점자 학습
- **문장 학습**: 문장 단위 점자 학습
- **자유 변환**: 사용자 입력 텍스트의 점자 변환
- **자동 테스트**: 학습 내용에 대한 자동 평가
- **복습 노트**: 오답 문제 자동 저장 및 복습

## 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **Tailwind CSS** (스타일링)
- **React Query** (데이터 페칭)
- **Zustand** (상태 관리)
- **React Router** (라우팅)
- **PWA** (Progressive Web App)

### Backend
- **Django 4.2** + **Django REST Framework**
- **Google Gemini AI** (정보 처리)
- **SQLite** (개발용 데이터베이스)
- **CORS** (크로스 오리진 지원)

### 음성 기능
- **Web Speech API** (STT/TTS)
- **한국어 음성 인식/합성**

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- Python 3.8+
- Google Gemini API Key

### PWA 설치 (모바일)
- **Android**: Chrome에서 사이트 접속 후 "홈 화면에 추가"
- **iOS**: Safari에서 사이트 접속 후 "홈 화면에 추가"
- 자세한 내용: [PWA 설치 가이드](./docs/PWA_SETUP.md)

### 하드웨어 연동 (점자 디스플레이)
- **점글이 표준 하드웨어 (3셀 버전)**: [하드웨어 스펙](./docs/HARDWARE_SPEC.md)
  - Arduino UNO + Raspberry Pi 4 + JY-SOFT 점자 모듈 × 3
  - 총 18-dot 출력 (3셀 × 6-dot)
  - 펌웨어: `arduino/braille_3cell/braille_3cell.ino`
- 상용 제품 사용: [하드웨어 연동 가이드](./docs/HARDWARE_INTEGRATION.md)
- 직접 제작: [Arduino 펌웨어 개발 가이드](./docs/ARDUINO_FIRMWARE.md)

### 1. 저장소 클론
\`\`\`bash
git clone <repository-url>
cd jeomgeuli
\`\`\`

### 2. 백엔드 설정
\`\`\`bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 GEMINI_API_KEY 설정

# 데이터베이스 마이그레이션
python manage.py migrate

# 개발 서버 실행
python manage.py runserver
\`\`\`

### 3. 프론트엔드 설정
\`\`\`bash
cd frontend
npm install

# 개발 서버 실행
npm run dev
\`\`\`

### 4. 접속
- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:8000

### 5. 하드웨어 연동 (점자 디스플레이)

#### 방법 A: Web Serial API 사용 (권장 - Raspberry Pi 불필요)

**필요한 하드웨어:**
- Arduino UNO
- JY-SOFT 스마트 점자 모듈 × 3 (3셀 버전, 총 18-dot)
- 5핀 케이블 (점자 모듈 연결용)
- 5V, 2A 이상 전원 어댑터 (3셀 구동용)

**실행 순서:**

1. **Arduino 펌웨어 업로드 (3셀 버전)**
   ```bash
   # Arduino IDE에서 arduino/braille_3cell/braille_3cell.ino 업로드
   # 자세한 내용: arduino/README.md
   # 
   # 3셀 버전 특징:
   # - 3셀 버퍼 관리 (셀1, 셀2, 셀3)
   # - 새 문자는 셀1에, 기존은 오른쪽으로 이동
   # - shiftOut 순서: 셀3 → 셀2 → 셀1 (MSBFIRST)
   ```

2. **백엔드 및 프론트엔드 실행** (위의 2, 3단계 참조)

3. **브라우저에서 Serial 연결**
   - http://localhost:3000 접속
   - 정보탐색 페이지에서 "Arduino 연결" 버튼 클릭
   - Serial 포트 선택 (COM3 등)
   - 점자 출력 테스트

**주의사항:**
- Chrome 또는 Edge 브라우저 사용 (Web Serial API 지원)
- HTTPS 환경에서만 동작 (localhost는 예외)

#### 방법 B: Raspberry Pi BLE 서버 사용 (원래 설계)

**필요한 하드웨어:**
- Raspberry Pi 4 (BLE 지원)
- Arduino UNO
- JY-SOFT 스마트 점자 모듈 × 3 (3셀 버전, 총 18-dot)
- 5핀 케이블 (점자 모듈 연결용)
- 5V, 2A 이상 전원 어댑터 (3셀 구동용)

**실행 순서:**

1. **Arduino 펌웨어 업로드 (3셀 버전)** (방법 A와 동일)
   ```bash
   # Arduino IDE에서 arduino/braille_3cell/braille_3cell.ino 업로드
   ```

2. **Raspberry Pi BLE 서버 실행**
   ```bash
   # Raspberry Pi에서
   cd raspberrypi
   sudo python3 ble_server.py
   # 자세한 내용: raspberrypi/README.md
   ```

3. **백엔드 및 프론트엔드 실행** (위의 2, 3단계 참조)

4. **브라우저에서 BLE 연결**
   - http://localhost:3000 접속
   - 정보탐색 페이지에서 "Jeomgeuli" 디바이스 연결
   - 점자 출력 테스트

#### 상세 가이드
- [하드웨어 스펙](./docs/HARDWARE_SPEC.md): 전체 하드웨어 스펙 및 아키텍처
- [Raspberry Pi 가이드](./raspberrypi/README.md): BLE 서버 설치 및 실행
- [Arduino 가이드](./arduino/README.md): 펌웨어 업로드 및 하드웨어 연결

## API 엔드포인트

### 채팅 API
- \`POST /api/chat/ask\` - 질문 및 답변 처리

### 학습 API
- \`GET /api/learn/next/?mode={mode}\` - 다음 학습 내용 조회
- \`POST /api/learn/test/\` - 테스트 결과 제출

### 점자 API
- \`POST /api/braille/output/\` - 점자 출력 요청 (하드웨어 연동용)

## 사용법

### 1. 홈 화면
- **점자학습**: 체계적인 점자 학습 과정
- **정보탐색**: AI 기반 정보 접근

### 2. 정보탐색
- 음성이나 텍스트로 질문 입력
- 뉴스 요약, 쉬운 설명, 질문답변 모드 자동 인식
- 핵심 키워드 추출 및 점자 출력

### 3. 점자학습
- 자모 → 단어 → 문장 → 자유변환 순서로 학습
- 각 단계별 TTS 안내 및 자동 테스트
- 오답은 자동으로 복습 노트에 저장

### 4. 복습 노트
- 오답 문제들을 체계적으로 복습
- 음성 안내 및 점자 출력 지원

## 접근성 기능

- **키보드 네비게이션**: Tab/Enter 키로 모든 기능 접근 가능
- **음성 안내**: 모든 주요 기능에 TTS 지원
- **큰 폰트**: 시각적 접근성 향상
- **고대비 모드**: 시각 장애인을 위한 색상 대비 강화
- **점자 출력**: 하드웨어 연동을 통한 점자 디스플레이

## 개발 정보

### 프로젝트 구조
\`\`\`
jeomgeuli/
├── backend/                 # Django 백엔드
│   ├── apps/               # Django 앱들
│   │   ├── chat/          # 채팅 API
│   │   ├── learn/         # 학습 API
│   │   └── braille/       # 점자 출력 API
│   ├── jeomgeuli_backend/ # Django 설정
│   └── requirements.txt
├── frontend/               # React 프론트엔드
│   ├── src/
│   │   ├── components/    # UI 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── services/      # API 서비스
│   │   └── store/         # 상태 관리
│   └── package.json
├── raspberrypi/            # Raspberry Pi BLE 서버
│   ├── ble_server.py      # BLE → Serial Bridge
│   └── README.md
├── arduino/                # Arduino 펌웨어
│   ├── braille_firmware.ino # 점자 모듈 제어
│   └── README.md
└── README.md
\`\`\`

### 환경 변수

#### Backend (.env)
\`\`\`env
# backend/.env 또는 backend/jeomgeuli_backend/.env
GEMINI_API_KEY=your_gemini_api_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,8000
\`\`\`

#### Frontend (.env.local)
\`\`\`env
# frontend/.env.local (로컬 개발용)
# Vite proxy를 사용하므로 /api로 설정 (vite.config.ts의 proxy 사용)
VITE_API_BASE_URL=/api

# 주의: ngrok URL을 사용하지 마세요. 로컬 개발 시에는 /api를 사용합니다.
# Vite의 proxy 설정이 자동으로 http://localhost:8000으로 프록시합니다.
\`\`\`

**중요**: 
- 로컬 개발 시 `VITE_API_BASE_URL`을 설정하지 않으면 자동으로 `/api`를 사용합니다.
- `vite.config.ts`의 proxy 설정이 `/api`를 `http://localhost:8000`으로 자동 프록시합니다.
- ngrok URL을 사용하려면 프로덕션 빌드 시에만 설정하세요.

## 라이선스

MIT License

## 기여하기

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.
# jeomgeuli
# jeomgeuli
# jeomgeuli
