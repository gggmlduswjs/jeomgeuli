import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Settings, RotateCcw, Home, BookOpen, Search, RefreshCw, Type } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppShellMobileProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function AppShellMobile({
  title,
  showBackButton = false,
  onBack,
  children,
  className = ''
}: AppShellMobileProps) {
  const navigate = useNavigate();
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [isHighContrast, setIsHighContrast] = useState(false);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const speakText = (text: string) => {
    if (!isTTSEnabled) return;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleTTS = () => {
    setIsTTSEnabled(!isTTSEnabled);
    if (isTTSEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
    document.body.classList.toggle('theme-dark', !isHighContrast);
  };

  return (
    <div className={`min-h-screen bg-bg text-fg flex flex-col ${className}`}>
      {/* 상단 헤더 - 토스 스타일 */}
      <header className="bg-white border-b border-border shadow-toss">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* 뒤로가기 버튼 */}
            <div className="flex items-center">
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="뒤로 가기"
                >
                  <ArrowLeft className="w-6 h-6 text-fg" aria-hidden="true" />
                </button>
              )}
              {!showBackButton && (
                <div className="text-xl font-bold text-primary">
                  점글이
                </div>
              )}
            </div>

            {/* 제목 */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-semibold text-fg">{title}</h1>
            </div>

            {/* 접근성 도구들 */}
            <div className="flex items-center space-x-1">
              <button
                onClick={toggleTTS}
                className={`p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  isTTSEnabled 
                    ? 'bg-primary text-white' 
                    : 'bg-card text-muted hover:bg-border'
                }`}
                aria-label={isTTSEnabled ? '음성 안내 끄기' : '음성 안내 켜기'}
                aria-pressed={isTTSEnabled}
              >
                {isTTSEnabled ? (
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-5 h-5" aria-hidden="true" />
                )}
              </button>

              <button
                onClick={toggleHighContrast}
                className={`p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                  isHighContrast 
                    ? 'bg-accent text-white' 
                    : 'bg-card text-muted hover:bg-border'
                }`}
                aria-label={isHighContrast ? '고대비 모드 끄기' : '고대비 모드 켜기'}
                aria-pressed={isHighContrast}
              >
                <Type className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-y-auto bg-bg">
        <div className="max-w-md mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* 하단 탭 네비게이션 - 토스 스타일 */}
      <nav className="bg-white border-t border-border shadow-toss" role="navigation" aria-label="메인 네비게이션">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => navigate('/')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="홈으로 가기"
            >
              <Home className="w-6 h-6 text-muted" aria-hidden="true" />
              <span className="text-xs text-muted mt-1">홈</span>
            </button>

            <button
              onClick={() => navigate('/learn')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="점자 학습"
            >
              <BookOpen className="w-6 h-6 text-muted" aria-hidden="true" />
              <span className="text-xs text-muted mt-1">학습</span>
            </button>

            <button
              onClick={() => navigate('/explore')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="정보 탐색"
            >
              <Search className="w-6 h-6 text-muted" aria-hidden="true" />
              <span className="text-xs text-muted mt-1">탐색</span>
            </button>

            <button
              onClick={() => navigate('/review')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="복습하기"
            >
              <RefreshCw className="w-6 h-6 text-muted" aria-hidden="true" />
              <span className="text-xs text-muted mt-1">복습</span>
            </button>

            <button
              onClick={() => navigate('/learn/free')}
              className="flex flex-col items-center p-3 rounded-2xl hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              aria-label="자유 변환"
            >
              <Type className="w-6 h-6 text-muted" aria-hidden="true" />
              <span className="text-xs text-muted mt-1">자유</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}