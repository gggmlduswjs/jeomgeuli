import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import LearnIndex from "../pages/LearnIndex";
import LearnStep from "../pages/LearnStep";
import FreeConvert from "../pages/FreeConvert";
import Quiz from "../pages/Quiz";
import Review from "../pages/Review";
import Explore from "../pages/Explore";
import NotFound from "../pages/NotFound";
import DevHealth from "../components/system/DevHealth";
import ErrorBoundary from "../components/system/ErrorBoundary";
import HealthCheck from "../components/system/HealthCheck";

export default function App(){
  // 개발 헬스 기록
  (window as any).__APP_HEALTH__ = { ...(window as any).__APP_HEALTH__, appMounted: true };
  console.log("[APP] mounted", (window as any).__APP_HEALTH__);

  return (
    <ErrorBoundary>
      <HealthCheck>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          {import.meta.env.DEV && <DevHealth />}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />

            <Route path="/learn" element={<LearnIndex />} />
            <Route path="/learn/char" element={<LearnStep />} />
            <Route path="/learn/word" element={<LearnStep />} />
            <Route path="/learn/sentence" element={<LearnStep />} />
            <Route path="/learn/free" element={<FreeConvert />} />
            <Route path="/free-convert" element={<FreeConvert />} />

            {/* 퀴즈는 두 경로 모두 수용 */}
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/learn/quiz" element={<Quiz />} />

            <Route path="/review" element={<Review />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </HealthCheck>
    </ErrorBoundary>
  );
}