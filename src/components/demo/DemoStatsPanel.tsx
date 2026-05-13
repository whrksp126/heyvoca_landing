import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import StudyCardDemo from './StudyCardDemo';

interface Metrics {
  index: number;
  revealedCount: number;
  doneCount: number;
  reviewSeen: number;
  newSeen: number;
}

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

export default function DemoStatsPanel() {
  const [m, setM] = useState<Metrics>({
    index: 0,
    revealedCount: 0,
    doneCount: 0,
    reviewSeen: 0,
    newSeen: 0,
  });

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
            <p className="text-body-sm text-mute">/ 3 단어</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-body-sm">
            <div className="rounded-xl bg-surface p-3">
              <p className="text-caption text-mute">처음 본 단어</p>
              <p className="mt-1 text-heading-md font-semibold text-ink tabular-nums">
                <StatNumber value={m.newSeen} />
              </p>
            </div>
            <div className="rounded-xl bg-primary-100 p-3">
              <p className="text-caption text-primary-700">다시 만난 단어</p>
              <p className="mt-1 text-heading-md font-semibold text-primary-700 tabular-nums">
                <StatNumber value={m.reviewSeen} />
              </p>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">다음 복습</p>
          <ul className="mt-3 space-y-2 text-body-sm">
            <Row label="serendipity" right="3일 뒤" pinned={m.doneCount >= 1} />
            <Row label="accomplish" right="7일 뒤" pinned={m.doneCount >= 2} />
            <Row label="mellifluous" right="3일 뒤" pinned={m.doneCount >= 3} />
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
