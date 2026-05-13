import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EggCrack, Leaf, Plant, Carrot, Warning } from '@phosphor-icons/react';
import {
  memoryStatusMeta,
  memoryStatusOrder,
  type MemoryStatus,
} from '../../data/demoWords';

// 데모 칩 — 트랙을 따라 이동
interface ChipState {
  id: string;
  word: string;
  status: MemoryStatus;
}

const INITIAL_CHIPS: ChipState[] = [
  { id: 'c1', word: 'apple', status: 'unlearned' },
  { id: 'c2', word: 'serendipity', status: 'leaf' },
  { id: 'c3', word: 'accomplish', status: 'plant' },
  { id: 'c4', word: 'mellifluous', status: 'carrot' },
  { id: 'c5', word: 'ephemeral', status: 'overdue' },
];

const AUTO_STEP_MS = 4000;

// Phosphor 아이콘 매핑
function StatusIcon({ name, size = 22 }: { name: string; size?: number }) {
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

// 드래그 가능한 칩 — slot 내부에서 layoutId로 부드럽게 이동
function Chip({
  chip,
  onDropToStatus,
}: {
  chip: ChipState;
  onDropToStatus: (chipId: string, status: MemoryStatus) => void;
}) {
  const meta = memoryStatusMeta[chip.status];
  return (
    <motion.div
      layoutId={`chip-${chip.id}`}
      drag
      dragMomentum={false}
      dragElastic={0.12}
      dragSnapToOrigin
      whileDrag={{ scale: 1.1, zIndex: 50, cursor: 'grabbing' }}
      onDragEnd={(e) => {
        const pointer = e as PointerEvent;
        const x = pointer.clientX;
        const y = pointer.clientY;
        const target =
          typeof document !== 'undefined' ? document.elementFromPoint(x, y) : null;
        const slot = target?.closest('[data-status-slot]');
        if (!slot) return;
        const status = slot.getAttribute('data-status-slot') as MemoryStatus | null;
        if (status) onDropToStatus(chip.id, status);
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="cursor-grab select-none rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold shadow-raise"
      style={{
        borderColor: meta.color,
        backgroundColor: meta.bgColor,
        color: meta.color,
      }}
    >
      {chip.word}
    </motion.div>
  );
}

// 상태 슬롯(컬럼) — 칩이 들어가는 영역
function StatusSlot({
  status,
  chips,
  pulse,
  onDropToStatus,
}: {
  status: MemoryStatus;
  chips: ChipState[];
  pulse: boolean;
  onDropToStatus: (chipId: string, status: MemoryStatus) => void;
}) {
  const meta = memoryStatusMeta[status];

  return (
    <div
      data-status-slot={status}
      className="relative flex min-h-[200px] flex-col items-center rounded-2xl border bg-white p-4 transition"
      style={{
        borderColor: pulse ? meta.color : '#ECECEC',
        boxShadow: pulse ? `0 0 0 4px ${meta.color}22` : undefined,
      }}
    >
      {/* 상태 라벨 + 아이콘 */}
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border"
        style={{
          backgroundColor: meta.bgColor,
          color: meta.color,
          borderColor: meta.color,
        }}
      >
        <motion.span
          animate={pulse ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center"
        >
          <StatusIcon name={meta.iconName} size={20} />
        </motion.span>
      </div>
      <p className="mt-2 text-[13px] font-bold" style={{ color: meta.color }}>
        {meta.label}
      </p>
      <p className="mt-1 text-center text-[11px] leading-snug text-mute">
        {meta.description}
      </p>

      {/* 칩 컨테이너 */}
      <div className="mt-3 flex w-full flex-1 flex-wrap items-start justify-center gap-1.5">
        {chips.map((chip) => (
          <Chip key={chip.id} chip={chip} onDropToStatus={onDropToStatus} />
        ))}
      </div>

      {/* 글로우 효과 */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.35, scale: 1.05 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 -z-10 rounded-2xl"
            style={{ backgroundColor: meta.color, filter: 'blur(18px)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MemoryStatesDemo() {
  const [chips, setChips] = useState<ChipState[]>(INITIAL_CHIPS);
  const [pulseStatus, setPulseStatus] = useState<MemoryStatus | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // 4개 메인 상태 + overdue 별도
  const mainSlots: MemoryStatus[] = memoryStatusOrder; // unlearned, leaf, plant, carrot
  const allSlots: MemoryStatus[] = useMemo(
    () => [...mainSlots, 'overdue' as MemoryStatus],
    [mainSlots],
  );

  // 뷰포트 감지
  useEffect(() => {
    if (!rootRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setHasEntered(e.isIntersecting));
      },
      { threshold: 0.3 },
    );
    obs.observe(rootRef.current);
    return () => obs.disconnect();
  }, []);

  // prefers-reduced-motion
  const reducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // 자동 모드: 4초마다 가장 진행이 더딘 칩을 다음 상태로 전진
  useEffect(() => {
    if (!hasEntered || paused || reducedMotion) return;
    const t = window.setInterval(() => {
      setChips((prev) => {
        const order: MemoryStatus[] = ['unlearned', 'leaf', 'plant', 'carrot', 'overdue'];
        // overdue는 별도 트랙. 메인 트랙 칩 중 가장 뒤처진 것을 한 칸 전진.
        const mainOrder: MemoryStatus[] = ['unlearned', 'leaf', 'plant', 'carrot'];
        const mainChips = prev.filter((c) => mainOrder.includes(c.status));
        if (mainChips.length === 0) {
          // 모든 칩이 overdue로 갔으면 한 칩을 leaf로 복귀
          const next = [...prev];
          next[0] = { ...next[0], status: 'leaf' };
          setPulseStatus('leaf');
          return next;
        }
        const sorted = [...mainChips].sort(
          (a, b) => mainOrder.indexOf(a.status) - mainOrder.indexOf(b.status),
        );
        const target = sorted[0];
        const targetIdx = prev.indexOf(target);
        const curStatusIdx = mainOrder.indexOf(target.status);
        let nextStatus: MemoryStatus;
        if (curStatusIdx >= mainOrder.length - 1) {
          // carrot 도달 → unlearned로 리셋 (루프)
          nextStatus = 'unlearned';
        } else {
          nextStatus = mainOrder[curStatusIdx + 1];
        }
        setPulseStatus(nextStatus);
        const next = [...prev];
        next[targetIdx] = { ...target, status: nextStatus };
        return next;
      });
    }, AUTO_STEP_MS);
    return () => window.clearInterval(t);
  }, [hasEntered, paused, reducedMotion]);

  // 펄스 자동 해제
  useEffect(() => {
    if (!pulseStatus) return;
    const t = window.setTimeout(() => setPulseStatus(null), 700);
    return () => window.clearTimeout(t);
  }, [pulseStatus]);

  // 드래그 종료 → 칩을 새 상태로 이동
  const handleDropToStatus = useCallback((chipId: string, status: MemoryStatus) => {
    setPaused(true);
    setChips((prev) => prev.map((c) => (c.id === chipId ? { ...c, status } : c)));
    setPulseStatus(status);
    // 6초 후 자동 모드 재개
    window.setTimeout(() => setPaused(false), 6000);
  }, []);

  // 칩 그룹핑
  const chipsByStatus = useMemo(() => {
    const map = new Map<MemoryStatus, ChipState[]>();
    allSlots.forEach((s) => map.set(s, []));
    chips.forEach((c) => {
      const arr = map.get(c.status);
      if (arr) arr.push(c);
    });
    return map;
  }, [chips, allSlots]);

  return (
    <div ref={rootRef} className="space-y-4">
      {/* 메인 4단계: 모바일은 세로 / 데스크탑은 가로 4칸 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {mainSlots.map((s) => (
          <StatusSlot
            key={s}
            status={s}
            chips={chipsByStatus.get(s) ?? []}
            pulse={pulseStatus === s}
            onDropToStatus={handleDropToStatus}
          />
        ))}
      </div>

      {/* overdue: 하단 분기 */}
      <div className="mx-auto max-w-md">
        <StatusSlot
          status="overdue"
          chips={chipsByStatus.get('overdue') ?? []}
          pulse={pulseStatus === 'overdue'}
          onDropToStatus={handleDropToStatus}
        />
      </div>

      {/* 도움말 */}
      {!reducedMotion && (
        <p className="text-center text-caption text-mute">
          칩을 드래그해서 다른 단계로 옮겨보세요. 4초마다 자동으로도 한 단계씩 진행됩니다.
        </p>
      )}
      {reducedMotion && (
        <p className="text-center text-caption text-mute">
          단어가 학습량에 따라 5단계로 자라납니다.
        </p>
      )}
    </div>
  );
}
