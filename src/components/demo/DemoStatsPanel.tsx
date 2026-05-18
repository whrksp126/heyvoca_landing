import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EggCrack, Leaf, Plant, Carrot, Warning } from '@phosphor-icons/react';
import StudyCardDemo, { type StudyCardMetrics } from './StudyCardDemo';
import {
  demoWords,
  memoryStatusMeta,
  memoryStatusOrder,
  type MemoryStatus,
} from '../../data/demoWords';

function StatNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (value === prev.current) return;
    let raf = 0;
    const start = prev.current;
    const end = value;
    const startTs = performance.now();
    const dur = 380;
    const tick = (ts: number) => {
      const t = Math.min(1, (ts - startTs) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(start + (end - start) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = end;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{shown}</span>;
}

function StatusIcon({ name, size = 14 }: { name: string; size?: number }) {
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

function StatusRow({ status, value }: { status: MemoryStatus; value: number }) {
  const meta = memoryStatusMeta[status];
  return (
    <motion.li
      layout
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ backgroundColor: meta.bgColor }}
    >
      <span className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white"
          style={{ color: meta.color, borderColor: meta.color, borderWidth: 1 }}
        >
          <StatusIcon name={meta.iconName} size={12} />
        </span>
        <span className="text-[12px] font-semibold" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </span>
      <motion.span
        key={value}
        initial={{ scale: 0.7, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 540, damping: 24 }}
        className="text-heading-md font-bold tabular-nums"
        style={{ color: meta.color }}
      >
        <StatNumber value={value} />
      </motion.span>
    </motion.li>
  );
}

const initialCounts: Record<MemoryStatus, number> = demoWords.reduce(
  (acc, w) => {
    acc[w.status] = (acc[w.status] ?? 0) + 1;
    return acc;
  },
  { unlearned: 0, leaf: 0, plant: 0, carrot: 0, overdue: 0 } as Record<MemoryStatus, number>,
);

const initialStatusByWord: Record<number, MemoryStatus> = demoWords.reduce(
  (acc, w, i) => {
    acc[i] = w.status;
    return acc;
  },
  {} as Record<number, MemoryStatus>,
);

/**
 * 단어별 진화 미니맵 — 현재 단어에 포커스, 각 단어의 현재 단계를 점으로 표시.
 * 4 메인 단계(unlearned→leaf→plant→carrot) 위치 + overdue 별도 표시.
 */
function WordEvolutionMap({
  statusByWord,
  currentIndex,
}: {
  statusByWord: Record<number, MemoryStatus>;
  currentIndex: number;
}) {
  const order: MemoryStatus[] = [...memoryStatusOrder]; // 4단계
  const idxOf = (s: MemoryStatus) => order.indexOf(s);
  const listRef = useRef<HTMLUListElement | null>(null);

  // 현재 단어로 자동 스크롤
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-word-idx="${currentIndex}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentIndex]);

  return (
    <ul ref={listRef} className="scrollbar-pink max-h-[420px] space-y-3 overflow-y-auto pr-1">
      {demoWords.map((w, i) => {
        const status = statusByWord[i] ?? w.status;
        const isOverdue = status === 'overdue';
        const stepIndex = isOverdue ? -1 : idxOf(status);
        const isCurrent = i === currentIndex;
        const meta = memoryStatusMeta[status];

        return (
          <li
            key={w.id}
            data-word-idx={i}
            className={`rounded-xl px-3 py-2.5 transition-colors ${
              isCurrent ? 'bg-primary-100/40 ring-1 ring-primary-500/30' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`font-mono text-[13px] ${isCurrent ? 'font-bold text-ink' : 'text-sub'}`}>
                {w.word}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={status}
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: meta.bgColor, color: meta.color }}
                >
                  <StatusIcon name={meta.iconName} size={10} />
                  {meta.label}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* 4단계 진행 트랙 */}
            <div className="mt-2 flex items-center gap-1">
              {order.map((s, idx) => {
                const m = memoryStatusMeta[s];
                const reached = !isOverdue && idx <= stepIndex;
                return (
                  <div key={s} className="flex flex-1 items-center gap-1">
                    <motion.span
                      animate={{
                        backgroundColor: reached ? m.color : '#E5E5E5',
                        scale: idx === stepIndex && isCurrent ? 1.15 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="block h-1.5 w-1.5 rounded-full"
                    />
                    {idx < order.length - 1 && (
                      <motion.span
                        animate={{ backgroundColor: reached && idx < stepIndex ? m.color : '#E5E5E5' }}
                        className="block h-[2px] flex-1 rounded-full"
                      />
                    )}
                  </div>
                );
              })}
              {isOverdue && (
                <span
                  className="ml-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                  style={{ backgroundColor: memoryStatusMeta.overdue.bgColor, color: memoryStatusMeta.overdue.color }}
                >
                  지연
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function DemoStatsPanel() {
  const [m, setM] = useState<StudyCardMetrics>({
    index: 0,
    revealedCount: 0,
    doneCount: 0,
    reviewSeen: 0,
    newSeen: 0,
    statusCounts: initialCounts,
    statusByWord: initialStatusByWord,
    isPlaying: true,
  });

  const orderForDisplay: MemoryStatus[] = [...memoryStatusOrder, 'overdue'];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <div>
        <StudyCardDemo onMetricsChange={setM} />
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">이번 세션</p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-display-md font-bold text-ink tabular-nums">
              <StatNumber value={m.doneCount} />
            </p>
            <p className="text-body-sm text-mute">/ {demoWords.length} 단어</p>
          </div>

          <p className="mt-5 text-caption font-semibold uppercase tracking-[0.12em] text-mute">암기 단계 분포</p>
          <ul className="mt-2 space-y-1.5">
            {orderForDisplay.map((s) => (
              <StatusRow key={s} status={s} value={m.statusCounts[s] ?? 0} />
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">단어별 진화</p>
          <p className="mt-1 text-caption text-mute">
            카드가 넘어갈 때마다 해당 단어의 암기 단계가 한 칸씩 진화합니다.
          </p>
          <div className="mt-4">
            <WordEvolutionMap statusByWord={m.statusByWord} currentIndex={m.index} />
          </div>
        </div>
      </aside>
    </div>
  );
}
