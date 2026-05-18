import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useMotionValueEvent } from 'framer-motion';
import { EggCrack, Leaf, Plant, Carrot, Warning } from '@phosphor-icons/react';
import {
  memoryStatusMeta,
  type MemoryStatus,
} from '../../data/demoWords';

const ICON_MAP = {
  EggCrack,
  Leaf,
  Plant,
  Carrot,
  Warning,
} as const;

const SEQUENCE: MemoryStatus[] = ['unlearned', 'leaf', 'plant', 'carrot', 'overdue'];

const DEMO_WORD = {
  word: 'serendipity',
  ipa: '/ˌserənˈdɪpəti/',
  meaning: '뜻밖의 행운, 우연한 발견',
};

const STAGE_DURATION = {
  unlearned: '처음 만난 단어',
  leaf: '며칠 안에 다시',
  plant: '한 달 가까이',
  carrot: '두 달 이상 단단히',
  overdue: '복습 시점이 지남',
} satisfies Record<MemoryStatus, string>;

export default function MemoryEvolutionDemo() {
  const [stageIdx, setStageIdx] = useState(0);
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (prefersReduced) return;
    const idx = Math.min(SEQUENCE.length - 1, Math.max(0, Math.floor(p * SEQUENCE.length)));
    setStageIdx(idx);
  });

  const currentStatus = SEQUENCE[stageIdx];
  const currentMeta = memoryStatusMeta[currentStatus];
  const CurrentIcon = ICON_MAP[currentMeta.iconName];

  return (
    <div ref={sectionRef} className="card relative overflow-hidden p-6 md:p-8">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">
          암기 상태 진화
        </p>
        <span className="text-caption text-mute">5단계</span>
      </div>

      {/* 진화하는 단어 카드 */}
      <div
        className="mb-6 rounded-[14px] border p-4 transition-colors"
        style={{
          backgroundColor: currentMeta.bgColor,
          borderColor: currentMeta.color + '33',
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <AnimatePresence mode="wait">
            <motion.span
              key={currentStatus}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                color: currentMeta.color,
                backgroundColor: '#ffffff',
                border: `1px solid ${currentMeta.color}33`,
              }}
            >
              <CurrentIcon size={13} weight="bold" />
              {currentMeta.label}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10px] text-mute">{STAGE_DURATION[currentStatus]}</span>
        </div>
        <p className="font-mono text-[22px] font-bold tracking-tight text-ink">
          {DEMO_WORD.word}
        </p>
        <p className="mt-0.5 text-[11px] text-mute">{DEMO_WORD.ipa}</p>
        <p className="mt-2 text-body-sm text-sub">{DEMO_WORD.meaning}</p>
      </div>

      {/* 5단계 진화 리스트 */}
      <div className="relative">
        <div
          className="absolute left-[19px] top-3 bottom-3 w-px bg-hairline"
          aria-hidden="true"
        />
        <ul className="space-y-4">
          {(['unlearned', 'leaf', 'plant', 'carrot'] as MemoryStatus[]).map((key) => {
            const meta = memoryStatusMeta[key];
            const Icon = ICON_MAP[meta.iconName];
            const isActive = key === currentStatus;
            const isPast = SEQUENCE.indexOf(key) < stageIdx && currentStatus !== 'overdue';

            return (
              <li key={key} className="relative flex items-start gap-4">
                <motion.span
                  animate={{
                    scale: isActive ? 1.08 : 1,
                    boxShadow: isActive
                      ? `0 0 0 4px ${meta.color}22`
                      : '0 0 0 0px transparent',
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10 inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border"
                  style={{
                    color: isActive || isPast ? meta.color : '#C5C5C5',
                    backgroundColor: isActive ? meta.bgColor : '#ffffff',
                    borderColor: isActive ? meta.color : 'var(--hairline, #E5E5E5)',
                  }}
                >
                  <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
                </motion.span>
                <div className="flex flex-1 flex-col pt-0.5">
                  <div className="flex items-center gap-2">
                    <p
                      className="text-body font-semibold transition-colors"
                      style={{ color: isActive ? meta.color : 'var(--ink, #111)' }}
                    >
                      {meta.label}
                    </p>
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-body-sm text-sub">{meta.description}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 별도 분기 — 복습 지연 */}
      <div className="mt-6 border-t border-dashed border-hairline pt-5">
        <p className="mb-3 text-caption font-semibold uppercase tracking-[0.12em] text-mute">
          별도 분기
        </p>
        {(() => {
          const meta = memoryStatusMeta.overdue;
          const Icon = ICON_MAP[meta.iconName];
          const isActive = currentStatus === 'overdue';
          return (
            <div className="flex items-start gap-4">
              <motion.span
                animate={{
                  scale: isActive ? 1.08 : 1,
                  boxShadow: isActive
                    ? `0 0 0 4px ${meta.color}22`
                    : '0 0 0 0px transparent',
                }}
                transition={{ duration: 0.3 }}
                className="relative inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-dashed"
                style={{
                  color: meta.color,
                  backgroundColor: isActive ? meta.bgColor : '#ffffff',
                  borderColor: meta.color,
                }}
              >
                <Icon size={20} weight={isActive ? 'fill' : 'regular'} />
              </motion.span>
              <div className="flex flex-1 flex-col pt-0.5">
                <div className="flex items-center gap-2">
                  <p
                    className="text-body font-semibold transition-colors"
                    style={{ color: isActive ? meta.color : 'var(--ink, #111)' }}
                  >
                    {meta.label}
                  </p>
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: meta.color }}
                    aria-hidden="true"
                  />
                </div>
                <p className="text-body-sm text-sub">
                  복습 시점을 놓친 단어 — 별도 큐로 우선 관리
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
