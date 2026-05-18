const SUCCESS_SRC = '/audio/success.mp3';
const ERROR_SRC = '/audio/error.mp3';

export function playSuccessSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio(SUCCESS_SRC);
    audio.volume = 0.5;
    void audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

export function playErrorSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio(ERROR_SRC);
    audio.volume = 0.5;
    void audio.play().catch(() => {});
  } catch {
    // ignore
  }
}
