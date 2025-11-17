# 성능 모니터링 가이드

## 개요

점글이 프로젝트는 실시간 성능 모니터링을 통해 사용자 경험을 최적화합니다.

## 측정 지표

### Web Vitals

#### LCP (Largest Contentful Paint)
- **목표**: < 2.5초
- **측정**: 가장 큰 콘텐츠가 렌더링되는 시간
- **개선 방법**:
  - 이미지 최적화
  - 폰트 프리로드
  - 서버 응답 시간 개선

#### FID (First Input Delay)
- **목표**: < 100ms
- **측정**: 사용자 첫 상호작용까지의 지연 시간
- **개선 방법**:
  - JavaScript 번들 크기 감소
  - 긴 작업 분할
  - 코드 분할

#### CLS (Cumulative Layout Shift)
- **목표**: < 0.1
- **측정**: 레이아웃 변경 누적 점수
- **개선 방법**:
  - 이미지 크기 지정
  - 동적 콘텐츠 공간 예약
  - 폰트 로딩 최적화

### 커스텀 메트릭

#### API 호출 시간
- 모든 API 호출의 응답 시간 측정
- 성공/실패 여부 기록

#### 컴포넌트 렌더링 시간
- 주요 컴포넌트의 렌더링 시간 측정
- 성능 병목 지점 식별

#### 사용자 액션 시간
- 버튼 클릭, 입력 등의 응답 시간 측정

## 사용 방법

### 개발 모드

개발 모드에서 자동으로 활성화됩니다:

```typescript
// 성능 리포트 확인
import performanceMonitor from '@/lib/performance';

const report = performanceMonitor.generateReport();
console.log(report);

// 경고 확인
const warnings = performanceMonitor.checkPerformanceWarnings();
warnings.forEach(warning => console.warn(warning));
```

### 컴포넌트에서 사용

```typescript
import { usePerformance } from '@/hooks/usePerformance';

function MyComponent() {
  const { measureAction } = usePerformance('MyComponent');
  
  const handleClick = async () => {
    await measureAction('buttonClick', async () => {
      // 작업 수행
      await doSomething();
    });
  };
}
```

### API 호출 측정

자동으로 측정됩니다. 수동 측정이 필요한 경우:

```typescript
import performanceMonitor from '@/lib/performance';

const startTime = Date.now();
try {
  const result = await apiCall();
  const duration = Date.now() - startTime;
  performanceMonitor.measureAPICall('myAPI', duration, true);
} catch (error) {
  const duration = Date.now() - startTime;
  performanceMonitor.measureAPICall('myAPI', duration, false);
}
```

## 성능 최적화 팁

### 1. 코드 분할
```typescript
// 동적 import 사용
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

### 2. 메모이제이션
```typescript
// useMemo, useCallback 활용
const memoizedValue = useMemo(() => expensiveCalculation(), [deps]);
const memoizedCallback = useCallback(() => doSomething(), [deps]);
```

### 3. 이미지 최적화
- WebP 형식 사용
- 적절한 크기로 리사이즈
- Lazy loading 적용

### 4. 번들 최적화
- 불필요한 의존성 제거
- Tree shaking 활성화
- 코드 분할 전략 수립

## 성능 리포트 분석

### 리포트 구조

```typescript
interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalMetrics: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
  };
}
```

### 메트릭 필터링

```typescript
// 특정 메트릭만 조회
const lcpMetrics = performanceMonitor.getMetrics({ name: 'LCP' });

// 특정 시간 이후 메트릭 조회
const recentMetrics = performanceMonitor.getMetrics({
  since: Date.now() - 60000 // 최근 1분
});
```

## 성능 경고 해결

### LCP가 느린 경우
1. 서버 응답 시간 확인
2. 이미지 최적화
3. 폰트 로딩 전략 개선

### FID가 높은 경우
1. JavaScript 번들 크기 확인
2. 긴 작업 분할
3. 메인 스레드 블로킹 제거

### CLS가 높은 경우
1. 이미지 크기 지정
2. 동적 콘텐츠 공간 예약
3. 폰트 로딩 최적화

## 프로덕션 모니터링

프로덕션 환경에서는:
1. 성능 메트릭을 분석 서비스로 전송 (예: Google Analytics)
2. 사용자 세션별 성능 추적
3. 알림 설정 (임계값 초과 시)

## 참고 자료

- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

