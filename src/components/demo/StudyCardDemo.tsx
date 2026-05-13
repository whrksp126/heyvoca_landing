import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SpeakerHigh } from '@phosphor-icons/react';
import {
  demoWords,
  nextStatusOnGood,
  type DemoWord,
  type MemoryStatus,
} from '../../data/demoWords';
import MemorizationStatus from './MemorizationStatus';
import { getTextSound, stopCurrentSound } from '../../utils/tts';

const AUTO_ADVANCE_MS = 5500;

function HiddenPlaceholder({ label, onReveal, small = false }: { label: string; onReveal: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onReveal}
      className={`flex w-full items-center justify-center rounded-[8px] border border-dashed border-[#D6D6D6] text-[#9CA3AF] ${
        small ? 'py-[8px] text-[12px]' : 'py-[12px] text-[13px]'
      } font-normal transition hover:border-[#B0B0B0]`}
    >
      클릭해서 {label} 확인하기
    </button>
  );
}

interface CardFaceProps {
  word: DemoWord;
  revealedFlags: { meanings: boolean; example: boolean };
  onReveal: (key: 'meanings' | 'example') => void;
  onSpeak: (key: string, text: string, lang?: 'en' | 'ko') => void;
  speakingItem: string | null;
  status: MemoryStatus;
}

function CardFace({ word, revealedFlags, onReveal, onSpeak, speakingItem, status }: CardFaceProps) {
  return (
    <div className="flex flex-col gap-[25px] p-[20px]">
      {/* 상단: 암기 상태 뱃지 + 단어 + 의미 */}
      <div className="flex flex-col gap-[12px]">
        <div>
          <div className="mb-[5px]">
            <MemorizationStatus status={status} />
          </div>

          {/* 단어 + 스피커 */}
          <div className="flex items-start justify-between gap-[5px]">
            <span
              className={`flex-1 text-[24px] font-bold leading-[29px] ${
                speakingItem === 'word' ? 'text-primary-500' : 'text-ink'
              }`}
            >
              {word.word}
            </span>
            <motion.button
              type="button"
              onClick={() => onSpeak('word', word.word, 'en')}
              aria-label={`${word.word} 발음 듣기`}
              className="py-[3px]"
              whileTap={{ scale: 0.85 }}
            >
              <SpeakerHigh
                weight="fill"
                size={16}
                color={speakingItem === 'word' ? '#FF70D4' : '#C5C5C5'}
                aria-hidden
              />
            </motion.button>
          </div>

          {/* IPA */}
          <p className="mt-[2px] text-[13px] font-normal text-sub">{word.ipa}</p>
        </div>

        {/* 의미 — 실서비스: text-[13px] font-[400] 각 줄 + 우측 스피커 */}
        {revealedFlags.meanings ? (
          <div className="flex flex-col gap-[4px]">
            {word.meanings.map((m, i) => (
              <div key={i} className="flex items-center justify-between gap-[8px]">
                <span
                  className={`flex-1 text-[13px] font-normal leading-[16px] ${
                    speakingItem === `meaning-${i}` ? 'text-primary-500' : 'text-sub'
                  }`}
                >
                  {m}
                </span>
                <motion.button
                  type="button"
                  onClick={() => onSpeak(`meaning-${i}`, m, 'ko')}
                  aria-label={`${m} 듣기`}
                  whileTap={{ scale: 0.85 }}
                >
                  <SpeakerHigh
                    weight="fill"
                    size={16}
                    color={speakingItem === `meaning-${i}` ? '#FF70D4' : '#C5C5C5'}
                    aria-hidden
                  />
                </motion.button>
              </div>
            ))}
          </div>
        ) : (
          <HiddenPlaceholder label="의미" onReveal={() => onReveal('meanings')} />
        )}
      </div>

      {/* 예문 영역 */}
      <div className="flex flex-col gap-[8px]">
        <p className="text-[14px] font-bold text-ink">예문</p>
        {revealedFlags.example ? (
          <div className="flex flex-col gap-[10px]">
            {/* 예문 영문 */}
            <div className="flex items-start justify-between gap-[5px]">
              <span
                className={`flex-1 text-[14px] font-normal ${
                  speakingItem === 'example-en' ? 'text-primary-500' : 'text-ink'
                }`}
              >
                {word.example.en}
              </span>
              <motion.button
                type="button"
                onClick={() => onSpeak('example-en', word.example.en, 'en')}
                aria-label="예문 발음 듣기"
                className="mt-[2px] shrink-0"
                whileTap={{ scale: 0.85 }}
              >
                <SpeakerHigh
                  weight="fill"
                  size={16}
                  color={speakingItem === 'example-en' ? '#FF70D4' : '#C5C5C5'}
                  aria-hidden
                />
              </motion.button>
            </div>
            {/* 예문 한글 */}
            <div className="flex items-start justify-between gap-[8px]">
              <span
                className={`flex-1 text-[13px] font-normal ${
                  speakingItem === 'example-ko' ? 'text-primary-500' : 'text-[#7B7B7B]'
                }`}
              >
                {word.example.ko}
              </span>
              <motion.button
                type="button"
                onClick={() => onSpeak('example-ko', word.example.ko, 'ko')}
                aria-label="예문 한글 듣기"
                className="mt-[2px] shrink-0"
                whileTap={{ scale: 0.85 }}
              >
                <SpeakerHigh
                  weight="fill"
                  size={16}
                  color={speakingItem === 'example-ko' ? '#FF70D4' : '#C5C5C5'}
                  aria-hidden
                />
              </motion.button>
            </div>
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

  // 스크롤 진입 감지 → 자동 재생 시작
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

  // 언마운트 시 재생 중인 오디오 정리
  useEffect(() => {
    return () => {
      stopCurrentSound();
    };
  }, []);

  const goNext = () => {
    if (index < demoWords.length - 1) {
      stopCurrentSound();
      setIsPlaying(false);
      advanceStatus(index);
      markDone(index);
      setDirection(1);
      setIndex((i) => i + 1);
    }
  };
  const goPrev = () => {
    if (index > 0) {
      stopCurrentSound();
      setIsPlaying(false);
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  };
  const togglePlay = () => {
    setIsPlaying((p) => {
      if (p) stopCurrentSound();
      return !p;
    });
  };

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

  const handleSpeak = (key: string, text: string, lang: 'en' | 'ko' = 'en') => {
    setSpeakingItem(key);
    setIsPlaying(false);
    getTextSound(text, lang).then(() => {
      setSpeakingItem((prev) => (prev === key ? null : prev));
    });
  };

  // 키보드 ←/→
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

  // 스와이프
  const handleDragEnd = (_e: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const SWIPE_OFFSET = 80;
    const SWIPE_VELOCITY = 500;
    const swipedFar = Math.abs(info.offset.x) > SWIPE_OFFSET;
    const swipedFast = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    if (!swipedFar && !swipedFast) return;
    if (info.offset.x < 0 && index < demoWords.length - 1) goNext();
    else if (info.offset.x > 0 && index > 0) goPrev();
  };

  const isLast = index === demoWords.length - 1;
  const totalCards = demoWords.length;

  // 카드 슬라이드 variants — 실서비스 동일 (x ±100%)
  const cardVariants = {
    enter: (dir: 1 | -1) => ({ x: dir === 1 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) => ({ x: dir === 1 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div ref={rootRef} className="relative">
      {/* iPhone 프레임 */}
      <div className="relative mx-auto w-full max-w-[360px]">
        <div className="rounded-[44px] bg-ink p-[6px] shadow-card">
          <div className="relative overflow-hidden rounded-[38px] bg-white">
            <div className="absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-ink" />

            {/* 상태바 */}
            <div className="flex items-center justify-between px-7 pt-2 text-[10px] font-semibold text-ink">
              <span>9:41</span>
              <span>●●●●</span>
            </div>

            {/* StudyHeader — 단순화 (좌: 뒤로가기, 우: 설정) */}
            <div className="flex items-center justify-between px-[20px] pt-6">
              <span className="text-[14px] font-semibold text-ink">오늘의 학습</span>
              <span className="text-[12px] font-semibold text-mute">{index + 1} / {totalCards}</span>
            </div>

            {/* 프로그레스 바 — 실서비스: h-[16px] rounded-[50px] */}
            <div className="px-[20px] pt-[5px]">
              <motion.div className="relative mb-[8px] h-[16px] w-full overflow-hidden rounded-[50px] bg-primary-100">
                <motion.div
                  className="h-full rounded-[50px] bg-primary-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((index + 1) / totalCards) * 100}%` }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={totalCards}
                  aria-valuenow={index + 1}
                />
                <span
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#7b7b7b]"
                  style={{ letterSpacing: '-0.2px' }}
                >
                  {index + 1}/{totalCards}
                </span>
              </motion.div>
            </div>

            {/* 카드 영역 — 실서비스: bg-layout-gray-50 #F5F5F5, rounded-[12px], p-[20px] */}
            <div className="relative h-[460px] overflow-hidden px-[20px] pt-[15px]">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={index}
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd as any}
                  className="absolute inset-x-[20px] top-[15px] bottom-0 overflow-y-auto rounded-[12px] bg-[#F5F5F5]"
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

            {/* 하단 3버튼 — 실서비스: h-[45px] rounded-[8px] text-[16px] font-[700] */}
            <div className="flex gap-[10px] px-[20px] pb-[20px] pt-[20px]">
              {/* 이전 */}
              <motion.button
                type="button"
                onClick={index > 0 ? goPrev : undefined}
                disabled={index === 0}
                aria-label="이전 단어"
                className={`flex h-[45px] flex-1 items-center justify-center rounded-[8px] text-[16px] font-bold ${
                  index === 0
                    ? 'bg-[#F0F0F0] text-[#C5C5C5]'
                    : 'bg-[#C5C5C5] text-white'
                }`}
                whileTap={index > 0 ? { scale: 0.95 } : undefined}
              >
                이전
              </motion.button>

              {/* 재생/정지 */}
              <motion.button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? '자동 재생 정지' : '자동 재생'}
                className="flex h-[45px] flex-1 items-center justify-center rounded-[8px] bg-[#C5C5C5] text-[16px] font-bold text-white"
                whileTap={{ scale: 0.95 }}
              >
                {isPlaying ? '정지' : '재생'}
              </motion.button>

              {/* 다음 / 종료 */}
              {!isLast ? (
                <motion.button
                  type="button"
                  onClick={goNext}
                  aria-label="다음 단어"
                  className="flex h-[45px] flex-1 items-center justify-center rounded-[8px] bg-[#C5C5C5] text-[16px] font-bold text-white"
                  whileTap={{ scale: 0.95 }}
                >
                  다음
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => {
                    stopCurrentSound();
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
                  className="flex h-[45px] flex-1 items-center justify-center rounded-[8px] bg-primary-500 text-[16px] font-bold text-white"
                  whileTap={{ scale: 0.95 }}
                >
                  종료
                </motion.button>
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
