import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, ArrowLeft, ArrowRight, ChevronDown, RotateCcw, Check, X } from 'lucide-react';
import { EggCrack, Leaf, Plant, Carrot, Warning } from '@phosphor-icons/react';
import {
  demoWords,
  memoryStatusMeta,
  nextStatusOnBad,
  nextStatusOnGood,
  type DemoWord,
  type MemoryStatus,
} from '../../data/demoWords';

const AUTO_ADVANCE_MS = 6500;
const SPRING = { type: 'spring' as const, stiffness: 380, damping: 36 };

// Phosphor 아이콘 매핑 — memoryStatusMeta.iconName 기준
function StatusIcon({ name, size = 12, weight = 'fill' }: { name: string; size?: number; weight?: 'fill' | 'regular' }) {
  switch (name) {
    case 'EggCrack':
      return <EggCrack size={size} weight={weight} aria-hidden />;
    case 'Leaf':
      return <Leaf size={size} weight={weight} aria-hidden />;
    case 'Plant':
      return <Plant size={size} weight={weight} aria-hidden />;
    case 'Carrot':
      return <Carrot size={size} weight={weight} aria-hidden />;
    case 'Warning':
      return <Warning size={size} weight={weight} aria-hidden />;
    default:
      return null;
  }
}

// 상태 뱃지 — Framer Motion으로 색상/아이콘 부드럽게 전이
function StatusBadge({ status }: { status: MemoryStatus }) {
  const meta = memoryStatusMeta[status];
  return (
    <motion.span
      layout
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
      style={{
        borderColor: meta.color,
        backgroundColor: meta.bgColor,
        color: meta.color,
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 12 }}
          transition={{ duration: 0.25 }}
          className="flex h-3 w-3 items-center justify-center"
        >
          <StatusIcon name={meta.iconName} size={12} weight="fill" />
        </motion.span>
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${status}-label`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {meta.label}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

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

function CardFace({
  word,
  status,
  revealed,
  onReveal,
  onSpeak,
}: {
  word: DemoWord;
  status: MemoryStatus;
  revealed: boolean;
  onReveal: () => void;
  onSpeak: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* 상단: 5단계 상태 뱃지 + 품사 */}
      <div className="flex items-center justify-between">
        <StatusBadge status={status} />
        <span className="text-[11px] font-medium text-mute">{word.pos}</span>
      </div>

      {/* 단어 + 발음 버튼 */}
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

      {/* 뜻 펼치기 */}
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

// 상태별 카운트 집계
function countByStatus(statusMap: Record<number, MemoryStatus>): Record<MemoryStatus, number> {
  const acc: Record<MemoryStatus, number> = {
    unlearned: 0,
    leaf: 0,
    plant: 0,
    carrot: 0,
    overdue: 0,
  };
  Object.values(statusMap).forEach((s) => {
    acc[s] = (acc[s] ?? 0) + 1;
  });
  return acc;
}

export interface StudyCardMetrics {
  index: number;
  revealedCount: number;
  doneCount: number;
  // 기존 호환 필드
  reviewSeen: number;
  newSeen: number;
  // 5단계 카운터 (각 카드의 현재 상태 기준)
  statusCounts: Record<MemoryStatus, number>;
}

export default function StudyCardDemo({
  onMetricsChange,
}: {
  onMetricsChange?: (m: StudyCardMetrics) => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealedMap, setRevealedMap] = useState<Record<number, boolean>>({});
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [hasEntered, setHasEntered] = useState(false);

  // 각 카드의 현재 상태 (초기값은 demoWords의 status)
  const [statusMap, setStatusMap] = useState<Record<number, MemoryStatus>>(() =>
    demoWords.reduce<Record<number, MemoryStatus>>((acc, w, i) => {
      acc[i] = w.status;
      return acc;
    }, {}),
  );

  const rootRef = useRef<HTMLDivElement | null>(null);

  const word = demoWords[index];
  const currentStatus = statusMap[index] ?? word.status;

  // 뷰포트 진입 감지
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
      { threshold: 0.4 },
    );
    obs.observe(rootRef.current);
    return () => obs.disconnect();
  }, []);

  // 자동 진행 (수동 조작 시 일시정지)
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

  // 메트릭 알림
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
      statusCounts: countByStatus(statusMap),
    });
  }, [index, revealedMap, doneSet, statusMap, onMetricsChange]);

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
    // 상태도 초기 데이터로 복원
    setStatusMap(
      demoWords.reduce<Record<number, MemoryStatus>>((acc, w, i) => {
        acc[i] = w.status;
        return acc;
      }, {}),
    );
  };

  // 모르겠음 / 완벽 — 상태 전이
  const handleAnswer = (good: boolean) => {
    setPaused(true);
    setStatusMap((prev) => {
      const cur = prev[index] ?? demoWords[index].status;
      const nextStatus = good ? nextStatusOnGood(cur) : nextStatusOnBad(cur);
      if (cur === nextStatus) return prev;
      return { ...prev, [index]: nextStatus };
    });
    markDone(index);
  };

  // 키보드 단축키
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

  // 카드별 강조 색 (뱃지 색상을 progress 바 등에 살짝 반영)
  const statusColor = useMemo(() => memoryStatusMeta[currentStatus].color, [currentStatus]);

  return (
    <div ref={rootRef} className="relative">
      {/* iPhone 프레임 */}
      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="rounded-[44px] bg-ink p-[6px] shadow-card">
          <div className="relative overflow-hidden rounded-[38px] bg-white">
            {/* dynamic island */}
            <div className="absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-ink" />

            {/* 상단 상태 표시줄 */}
            <div className="flex items-center justify-between px-7 pt-2 text-[10px] font-semibold text-ink">
              <span>9:41</span>
              <span>●●●●</span>
            </div>

            {/* 진행 바 */}
            <div className="px-5 pt-6">
              <div className="flex items-center justify-between text-[11px] font-semibold text-sub">
                <span>오늘의 학습</span>
                <span aria-live="polite">
                  {index + 1} / {demoWords.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                <motion.div
                  className="h-full rounded-full"
                  initial={false}
                  animate={{
                    width: `${((index + 1) / demoWords.length) * 100}%`,
                    backgroundColor: statusColor,
                  }}
                  transition={SPRING}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={demoWords.length}
                  aria-valuenow={index + 1}
                />
              </div>
            </div>

            {/* 카드 영역 */}
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
                    status={currentStatus}
                    revealed={!!revealedMap[index]}
                    onReveal={handleReveal}
                    onSpeak={() => speak(word.word)}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 정답/오답 액션 버튼 */}
            <div className="grid grid-cols-2 gap-2 border-t border-hairline px-5 py-3">
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                aria-label="모르겠음"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-surface text-[13px] font-semibold text-sub transition hover:bg-hairline focus-visible:shadow-ring"
              >
                <X size={14} aria-hidden />
                모르겠음
              </button>
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                aria-label="완벽"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-ink text-[13px] font-semibold text-white transition hover:bg-primary-600 focus-visible:shadow-ring"
              >
                <Check size={14} aria-hidden />
                완벽
              </button>
            </div>

            {/* 컨트롤 (이전/다음 + 페이지 점) */}
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

      {/* 안내 문구 */}
      <p className="mt-4 text-center text-caption text-mute">
        모르겠음 · 완벽 버튼으로 암기 상태가 단계별로 진행돼요. 스와이프 · 키보드 ←/→ 도 가능.
      </p>
    </div>
  );
}
