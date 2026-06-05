// heyvoca 백엔드 TTS API 호출 유틸 (heyvoca_front/src/utils/common.jsx의 getTextSound 포팅)
// 실서비스와 동일하게 /tts/resolve(presigned URL 반환)를 사용.
// 데모 단어는 배치 prewarm으로 미리 생성돼 있어 비로그인도 cache-hit → url을 받아 직접 재생.
// (미리 생성 안 된 텍스트는 비로그인이라 생성 경로를 못 타고 url이 없음 → 조용히 무음.)

const BACKEND_URL = 'https://heyvoca-back.ghmate.com';

let currentAudio: HTMLAudioElement | null = null;
let currentRequestId = 0;
let currentAudioResolve: (() => void) | null = null;

/**
 * 텍스트를 TTS로 재생. 새 호출이 들어오면 이전 재생/요청은 즉시 중단.
 * @param text 재생할 텍스트
 * @param lang 언어 코드 ('en' | 'ko')
 * @returns 재생 완료 시 resolve되는 Promise
 */
export async function getTextSound(text: string, lang: 'en' | 'ko' = 'en'): Promise<void> {
  if (typeof window === 'undefined') return;

  stopCurrentSound();

  const requestId = ++currentRequestId;
  const url = `${BACKEND_URL}/tts/resolve?text=${encodeURIComponent(text)}&language=${encodeURIComponent(lang)}`;

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      // 404(미캐시·비로그인) 등 — 무음으로 종료
      return;
    }
    if (requestId !== currentRequestId) return;

    const data = await res.json();
    if (requestId !== currentRequestId) return;

    const audioUrl: string | undefined = data && data.url;
    if (!audioUrl) return;

    const audio = new Audio(audioUrl);
    currentAudio = audio;

    return new Promise<void>((resolve) => {
      currentAudioResolve = resolve;

      const cleanup = () => {
        if (currentAudio === audio) {
          currentAudio = null;
        }
        if (currentAudioResolve === resolve) {
          currentAudioResolve = null;
        }
        resolve();
      };

      audio.addEventListener('ended', cleanup);
      audio.addEventListener('error', cleanup);

      audio.play().catch((err) => {
        console.error('오디오 재생 실패:', err);
        cleanup();
      });
    });
  } catch (err) {
    console.error('TTS 요청 실패:', err);
  }
}

export function stopCurrentSound(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio.src = '';
    currentAudio = null;
  }
  if (currentAudioResolve) {
    currentAudioResolve();
    currentAudioResolve = null;
  }
}
