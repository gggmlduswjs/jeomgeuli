import { useCallback } from "react";

type CommandHandlers = {
  next?: () => void;
  prev?: () => void;
  repeat?: () => void;
  pause?: () => void;
  start?: () => void;
  learn?: () => void;
  brailleOn?: () => void;
  brailleOff?: () => void;
};

export default function useVoiceCommands(handlers: CommandHandlers) {
  const onSpeech = useCallback((text: string) => {
    const t = (text || "").trim().toLowerCase();
    if (!t) return;

    // 더 폭넓은 키워드 매칭
    if (/(다음|넘겨|다음으로|계속|진행)/.test(t)) {
      console.log("Voice command: next");
      return handlers.next?.();
    }
    
    if (/(이전|뒤로|이전으로|뒤로가기)/.test(t)) {
      console.log("Voice command: prev");
      return handlers.prev?.();
    }
    
    if (/(반복|다시|재생|다시말해)/.test(t)) {
      console.log("Voice command: repeat");
      return handlers.repeat?.();
    }
    
    if (/(멈춰|정지|스탑|일시정지)/.test(t)) {
      console.log("Voice command: pause");
      return handlers.pause?.();
    }
    
    if (/(시작|재생|계속|시작해)/.test(t)) {
      console.log("Voice command: start");
      return handlers.start?.();
    }
    
    if (/(학습하기|학습|공부)/.test(t)) {
      console.log("Voice command: learn");
      return handlers.learn?.();
    }
    
    if (/(점자출력켜|점자켜|점자시작)/.test(t)) {
      console.log("Voice command: braille on");
      return handlers.brailleOn?.();
    }
    
    if (/(점자출력꺼|점자꺼|점자중지)/.test(t)) {
      console.log("Voice command: braille off");
      return handlers.brailleOff?.();
    }

    // 디버깅용
    console.log("Voice command not recognized:", t);
  }, [handlers]);

  return { onSpeech };
}