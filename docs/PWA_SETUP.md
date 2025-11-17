# PWA 설치 및 사용 가이드

## PWA란?

Progressive Web App (PWA)은 웹 기술로 만든 앱으로, 네이티브 앱처럼 설치하고 사용할 수 있습니다.

## 폰에서 앱처럼 설치하기

### Android (Chrome)

1. **Chrome 브라우저**에서 사이트 접속
   - `https://your-domain.com` 또는 개발 중이라면 `https://your-ngrok-url.ngrok.io`

2. **설치 팝업 표시**
   - 주소창에 설치 아이콘(📱)이 나타나거나
   - 하단에 "설치" 배너가 표시됨

3. **설치 방법**
   - 방법 1: 주소창 옆 메뉴(⋮) → **"홈 화면에 추가"** 클릭
   - 방법 2: 팝업에서 **"설치"** 버튼 클릭
   - 방법 3: 주소창의 설치 아이콘(📱) 클릭

4. **설치 확인**
   - 홈 화면에 "점글이" 아이콘 생성
   - 아이콘 탭하면 앱처럼 전체 화면으로 실행

### iOS (Safari)

1. **Safari 브라우저**에서 사이트 접속
   - iOS에서는 Chrome이 Web Bluetooth를 지원하지 않으므로 Safari 사용 필수

2. **공유 버튼** 클릭
   - 하단 중앙의 공유 아이콘(□↑) 탭

3. **"홈 화면에 추가"** 선택
   - 스크롤하여 "홈 화면에 추가" 찾기

4. **이름 확인 및 추가**
   - 이름이 "점글이"로 표시되는지 확인
   - "추가" 버튼 탭

5. **설치 확인**
   - 홈 화면에 아이콘 생성
   - 아이콘 탭하면 Safari에서 앱처럼 실행

## 개발 환경에서 테스트

### 로컬 개발 (localhost)

PWA는 `localhost`에서도 작동합니다:

```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 후 설치 가능

### 외부 접근 (ngrok)

모바일에서 테스트하려면 HTTPS가 필요합니다:

```bash
# ngrok 사용
ngrok http 5173

# 또는 백엔드 스크립트 사용
cd backend
python scripts/run_with_react_ngrok.py
```

모바일에서 ngrok URL로 접속 후 설치

## PWA 기능

### 오프라인 지원
- Service Worker가 자동으로 활성화됨
- 네트워크가 없어도 기본 기능 사용 가능
- 캐시된 리소스 자동 업데이트

### 앱처럼 실행
- 전체 화면 모드 (standalone)
- 홈 화면 아이콘
- 시작 화면 (splash screen)

### 빠른 접근
- 홈 화면 바로가기
- 알림 지원 (향후 추가 가능)

## 문제 해결

### 설치 옵션이 보이지 않음

1. **HTTPS 확인**
   - PWA는 HTTPS 필수 (localhost 제외)
   - 개발 중: ngrok 사용

2. **브라우저 확인**
   - Android: Chrome 권장
   - iOS: Safari만 지원 (Chrome은 PWA 설치 불가)

3. **manifest 확인**
   - 개발자 도구 → Application → Manifest
   - 오류가 없는지 확인

### 설치 후 작동하지 않음

1. **캐시 삭제**
   - 브라우저 설정 → 사이트 데이터 삭제

2. **Service Worker 확인**
   - 개발자 도구 → Application → Service Workers
   - 등록되어 있는지 확인

3. **재설치**
   - 기존 앱 삭제 후 재설치

## 개발자 정보

### PWA 설정 파일

- `frontend/vite.config.ts`: VitePWA 플러그인 설정
- `frontend/index.html`: manifest 링크 및 메타 태그
- `frontend/public/pwa-*.png`: 아이콘 파일

### 아이콘 생성

```bash
cd frontend
npm run gen:icons
```

### Service Worker

VitePWA 플러그인이 자동으로 생성:
- `dist/sw.js`: Service Worker 파일
- `dist/workbox-*.js`: Workbox 라이브러리

## 참고 자료

- [PWA 가이드](https://web.dev/progressive-web-apps/)
- [Vite PWA 플러그인](https://vite-pwa-org.netlify.app/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

