import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Play } from 'lucide-react';
import AppShellMobile from '../components/AppShellMobile';
import BrailleCell from '../components/BrailleCell';
import VoiceButton from '../components/VoiceButton';
import SpeechBar from '../components/SpeechBar';
import useTTS from '../hooks/useTTS';
import useSTT from '../hooks/useSTT';
import { BRAILLE_MAP } from '../lib/brailleMap';
import ToastA11y from '../components/ToastA11y';

interface LearningItem {
  char: string;
  name: string;
  description: string;
  examples: string[];
}

export default function LearnMode() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { speak, stop } = useTTS();
  const { start: startSTT, stop: stopSTT, isListening, transcript } = useSTT();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 학습 데이터 (실제로는 API에서 가져올 데이터)
  const getLearningData = (): LearningItem[] => {
    switch (mode) {
      case 'jamo':
        return [
          { char: 'ㄱ', name: '기역', description: '자음 ㄱ입니다', examples: ['가', '거', '고'] },
          { char: 'ㄴ', name: '니은', description: '자음 ㄴ입니다', examples: ['나', '너', '노'] },
          { char: 'ㄷ', name: '디귿', description: '자음 ㄷ입니다', examples: ['다', '더', '도'] },
          { char: 'ㅏ', name: '아', description: '모음 ㅏ입니다', examples: ['가', '나', '다'] },
          { char: 'ㅓ', name: '어', description: '모음 ㅓ입니다', examples: ['거', '너', '더'] }
        ];
      case 'word':
        return [
          { char: '가', name: '가', description: '가나다라마의 가입니다', examples: ['가족', '가방', '가게'] },
          { char: '나', name: '나', description: '가나다라마의 나입니다', examples: ['나무', '나라', '나이'] },
          { char: '다', name: '다', description: '가나다라마의 다입니다', examples: ['다리', '다음', '다양'] }
        ];
      case 'sentence':
        return [
          { char: '안녕하세요', name: '안녕하세요', description: '인사말입니다', examples: ['안녕하세요. 좋은 하루입니다.'] },
          { char: '감사합니다', name: '감사합니다', description: '감사의 표현입니다', examples: ['감사합니다. 도움이 되었습니다.'] }
        ];
      default:
        return [];
    }
  };

  const learningData = getLearningData();
  const currentItem = learningData[currentIndex];

  // 음성 명령 처리
  useEffect(() => {
    if (transcript) {
      const command = transcript.toLowerCase().trim();
      
      if (command.includes('다음') || command.includes('넘어') || command.includes('계속')) {
        handleNext();
      } else if (command.includes('이전') || command.includes('뒤로')) {
        handlePrevious();
      } else if (command.includes('반복') || command.includes('다시')) {
        handleRepeat();
      } else if (command.includes('학습') || command.includes('테스트')) {
        handleStartTest();
      }
    }
  }, [transcript]);

  const handleNext = () => {
    if (currentIndex < learningData.length - 1) {
      setCurrentIndex(currentIndex + 1);
      showToastMessage('다음 항목으로 이동합니다.');
    } else {
      showToastMessage('모든 학습이 완료되었습니다. 테스트를 시작합니다.');
      setTimeout(() => handleStartTest(), 1000);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      showToastMessage('이전 항목으로 이동합니다.');
    }
  };

  const handleRepeat = () => {
    if (currentItem) {
      const message = `${currentItem.name}. ${currentItem.description}. 점자 패턴을 기억해보세요.`;
      speak(message);
    }
  };

  const handleStartTest = () => {
    showToastMessage('테스트 모드로 이동합니다.');
    setTimeout(() => {
      navigate(`/test/${mode}`);
    }, 1000);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // 현재 항목 변경 시 음성 안내
  useEffect(() => {
    if (currentItem) {
      const message = `${currentItem.name}. ${currentItem.description}. 점자 패턴을 기억해보세요.`;
      speak(message);
    }
  }, [currentItem, speak]);

  if (!currentItem) {
    return (
      <AppShellMobile title="학습 모드" showBackButton>
        <div className="text-center">
          <p className="text-secondary">학습 데이터를 불러올 수 없습니다.</p>
          <button onClick={() => navigate('/learn')} className="btn btn-primary mt-4">
            학습 선택으로 돌아가기
          </button>
        </div>
      </AppShellMobile>
    );
  }

  const braillePattern = BRAILLE_MAP[currentItem.char]?.pattern || [false, false, false, false, false, false];

  return (
    <AppShellMobile title={`${mode === 'jamo' ? '자모' : mode === 'word' ? '단어' : '문장'} 학습`} showBackButton>
      {/* 진행 상황 */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-secondary">
            {currentIndex + 1} / {learningData.length}
          </span>
          <span className="text-sm text-secondary">
            {Math.round(((currentIndex + 1) / learningData.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / learningData.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 점자 셀 표시 */}
      <div className="text-center mb-6">
        <BrailleCell
          pattern={braillePattern}
          size="large"
          label={currentItem.char}
        />
      </div>

      {/* 학습 내용 */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-fg mb-2">{currentItem.char}</h2>
          <p className="text-lg text-secondary">{currentItem.name}</p>
        </div>
        
        <div className="p-4 bg-card rounded-2xl border border-border">
          <p className="text-center text-lg mb-3">{currentItem.description}</p>
          
          {currentItem.examples.length > 0 && (
            <div>
              <p className="text-sm text-secondary mb-2">예시:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {currentItem.examples.map((example, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary text-black rounded-full text-sm"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 음성 명령 인터페이스 */}
      <div className="mb-6">
        <SpeechBar 
          isListening={isListening}
          transcript={transcript}
        />
        
        <div className="flex justify-center mt-4">
          <VoiceButton
            onStart={startSTT}
            onStop={stopSTT}
            isListening={isListening}
            size="lg"
          />
        </div>
      </div>

      {/* 컨트롤 버튼들 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="btn btn-ghost flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          <span>이전</span>
        </button>
        
        <button
          onClick={handleNext}
          className="btn btn-primary flex items-center justify-center space-x-2"
        >
          <span>{currentIndex === learningData.length - 1 ? '테스트' : '다음'}</span>
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <button
          onClick={handleRepeat}
          className="btn btn-ghost flex items-center justify-center space-x-2"
        >
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
          <span>반복</span>
        </button>
        
        <button
          onClick={handleStartTest}
          className="btn btn-accent flex items-center justify-center space-x-2"
        >
          <Play className="w-5 h-5" aria-hidden="true" />
          <span>테스트</span>
        </button>
      </div>

      {/* 음성 명령 힌트 */}
      <div className="mt-6 p-4 bg-card rounded-2xl border border-border">
        <h3 className="h3 mb-2">🎤 음성 명령</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-secondary">
          <div>• "다음" - 다음 항목</div>
          <div>• "이전" - 이전 항목</div>
          <div>• "반복" - 다시 듣기</div>
          <div>• "테스트" - 테스트 시작</div>
        </div>
      </div>

      {/* 토스트 알림 */}
      {showToast && (
        <ToastA11y
          message={toastMessage}
          type="info"
          onClose={() => setShowToast(false)}
        />
      )}
    </AppShellMobile>
  );
}
