import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle } from '@phosphor-icons/react';
import { demoVocaBooks, type DemoVocaBook } from '../../data/demoVocaBooks';

type UserLevel = 1 | 2 | 3;
type Pos = 'noun' | 'verb' | 'adj' | 'adv';

const levelLabels: Record<UserLevel, string> = {
  1: '초급',
  2: '중급',
  3: '상급',
};

const posMeta: Record<Pos, { label: string; color: string }> = {
  noun: { label: '명사', color: '#74D5FF' },
  verb: { label: '동사', color: '#FF70D4' },
  adj: { label: '형용사', color: '#42F98B' },
  adv: { label: '부사', color: '#FFBD3C' },
};

// 단어장별 품사 비중 (대략적 추정 — 사용자 시각화 데모용)
const bookPosBias: Record<string, Record<Pos, number>> = {
  'toeic-basic':     { noun: 0.40, verb: 0.30, adj: 0.20, adv: 0.10 },
  'toeic-advanced':  { noun: 0.42, verb: 0.33, adj: 0.17, adv: 0.08 },
  'suneung-core':    { noun: 0.30, verb: 0.30, adj: 0.25, adv: 0.15 },
  'suneung-deep':    { noun: 0.28, verb: 0.25, adj: 0.32, adv: 0.15 },
  'biz-english':     { noun: 0.25, verb: 0.50, adj: 0.15, adv: 0.10 },
  'daily-talk':      { noun: 0.25, verb: 0.45, adj: 0.20, adv: 0.10 },
  'ielts-academic':  { noun: 0.45, verb: 0.25, adj: 0.20, adv: 0.10 },
  'reading-news':    { noun: 0.35, verb: 0.20, adj: 0.30, adv: 0.15 },
};

const ACCURACY_STEPS = [55, 70, 85, 95] as const;
type Accuracy = (typeof ACCURACY_STEPS)[number];

function cycleAccuracy(current: Accuracy): Accuracy {
  const idx = ACCURACY_STEPS.indexOf(current);
  return ACCURACY_STEPS[(idx + 1) % ACCURACY_STEPS.length];
}

// 정답률 막대 — 클릭 시 다음 단계로 순환
function AccuracyBar({
  pos,
  value,
  isWeakest,
  onClick,
}: {
  pos: Pos;
  value: Accuracy;
  isWeakest: boolean;
  onClick: () => void;
}) {
  const meta = posMeta[pos];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left transition focus-visible:shadow-ring"
      aria-label={`${meta.label} 정답률 ${value}% — 클릭하여 변경`}
    >
      <div className="flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
          {meta.label}
          {isWeakest && (
            <span className="ml-1 inline-flex rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-500">
              약점
            </span>
          )}
        </span>
        <span className="tabular-nums font-semibold text-sub">{value}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: meta.color }}
          initial={false}
          animate={{ width: `${value}%` }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        />
      </div>
    </button>
  );
}

function BookCard({
  book,
  score,
  rank,
  weakness,
}: {
  book: DemoVocaBook;
  score: number;
  rank: number;
  weakness: Pos;
}) {
  const bias = bookPosBias[book.id] ?? { noun: 0.25, verb: 0.25, adj: 0.25, adv: 0.25 };
  const weakRatio = Math.round(bias[weakness] * 100);
  const weakMeta = posMeta[weakness];

  return (
    <motion.div
      layout
      layoutId={`book-${book.id}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="relative flex gap-3 rounded-2xl border border-hairline bg-white p-3 shadow-raise"
    >
      {rank === 0 && (
        <span className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-card">
          <Sparkle size={10} weight="fill" aria-hidden />
          BEST 추천
        </span>
      )}

      <div
        className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: `${book.color}22` }}
      >
        <img src={book.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: book.color }}>
          {book.category}
        </p>
        <h4 className="mt-0.5 text-body-sm font-bold text-ink">{book.name}</h4>
        <p className="mt-0.5 text-caption text-mute">
          {book.wordCount.toLocaleString()}단어 · {levelLabels[book.level]}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: `${weakMeta.color}26`, color: weakMeta.color }}
          >
            {weakMeta.label} {weakRatio}%
          </span>
          <span className="text-[11px] font-semibold tabular-nums text-sub">
            {Math.round(score * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition focus-visible:shadow-ring ${
        active ? 'bg-ink text-white' : 'bg-surface text-sub hover:bg-hairline'
      }`}
    >
      {children}
    </button>
  );
}

export default function TestRecommendDemo() {
  const [level, setLevel] = useState<UserLevel>(2);
  const [accuracy, setAccuracy] = useState<Record<Pos, Accuracy>>({
    noun: 95,
    verb: 70,
    adj: 85,
    adv: 85,
  });

  const weakness: Pos = useMemo(() => {
    const entries = Object.entries(accuracy) as [Pos, Accuracy][];
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  }, [accuracy]);

  const ranked = useMemo(() => {
    const scored = demoVocaBooks.map((b) => {
      const bias = bookPosBias[b.id] ?? { noun: 0.25, verb: 0.25, adj: 0.25, adv: 0.25 };
      const weaknessFit = bias[weakness]; // 0~1
      const levelDist = Math.abs(b.level - level) / 2;
      const levelScore = 1 - levelDist;
      // 약점 매치 65% + 레벨 매치 35%
      const score = weaknessFit * 0.65 + levelScore * 0.35;
      return { book: b, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4);
  }, [weakness, level]);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
      {/* 좌측 컨트롤 */}
      <div className="card p-5">
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">내 학습 프로필</p>

        <div className="mt-4">
          <p className="text-[13px] font-semibold text-ink">현재 레벨</p>
          <div className="mt-2 flex items-center gap-2" role="radiogroup" aria-label="레벨 선택">
            {([1, 2, 3] as UserLevel[]).map((lv) => (
              <ChipButton key={lv} active={level === lv} onClick={() => setLevel(lv)}>
                {levelLabels[lv]}
              </ChipButton>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[13px] font-semibold text-ink">품사별 정답률</p>
          <p className="mt-1 text-caption text-mute">막대를 눌러 값을 바꿔보세요.</p>
          <div className="mt-3 space-y-3">
            {(Object.keys(accuracy) as Pos[]).map((p) => (
              <AccuracyBar
                key={p}
                pos={p}
                value={accuracy[p]}
                isWeakest={p === weakness}
                onClick={() => setAccuracy((a) => ({ ...a, [p]: cycleAccuracy(a[p]) }))}
              />
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-surface p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-mute">자동 감지</p>
          <p className="mt-1 text-body-sm font-bold text-ink">
            <span style={{ color: posMeta[weakness].color }}>{posMeta[weakness].label}</span> 정답률이 낮아요
          </p>
          <p className="mt-1 text-caption text-mute">
            {posMeta[weakness].label}가 많이 들어간 단어장을 우선 추천합니다.
          </p>
        </div>
      </div>

      {/* 우측 추천 결과 */}
      <div>
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">맞춤 추천 단어장</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {ranked.map((r, i) => (
              <BookCard key={r.book.id} book={r.book} score={r.score} rank={i} weakness={weakness} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
