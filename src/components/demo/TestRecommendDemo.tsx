import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkle, Star } from '@phosphor-icons/react';
import {
  demoVocaBooks,
  scoreVocaBook,
  type DemoVocaBook,
} from '../../data/demoVocaBooks';

type UserLevel = 1 | 2 | 3;
type Pattern = 'morning' | 'evening' | 'weekend';
type Duration = 5 | 15 | 30;

const levelLabels: Record<UserLevel, string> = {
  1: '초급',
  2: '중급',
  3: '상급',
};

const patternLabels: { id: Pattern; label: string; emoji?: string }[] = [
  { id: 'morning', label: '아침형' },
  { id: 'evening', label: '저녁형' },
  { id: 'weekend', label: '주말 집중' },
];

const durationOptions: { id: Duration; label: string }[] = [
  { id: 5, label: '하루 5분' },
  { id: 15, label: '하루 15분' },
  { id: 30, label: '하루 30분' },
];

// 별점 (0~1 점수를 5점 만점 별로 시각화)
function MatchStars({ score }: { score: number }) {
  const stars = Math.round(score * 5);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`매치도 ${stars} / 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={11}
          weight={i < stars ? 'fill' : 'regular'}
          className={i < stars ? 'text-primary-500' : 'text-hairline'}
          aria-hidden
        />
      ))}
    </span>
  );
}

// 단어장 카드
function BookCard({
  book,
  score,
  rank,
}: {
  book: DemoVocaBook;
  score: number;
  rank: number;
}) {
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
      {/* 추천 뱃지 (상위 1개에만) */}
      {rank === 0 && (
        <span className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-card">
          <Sparkle size={10} weight="fill" aria-hidden />
          BEST 추천
        </span>
      )}

      {/* 표지 */}
      <div
        className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: `${book.color}22` }}
      >
        <img
          src={book.coverImage}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      {/* 정보 */}
      <div className="flex flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: book.color }}>
          {book.category}
        </p>
        <h4 className="mt-0.5 text-body-sm font-bold text-ink">{book.name}</h4>
        <p className="mt-0.5 text-caption text-mute">
          {book.wordCount.toLocaleString()}단어 · {levelLabels[book.level]}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <MatchStars score={score} />
          <span className="text-[11px] font-semibold tabular-nums text-sub">
            {Math.round(score * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// 작은 컨트롤 칩
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
        active
          ? 'bg-ink text-white'
          : 'bg-surface text-sub hover:bg-hairline'
      }`}
    >
      {children}
    </button>
  );
}

export default function TestRecommendDemo() {
  const [level, setLevel] = useState<UserLevel>(2);
  const [pattern, setPattern] = useState<Pattern>('morning');
  const [duration, setDuration] = useState<Duration>(15);

  // 점수 계산 후 상위 4개만 노출
  const ranked = useMemo(() => {
    const scored = demoVocaBooks.map((b) => ({
      book: b,
      score: scoreVocaBook(b, level, pattern, duration),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4);
  }, [level, pattern, duration]);

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      {/* 좌측 컨트롤 */}
      <div className="card p-5">
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">
          내 학습 프로필
        </p>

        {/* 사용자 레벨 */}
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

        {/* 학습 패턴 */}
        <div className="mt-5">
          <p className="text-[13px] font-semibold text-ink">학습 패턴</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="학습 패턴 선택">
            {patternLabels.map((p) => (
              <ChipButton key={p.id} active={pattern === p.id} onClick={() => setPattern(p.id)}>
                {p.label}
              </ChipButton>
            ))}
          </div>
        </div>

        {/* 학습 시간 */}
        <div className="mt-5">
          <p className="text-[13px] font-semibold text-ink">학습 시간</p>
          <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="학습 시간 선택">
            {durationOptions.map((d) => (
              <ChipButton key={d.id} active={duration === d.id} onClick={() => setDuration(d.id)}>
                {d.label}
              </ChipButton>
            ))}
          </div>
        </div>

        <p className="mt-5 text-caption text-mute">
          AI가 사용자의 레벨과 생활 패턴, 학습 시간을 토대로 가장 잘 맞는 단어장을 자동 추천합니다.
        </p>
      </div>

      {/* 우측 추천 결과 */}
      <div>
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">
          맞춤 추천 단어장
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {ranked.map((r, i) => (
              <BookCard key={r.book.id} book={r.book} score={r.score} rank={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
