import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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

// 상태별 아이콘 (DemoStatsPanel 전용 — StudyCardDemo와 동일 매핑)
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

// 카운터 한 줄
function StatusRow({
  status,
  value,
}: {
  status: MemoryStatus;
  value: number;
}) {
  const meta = memoryStatusMeta[status];
  return (
    <motion.li
      layout
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ backgroundColor: meta.bgColor }}
    >
      <span className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-full"
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

export default function DemoStatsPanel() {
  const [m, setM] = useState<StudyCardMetrics>({
    index: 0,
    revealedCount: 0,
    doneCount: 0,
    reviewSeen: 0,
    newSeen: 0,
    statusCounts: initialCounts,
  });

  // 상태별 5칸 + overdue
  const orderForDisplay: MemoryStatus[] = [...memoryStatusOrder, 'overdue'];

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <div>
        <StudyCardDemo onMetricsChange={setM} />
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">
            이번 세션
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-display-md font-bold text-ink tabular-nums">
              <StatNumber value={m.doneCount} />
            </p>
            <p className="text-body-sm text-mute">/ {demoWords.length} 단어</p>
          </div>

          {/* 5단계 상태별 카운터 */}
          <p className="mt-5 text-caption font-semibold uppercase tracking-[0.12em] text-mute">
            암기 단계 분포
          </p>
          <ul className="mt-2 space-y-1.5">
            {orderForDisplay.map((s) => (
              <StatusRow key={s} status={s} value={m.statusCounts[s] ?? 0} />
            ))}
          </ul>
        </div>

        <div className="card p-5">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">
            다음 복습 예정
          </p>
          <ul className="mt-3 space-y-2 text-body-sm">
            {demoWords.map((w, i) => (
              <Row
                key={w.word}
                label={w.word}
                right={`${w.interval}일 뒤`}
                pinned={m.doneCount >= i + 1}
              />
            ))}
          </ul>
          <p className="mt-4 text-caption text-mute">
            난이도와 정답률에 따라, 다음 복습 시점이 단어별로 다르게 계산됩니다.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, right, pinned }: { label: string; right: string; pinned: boolean }) {
  return (
    <li className="flex items-center justify-between">
      <span className={`font-mono text-body-sm ${pinned ? 'text-ink' : 'text-mute'}`}>{label}</span>
      <motion.span
        initial={false}
        animate={{ opacity: pinned ? 1 : 0.3, x: pinned ? 0 : 4 }}
        transition={{ duration: 0.3 }}
        className="text-caption text-sub"
      >
        {right}
      </motion.span>
    </li>
  );
}
