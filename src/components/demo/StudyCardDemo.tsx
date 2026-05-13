import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, ArrowLeft, ArrowRight, ChevronDown, RotateCcw } from 'lucide-react';
import { demoWords, type DemoWord } from '../../data/demoWords';

const AUTO_ADVANCE_MS = 6500;
const SPRING = { type: 'spring' as const, stiffness: 380, damping: 36 };

function speak(text: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 0.95;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch {}
}

function CardFace({ word, revealed, onReveal, onSpeak }: {
  word: DemoWord;
  revealed: boolean;
  onReveal: () => void;
  onSpeak: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* Badge */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            word.badge.tone === 'review'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-surface text-sub'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              word.badge.tone === 'review' ? 'bg-primary-500' : 'bg-mute'
            }`}
          />
          {word.badge.label}
        </span>
        <span className="text-[11px] font-medium text-mute">{word.pos}</span>
      </div>

      {/* Word + speaker */}
      <div className="mt-6 flex items-start gap-3">
        <h3 className="font-mono text-[34px] font-bold leading-tight tracking-tight text-ink md:text-[40px]">
          {word.word}
        </h3>
        <button
          type="button"
          onClick={onSpeak}
          aria-label={`${word.word} 발음 듣기`}
          className="relative mt-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-sub transition hover:bg-primary-100 hover:text-primary-700 focus-visible:shadow-ring"
        >
          <Volume2 size={16} aria-hidden />
        </button>
      </div>
      <p className="mt-1 text-body-sm text-mute">{word.ipa}</p>

      {/* Meaning reveal */}
      <button
        type="button"
        onClick={onReveal}
        aria-expanded={revealed}
        className="mt-6 group flex w-full items-center justify-between rounded-2xl border border-hairline bg-white px-4 py-3 text-left text-body-sm font-medium text-sub transition hover:border-ink hover:text-ink focus-visible:shadow-ring"
      >
        <span>{revealed ? '뜻' : '뜻 보기'}</span>
        <ChevronDown
          size={16}
          aria-hidden
          className={`transition-transform ${revealed ? 'rotate-180 text-ink' : 'text-mute'}`}
        />
      </button>
      <AnimatePresence initial={false} mode="wait">
        {revealed && (
          <motion.div
            key={`mean-${word.word}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 rounded-2xl bg-surface px-4 py-3">
              <p className="text-body font-semibold text-ink">{word.meanings.join(' · ')}</p>
              <p className="text-body-sm text-sub">
                <span className="text-ink">"</span>
                {word.example.en}
                <span className="text-ink">"</span>
              </p>
              <p className="text-caption text-mute">{word.example.ko}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudyCardDemo({ onMetricsChange }: {
  onMetricsChange?: (m: { index: number; revealedCount: number; doneCount: number; reviewSeen: number; newSeen: number }) => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealedMap, setRevealedMap] = useState<Record<number, boolean>>({});
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasEntered, setHasEntered] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef<number | null>(null);

  const word = demoWords[index];

  // Viewport-enter: 첫 진입 시 자동 진행 시작
  useEffect(() => {
    if (!rootRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setHasEntered(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(rootRef.current);
    return () => obs.disconnect();
  }, []);

  // 자동 진행
  useEffect(() => {
    if (!hasEntered || paused) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = window.setTimeout(() => {
      if (index < demoWords.length - 1) {
        markDone(index);
        setDirection(1);
        setIndex((i) => i + 1);
      } else {
        markDone(index);
      }
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [index, hasEntered, paused]);

  const markDone = useCallback((i: number) => {
    setDoneSet((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  // Notify metrics
  useEffect(() => {
    const revealedCount = Object.values(revealedMap).filter(Boolean).length;
    let reviewSeen = 0;
    let newSeen = 0;
    doneSet.forEach((i) => {
      if (demoWords[i].badge.tone === 'review') reviewSeen += 1;
      else newSeen += 1;
    });
    onMetricsChange?.({
      index,
      revealedCount,
      doneCount: doneSet.size,
      reviewSeen,
      newSeen,
    });
  }, [index, revealedMap, doneSet, onMetricsChange]);

  const next = () => {
    setPaused(true);
    markDone(index);
    if (index < demoWords.length - 1) {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  };
  const prev = () => {
    setPaused(true);
    if (index > 0) {
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  };
  const reset = () => {
    setIndex(0);
    setRevealedMap({});
    setDoneSet(new Set());
    setPaused(false);
    setDirection(1);
  };

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    }
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handleDragEnd = (_e: PointerEvent, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 60) {
      if (info.offset.x < 0) next();
      else prev();
    }
  };

  const handleReveal = () => {
    setRevealedMap((m) => ({ ...m, [index]: !m[index] }));
    setPaused(true);
  };

  const isLast = index === demoWords.length - 1;
  const isDoneAll = doneSet.size === demoWords.length;

  return (
    <div ref={rootRef} className="relative">
      {/* Phone shell */}
      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="rounded-[44px] bg-ink p-[6px] shadow-card">
          <div className="relative overflow-hidden rounded-[38px] bg-white">
            {/* dynamic island */}
            <div className="absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-ink" />

            {/* status bar */}
            <div className="flex items-center justify-between px-7 pt-2 text-[10px] font-semibold text-ink">
              <span>9:41</span>
              <span>●●●●</span>
            </div>

            {/* progress bar */}
            <div className="px-5 pt-6">
              <div className="flex items-center justify-between text-[11px] font-semibold text-sub">
                <span>오늘의 학습</span>
                <span aria-live="polite">{index + 1} / {demoWords.length}</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                <motion.div
                  className="h-full rounded-full bg-primary-500"
                  initial={false}
                  animate={{ width: `${((index + 1) / demoWords.length) * 100}%` }}
                  transition={SPRING}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={demoWords.length}
                  aria-valuenow={index + 1}
                />
              </div>
            </div>

            {/* card stage */}
            <div className="relative h-[400px] overflow-hidden px-5 py-6">
              <AnimatePresence custom={direction} mode="wait" initial={false}>
                <motion.div
                  key={word.word}
                  custom={direction}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.15}
                  onDragEnd={handleDragEnd as any}
                  initial={{ opacity: 0, x: direction * 48 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -48 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-5"
                >
                  <CardFace
                    word={word}
                    revealed={!!revealedMap[index]}
                    onReveal={handleReveal}
                    onSpeak={() => speak(word.word)}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* controls */}
            <div className="flex items-center justify-between gap-2 border-t border-hairline px-5 py-4">
              <button
                type="button"
                onClick={prev}
                disabled={index === 0}
                aria-label="이전 단어"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-sub transition hover:bg-hairline disabled:opacity-30 disabled:hover:bg-surface focus-visible:shadow-ring"
              >
                <ArrowLeft size={16} aria-hidden />
              </button>

              <div className="flex gap-1.5" aria-hidden>
                {demoWords.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === index ? 'w-6 bg-ink' : doneSet.has(i) ? 'w-1.5 bg-primary-500' : 'w-1.5 bg-hairline'
                    }`}
                  />
                ))}
              </div>

              {isDoneAll ? (
                <button
                  type="button"
                  onClick={reset}
                  aria-label="처음부터"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[12px] font-semibold text-white transition hover:bg-primary-600 focus-visible:shadow-ring"
                >
                  <RotateCcw size={14} aria-hidden />
                  다시
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  disabled={isLast}
                  aria-label="다음 단어"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white transition hover:bg-primary-600 disabled:opacity-30 disabled:hover:bg-ink focus-visible:shadow-ring"
                >
                  <ArrowRight size={16} aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* helper hint */}
      <p className="mt-4 text-center text-caption text-mute">
        스와이프 · 키보드 ←/→ 로 카드를 넘길 수 있어요.
      </p>
    </div>
  );
}
