import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EggCrack, Leaf, Plant, Carrot, Warning, SpeakerHigh, CaretDown } from '@phosphor-icons/react';
import {
  demoWords,
  memoryStatusMeta,
  nextStatusOnGood,
  type DemoWord,
  type MemoryStatus,
} from '../../data/demoWords';

const AUTO_ADVANCE_MS = 5500;

function StatusIcon({ name, size = 12 }: { name: string; size?: number }) {
  switch (name) {
    case 'EggCrack':
      return <EggCrack size={size} weight="fill" aria-hidden />;
    case 'Leaf':
      return <Leaf size={size} weight="fill" aria-hidden />;
    case 'Plant':
      return <Plant size={size} weight="fill" aria-hidden />;
    case 'Carrot':
      return <Carrot size={size} weight="fill" aria-hidden />;
    case 'Warning':
      return <Warning size={size} weight="fill" aria-hidden />;
    default:
      return null;
  }
}

function StatusBadge({ status }: { status: MemoryStatus }) {
  const meta = memoryStatusMeta[status];
  return (
    <motion.span
      layout
      className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-[11px] font-semibold"
      style={{ borderColor: `${meta.color}55`, color: meta.color }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={status}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="flex h-3 w-3 items-center justify-center"
        >
          <StatusIcon name={meta.iconName} size={12} />
        </motion.span>
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={`${status}-label`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {meta.label}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

function speak(text: string, lang = 'en-US') {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
  } catch {}
}

function HiddenPlaceholder({ label, onReveal, small = false }: { label: string; onReveal: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onReveal}
      className={`flex w-full items-center justify-between rounded-[8px] border border-dashed border-hairline bg-white text-left transition hover:border-ink ${
        small ? 'px-3 py-2 text-[12px]' : 'px-3.5 py-3 text-[13px]'
      } text-mute`}
    >
      <span>{label} 보기</span>
      <CaretDown size={14} aria-hidden />
    </button>
  );
}

interface CardFaceProps {
  word: DemoWord;
  revealedFlags: { meanings: boolean; example: boolean };
  onReveal: (key: 'meanings' | 'example') => void;
  onSpeak: (key: 'word' | 'meaning' | 'example', text: string, lang?: string) => void;
  speakingItem: string | null;
  status: MemoryStatus;
}

function CardFace({ word, revealedFlags, onReveal, onSpeak, speakingItem, status }: CardFaceProps) {
  const pos = word.pos;
  return (
    <div className="flex flex-col gap-5 p-5">
      {/* 상단: 상태 배지 + 품사 */}
      <div className="flex items-start justify-between">
        <StatusBadge status={status} />
        <span className="text-[11px] font-medium text-mute">{pos}</span>
      </div>

      {/* 단어 + 스피커 */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={`font-mono text-[26px] font-bold leading-tight ${
            speakingItem === 'word' ? 'text-primary-600' : 'text-ink'
          }`}
        >
          {word.word}
        </span>
        <button
          type="button"
          onClick={() => onSpeak('word', word.word, 'en-US')}
          aria-label={`${word.word} 발음 듣기`}
          className="mt-1.5 inline-flex items-center justify-center rounded p-1"
        >
          <SpeakerHigh
            weight="fill"
            size={16}
            color={speakingItem === 'word' ? '#FF70D4' : '#C5C5C5'}
            aria-hidden
          />
        </button>
      </div>
      <p className="-mt-3 text-[12px] text-mute">{word.ipa}</p>

      {/* 의미 */}
      {revealedFlags.meanings ? (
        <div className="flex flex-col gap-1.5">
          {word.meanings.map((m, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span
                className={`text-[13px] flex-1 ${
                  speakingItem === `meaning-${i}` ? 'text-primary-600' : 'text-sub'
                }`}
              >
                {m}
              </span>
              <button
                type="button"
                onClick={() => onSpeak('meaning', m, 'ko-KR')}
                aria-label={`${m} 듣기`}
                className="inline-flex items-center justify-center p-0.5"
              >
                <SpeakerHigh
                  weight="fill"
                  size={14}
                  color={speakingItem === `meaning-${i}` ? '#FF70D4' : '#C5C5C5'}
                  aria-hidden
                />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <HiddenPlaceholder label="뜻" onReveal={() => onReveal('meanings')} />
      )}

      {/* 예문 */}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-bold text-ink">예문</p>
        {revealedFlags.example ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <span
                className={`text-[13px] flex-1 ${
                  speakingItem === 'example-en' ? 'text-primary-600' : 'text-ink'
                }`}
              >
                {word.example.en}
              </span>
              <button
                type="button"
                onClick={() => onSpeak('example', word.example.en, 'en-US')}
                aria-label="예문 발음 듣기"
                className="mt-0.5 inline-flex items-center justify-center p-0.5"
              >
                <SpeakerHigh weight="fill" size={14} color={speakingItem === 'example-en' ? '#FF70D4' : '#C5C5C5'} aria-hidden />
              </button>
            </div>
            <p className="text-[12px] text-mute">{word.example.ko}</p>
          </div>
        ) : (
          <HiddenPlaceholder label="예문" onReveal={() => onReveal('example')} small />
        )}
      </div>
    </div>
  );
}

export interface StudyCardMetrics {
  index: number;
  revealedCount: number;
  doneCount: number;
  reviewSeen: number;
  newSeen: number;
  statusCounts: Record<MemoryStatus, number>;
  /** 단어별 현재 상태 (단어 인덱스 → 상태) */
  statusByWord: Record<number, MemoryStatus>;
  isPlaying: boolean;
}

function countByStatus(map: Record<number, MemoryStatus>): Record<MemoryStatus, number> {
  const acc: Record<MemoryStatus, number> = {
    unlearned: 0,
    leaf: 0,
    plant: 0,
    carrot: 0,
    overdue: 0,
  };
  Object.values(map).forEach((s) => {
    acc[s] = (acc[s] ?? 0) + 1;
  });
  return acc;
}

export default function StudyCardDemo({
  onMetricsChange,
}: {
  onMetricsChange?: (m: StudyCardMetrics) => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealMap, setRevealMap] = useState<Record<number, { meanings: boolean; example: boolean }>>({});
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [speakingItem, setSpeakingItem] = useState<string | null>(null);

  // 단어별 현재 상태 (초기값: demoWords.status)
  const [statusMap, setStatusMap] = useState<Record<number, MemoryStatus>>(() =>
    demoWords.reduce<Record<number, MemoryStatus>>((acc, w, i) => {
      acc[i] = w.status;
      return acc;
    }, {}),
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const word = demoWords[index];
  const currentStatus = statusMap[index] ?? word.status;
  const revealedFlags = revealMap[index] ?? { meanings: false, example: false };

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

  const markDone = useCallback((i: number) => {
    setDoneSet((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  }, []);

  const advanceStatus = useCallback((i: number) => {
    setStatusMap((prev) => {
      const cur = prev[i] ?? demoWords[i].status;
      const ns = nextStatusOnGood(cur);
      if (cur === ns) return prev;
      return { ...prev, [i]: ns };
    });
  }, []);

  // 자동 진행
  useEffect(() => {
    if (!hasEntered || !isPlaying) return;
    const reduced =
      typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const t = window.setTimeout(() => {
      // 단계 진화 → 카드 완료 → 다음 카드
      advanceStatus(index);
      markDone(index);
      if (index < demoWords.length - 1) {
        setDirection(1);
        setIndex((i) => i + 1);
      } else {
        setIsPlaying(false);
      }
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [index, hasEntered, isPlaying, advanceStatus, markDone]);

  // 메트릭 알림
  useEffect(() => {
    const revealedCount = Object.values(revealMap).filter((v) => v.meanings || v.example).length;
    onMetricsChange?.({
      index,
      revealedCount,
      doneCount: doneSet.size,
      reviewSeen: doneSet.size,
      newSeen: 0,
      statusCounts: countByStatus(statusMap),
      statusByWord: statusMap,
      isPlaying,
    });
  }, [index, revealMap, doneSet, statusMap, isPlaying, onMetricsChange]);

  const goNext = () => {
    if (index < demoWords.length - 1) {
      setIsPlaying(false);
      advanceStatus(index);
      markDone(index);
      setDirection(1);
      setIndex((i) => i + 1);
    }
  };
  const goPrev = () => {
    if (index > 0) {
      setIsPlaying(false);
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  };
  const togglePlay = () => setIsPlaying((p) => !p);

  const handleReveal = (k: 'meanings' | 'example') => {
    setRevealMap((m) => ({
      ...m,
      [index]: {
        meanings: k === 'meanings' ? true : m[index]?.meanings ?? false,
        example: k === 'example' ? true : m[index]?.example ?? false,
      },
    }));
    setIsPlaying(false);
  };

  const handleSpeak = (key: 'word' | 'meaning' | 'example', text: string, lang = 'en-US') => {
    setSpeakingItem(key === 'meaning' ? `meaning-${word.meanings.indexOf(text)}` : key === 'example' ? 'example-en' : 'word');
    speak(text, lang);
    setIsPlaying(false);
    window.setTimeout(() => setSpeakingItem(null), 1400);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const handleDragEnd = (_e: PointerEvent, info: { offset: { x: number } }) => {
    if (Math.abs(info.offset.x) > 60) {
      if (info.offset.x < 0) goNext();
      else goPrev();
    }
  };

  const isLast = index === demoWords.length - 1;

  return (
    <div ref={rootRef} className="relative">
      {/* iPhone 프레임 */}
      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="rounded-[44px] bg-ink p-[6px] shadow-card">
          <div className="relative overflow-hidden rounded-[38px] bg-white">
            <div className="absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-ink" />

            {/* 상태 바 */}
            <div className="flex items-center justify-between px-7 pt-2 text-[10px] font-semibold text-ink">
              <span>9:41</span>
              <span>●●●●</span>
            </div>

            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-6">
              <span className="text-[13px] font-semibold text-ink">오늘의 학습</span>
              <span className="text-[11px] font-semibold text-mute" aria-live="polite">
                {index + 1} / {demoWords.length}
              </span>
            </div>

            {/* 프로그레스 바 (실제 앱: 16px 높이 핑크) */}
            <div className="px-5 pt-2">
              <div className="relative h-[12px] w-full overflow-hidden rounded-full bg-primary-100">
                <motion.div
                  className="h-full rounded-full bg-primary-500"
                  initial={false}
                  animate={{ width: `${((index + 1) / demoWords.length) * 100}%` }}
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={demoWords.length}
                  aria-valuenow={index + 1}
                />
              </div>
            </div>

            {/* 카드 영역 — 실제 앱: bg-layout-gray-50 rounded-[12px] */}
            <div className="relative h-[420px] overflow-hidden px-5 pt-4">
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
                  className="absolute inset-x-5 top-4 bottom-4 overflow-y-auto rounded-[12px] bg-[#F5F5F5]"
                >
                  <CardFace
                    word={word}
                    revealedFlags={revealedFlags}
                    onReveal={handleReveal}
                    onSpeak={handleSpeak}
                    speakingItem={speakingItem}
                    status={currentStatus}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 하단 3버튼 — 실제 앱: 이전 / 재생·정지 / 다음 */}
            <div className="flex gap-2 px-5 py-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={index === 0}
                aria-label="이전 단어"
                className={`flex h-11 flex-1 items-center justify-center rounded-lg text-[14px] font-bold transition ${
                  index === 0
                    ? 'bg-[#F0F0F0] text-[#C5C5C5]'
                    : 'bg-[#C5C5C5] text-white hover:bg-ink'
                }`}
              >
                이전
              </button>
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? '자동 재생 정지' : '자동 재생'}
                className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[#C5C5C5] text-[14px] font-bold text-white transition hover:bg-ink"
              >
                {isPlaying ? '정지' : '재생'}
              </button>
              {!isLast ? (
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="다음 단어"
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-[#C5C5C5] text-[14px] font-bold text-white transition hover:bg-ink"
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIndex(0);
                    setRevealMap({});
                    setDoneSet(new Set());
                    setIsPlaying(true);
                    setStatusMap(
                      demoWords.reduce<Record<number, MemoryStatus>>((acc, w, i) => {
                        acc[i] = w.status;
                        return acc;
                      }, {}),
                    );
                  }}
                  aria-label="다시 시작"
                  className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary-500 text-[14px] font-bold text-white transition hover:bg-primary-600"
                >
                  종료
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-caption text-mute">
        자동 진행 또는 이전·다음으로 카드를 넘기며 단어가 단계별로 진화하는 모습을 확인해 보세요. 스와이프 · 키보드 ←/→ 도 가능.
      </p>
    </div>
  );
}
