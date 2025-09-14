import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) {
    console.error("[ErrorBoundary] Caught:", error, info);
    (window as any).__APP_HEALTH__ = { ...(window as any).__APP_HEALTH__, lastError: String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>앱에서 오류가 발생했어요.</h1>
          <p style={{ marginBottom: 12 }}>콘솔을 열어 상세 오류를 확인해주세요(F12).</p>
          <button onClick={() => location.reload()}>새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}
