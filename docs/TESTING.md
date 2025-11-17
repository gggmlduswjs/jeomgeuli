# 테스트 가이드

## 테스트 구조

```
frontend/
├── src/
│   ├── lib/__tests__/          # 라이브러리 단위 테스트
│   ├── services/__tests__/      # 서비스 단위 테스트
│   ├── store/__tests__/         # Store 단위 테스트
│   └── types/__tests__/        # 타입 유틸리티 테스트
└── e2e/                         # E2E 테스트
    ├── home.spec.ts
    ├── explore.spec.ts
    ├── voice-control.spec.ts
    └── accessibility.spec.ts
```

## 단위 테스트

### 실행 방법

```bash
# 개발 모드 (watch)
npm run test

# 한 번 실행
npm run test:run
```

### 테스트 커버리지

현재 테스트 커버리지:
- ✅ CommandRouter: 명령 라우팅 로직
- ✅ CommandService: 명령 처리 및 캐싱
- ✅ Error Handling: 에러 타입 변환
- ✅ Store: 상태 관리
- ✅ HTTP Client: API 호출

### 테스트 작성 가이드

```typescript
import { describe, it, expect } from 'vitest';

describe('ComponentName', () => {
  it('should do something', () => {
    // 테스트 코드
    expect(result).toBe(expected);
  });
});
```

## E2E 테스트

### 실행 방법

```bash
# 모든 브라우저에서 실행
npm run test:e2e

# UI 모드로 실행
npm run test:e2e:ui

# 특정 브라우저만 실행
npx playwright test --project=chromium
```

### 테스트 시나리오

1. **홈 페이지**
   - 네비게이션 버튼 표시 확인
   - 페이지 이동 테스트
   - 접근성 테스트

2. **정보 탐색**
   - 질문 입력 및 답변 표시
   - API 에러 처리
   - 음성 입력 테스트

3. **음성 제어**
   - 음성 명령어 인식
   - 네비게이션 명령
   - 제어 명령

4. **접근성**
   - ARIA 라벨 확인
   - 키보드 네비게이션
   - 스크린 리더 호환성

## CI/CD 통합

### GitHub Actions

`.github/workflows/ci.yml` 파일이 자동으로:
1. 프론트엔드 테스트 실행
2. 백엔드 테스트 실행
3. E2E 테스트 실행
4. 빌드 검증

### 트리거

- `push` to `main` or `develop`
- `pull_request` to `main` or `develop`

## 성능 테스트

### 성능 모니터링

개발 모드에서 자동으로 성능 메트릭 수집:
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- API 호출 시간
- 컴포넌트 렌더링 시간

### 성능 리포트 확인

브라우저 콘솔에서 확인:
```javascript
// 개발 모드에서
window.__PERFORMANCE_REPORT__ = performanceMonitor.generateReport();
console.log(window.__PERFORMANCE_REPORT__);
```

## 모킹

### API 모킹 (E2E)

```typescript
await page.route('**/api/explore/', async route => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ answer: 'Mocked answer' }),
  });
});
```

### 브라우저 API 모킹

```typescript
// Speech Recognition 모킹
await page.addInitScript(() => {
  window.SpeechRecognition = class {
    start() {}
    stop() {}
  };
});
```

## 베스트 프랙티스

1. **테스트 격리**: 각 테스트는 독립적으로 실행 가능해야 함
2. **명확한 이름**: 테스트 이름은 무엇을 테스트하는지 명확히
3. **AAA 패턴**: Arrange, Act, Assert
4. **에러 케이스**: 성공 케이스뿐만 아니라 에러 케이스도 테스트
5. **접근성**: 모든 주요 기능에 접근성 테스트 포함

## 문제 해결

### 테스트가 실패하는 경우

1. 로컬 환경 확인
2. 브라우저 드라이버 업데이트: `npx playwright install`
3. 캐시 클리어: `npm run test:e2e -- --reporter=list`

### 성능 테스트 경고

성능 경고가 나타나면:
1. 개발자 도구의 Performance 탭 확인
2. 네트워크 탭에서 느린 요청 확인
3. 번들 크기 확인

