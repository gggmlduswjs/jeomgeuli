import 'dotenv/config';
import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';
import { SpeechClient } from '@google-cloud/speech';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/stt' });

const PORT = Number(process.env.STT_STREAM_PORT || 8787);
const languageCode = process.env.STT_LANGUAGE || 'ko-KR';
const maxAlternatives = Number(process.env.STT_MAX_ALTS || 5);

const client = new SpeechClient(); // GOOGLE_APPLICATION_CREDENTIALS used

wss.on('connection', async (ws) => {
  let recognizeStream: any;

  function startStream() {
    // Domain phrase hints to bias recognition
    const phrases = [
      '학습', '학습하기', '학습 모드', '공부', '점자 학습',
      '자모', '자음', '모음', '자무', '잠오', '사모', '참호',
      '단어', '다워', '다오', '워드', 'word', '암호',
      '문장', '센턴스',
      '자유 변환', '자유변환', '변환',
      '퀴즈', '복습', '탐색', '정보 탐색',
      '뒤로', '이전', '뒤로 가', '뒤로가기', '이전으로',
      '홈', '메인', '처음으로', '홈으로', '메인으로',
      '메뉴', '목록',
      '다음', '넘겨', '계속', '진행',
      '반복', '다시', '다시 말해', '다시 읽어',
      '음성 꺼', '음성 켜', '음성 중지', '음성 멈춰',
      '점자 켜', '점자 꺼', '점자 연결', '점자 해제',
    ];
    recognizeStream = client
      .streamingRecognize({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode,
          enableAutomaticPunctuation: true,
          maxAlternatives,
          speechContexts: [{ phrases, boost: 20.0 }],
        },
        interimResults: true,
        singleUtterance: false,
      })
      .on('error', (err: any) => {
        try {
          ws.send(JSON.stringify({ type: 'error', error: String(err?.message || err) }));
        } catch {
          /* no-op */
        }
      })
      .on('data', (data: any) => {
        const result = data?.results?.[0];
        if (!result) return;
        const alts = (result.alternatives || []).map((a: any) => ({
          transcript: a.transcript || '',
          confidence: typeof a.confidence === 'number' ? a.confidence : undefined,
        }));
        try {
          ws.send(JSON.stringify({ type: 'result', final: !!result.isFinal, alternatives: alts }));
        } catch {
          /* no-op */
        }
      });
  }

  startStream();

  ws.on('message', (chunk: Buffer) => {
    try {
      recognizeStream?.write(chunk);
    } catch {
      try {
        ws.send(JSON.stringify({ type: 'error', error: 'write_failed' }));
      } catch {
        /* no-op */
      }
    }
  });

  ws.on('close', () => {
    try {
      recognizeStream?.end();
    } catch {
      /* no-op */
    }
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[STT] WebSocket gateway listening on ${PORT}`);
});


