// AI 추천 테스트 데모의 우측 사이드 패널 — 진행률, 문제 유형 분포, 단어별 진화
// TestPlayDemo의 metrics를 받아 시각화

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EggCrack, Leaf, Plant, Carrot, Warning } from '@phosphor-icons/react';
import TestPlayDemo, { type TestMetrics } from './TestPlayDemo';
import {
  demoWords,
  memoryStatusMeta,
  memoryStatusOrder,
  type MemoryStatus,
} from '../../data/demoWords';

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

const TYPE_META: Record<string, { label: string; color: string }> = {
  multipleChoice: { label: '4지선다', color: '#2E90FA' },
  multipleChoiceListening: { label: '듣기 4지선다', color: '#7C3AED' },
  fillInTheBlank: { label: '빈칸 채우기', color: '#F79009' },
  cardMatch: { label: '카드 매칭', color: '#FF70D4' },
  cardMatchListening: { label: '듣기 매칭', color: '#22C55E' },
};

function WordEvolutionList({ statusByWord, statusBefore }: { statusByWord: Record<number, MemoryStatus>; statusBefore: Record<number, MemoryStatus> }) {
  const order: MemoryStatus[] = [...memoryStatusOrder];
  const idxOf = (s: MemoryStatus) => order.indexOf(s);

  return (
    <ul className="scrollbar-pink max-h-[420px] space-y-3 overflow-y-auto pr-1">
      {demoWords.map((w) => {
        const before = statusBefore[w.id] ?? w.status;
        const after = statusByWord[w.id] ?? before;
        const changed = before !== after;
        const isOverdue = after === 'overdue';
        const stepIndex = isOverdue ? -1 : idxOf(after);
        const meta = memoryStatusMeta[after];

        return (
          <li
            key={w.id}
            className={`rounded-xl px-3 py-2.5 transition-colors ${
              changed ? 'bg-primary-100/40 ring-1 ring-primary-500/30' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className={`text-[13px] ${changed ? 'font-bold text-ink' : 'text-sub'}`}>
                {w.word}
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={after}
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
                        scale: idx === stepIndex && changed ? 1.15 : 1,
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

export default function TestDemoPanel() {
  const initialStatus: Record<number, MemoryStatus> = demoWords.reduce(
    (acc, w) => {
      acc[w.id] = w.status;
      return acc;
    },
    {} as Record<number, MemoryStatus>,
  );

  const [m, setM] = useState<TestMetrics>({
    progressIndex: 0,
    total: 14,
    statusByWord: initialStatus,
    typeCounts: {},
  });

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-14">
      <div>
        <TestPlayDemo onMetricsChange={setM} />
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">이번 테스트</p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-display-md font-bold text-ink tabular-nums">{m.progressIndex}</p>
            <p className="text-body-sm text-mute">/ {m.total} 문제</p>
          </div>

          <p className="mt-5 text-caption font-semibold uppercase tracking-[0.12em] text-mute">문제 유형 분포</p>
          <ul className="mt-2 space-y-1.5">
            {Object.entries(m.typeCounts).map(([type, count]) => {
              const meta = TYPE_META[type];
              if (!meta) return null;
              return (
                <li
                  key={type}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5"
                  style={{ backgroundColor: `${meta.color}15` }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="block h-2 w-2 rounded-full"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden
                    />
                    <span className="text-[12px] font-semibold" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                  </span>
                  <span className="text-heading-md font-bold tabular-nums" style={{ color: meta.color }}>
                    {count}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card p-5">
          <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">단어별 진화</p>
          <p className="mt-1 text-caption text-mute">
            정답일 때 해당 단어의 암기 단계가 한 칸씩 진화합니다.
          </p>
          <div className="mt-4">
            <WordEvolutionList statusByWord={m.statusByWord} statusBefore={initialStatus} />
          </div>
        </div>
      </aside>
    </div>
  );
}
