// 실서비스 문제 화면 재현 — 빈칸 채우기 · 빈칸 입력 · 문장 만들기 공용 조각.
// 출처: heyvoca_front/src/plugins/questionTypes/{fillInTheBlank, fillInTheBlankTyping, sentenceArrange}
// 공통 레이아웃: 위 분홍 카드(한국어 예문, 스피커, 뜻 강조) + 아래 회색 카드(영어 예문) + 하단 선택지/버튼.

import { useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, X, SpeakerHigh, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { DemoWord } from '../../data/demoWords';

const PINK = '#FF70D4';

// 정답/오답 토큰 — 실서비스 status 토큰과 같은 값
export const OK = { border: '#32D583', text: '#0F8A4A', bg: '#ECFDF3' };
export const NG = { border: '#F97066', text: '#C03A2E', bg: '#FEF3F2' };

/** 예문에서 단어(활용형 포함)가 들어간 자리를 찾는다 → [앞, 단어, 뒤] */
export function splitAtWord(sentence: string, word: string): [string, string, string] {
  const root = word.replace(/(ing|ed|s|ies|er|est|e)$/i, '');
  const re = new RegExp(`\\b(${word}\\w*|${root}\\w*)\\b`, 'i');
  const m = sentence.match(re);
  if (!m || m.index == null) return [sentence, '', ''];
  return [sentence.slice(0, m.index), m[0], sentence.slice(m.index + m[0].length)];
}

/** 한국어 예문에서 뜻이 들어간 부분을 분홍으로 강조(실서비스 강조 마커 대용) */
function KoSentence({ ko, meanings }: { ko: string; meanings: string[] }) {
  const hit = useMemo(() => {
    for (const m of meanings) {
      const stem = m.replace(/(하다|되다|한|적인|의)$/, '').trim();
      if (stem.length >= 2 && ko.includes(stem)) return stem;
    }
    return null;
  }, [ko, meanings]);
  if (!hit) return <>{ko}</>;
  const i = ko.indexOf(hit);
  return (
    <>
      {ko.slice(0, i)}
      <span style={{ color: PINK }}>{hit}</span>
      {ko.slice(i + hit.length)}
    </>
  );
}

/** 위 분홍 카드 — 한국어 예문 */
export function KoPromptCard({ word }: { word: DemoWord }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[12px] px-[16px] py-[14px]" style={{ backgroundColor: '#FFF4FC' }}>
      <SpeakerHigh size={20} weight="fill" color="#C5C5C5" className="mt-[2px] shrink-0" aria-hidden />
      <p className="text-[15px] font-bold leading-[1.55] text-ink break-keep">
        <KoSentence ko={word.example.ko} meanings={word.meanings} />
      </p>
    </div>
  );
}

/** 채점 O/X 오버레이 */
export function ResultMark({ isCorrect }: { isCorrect: boolean | null }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2">
      <AnimatePresence>
        {isCorrect != null && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25 }}
          >
            {isCorrect ? <Circle size={130} weight="bold" color={OK.border} /> : <X size={130} weight="bold" color={NG.border} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrimaryButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      className="flex h-[48px] w-full shrink-0 items-center justify-center rounded-[12px] text-[15px] font-bold transition-colors"
      style={disabled ? { backgroundColor: '#CCCCCC', color: '#8A8A8A' } : { backgroundColor: PINK, color: '#fff' }}
    >
      {children}
    </motion.button>
  );
}

// ──────────────────────────────────────────────────────────────────
// 빈칸 입력 — 보기 없이 직접 입력
// ──────────────────────────────────────────────────────────────────

export function FillTypingView({
  word,
  feedback,
  onAnswer,
}: {
  word: DemoWord;
  /** 채점 후 회색 카드 위쪽에 띄울 배지(XP 등) */
  feedback?: ReactNode;
  onAnswer: (correct: boolean) => void;
}) {
  const [before, answer, after] = useMemo(() => splitAtWord(word.example.en, word.word), [word]);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<boolean | null>(null);

  const submit = () => {
    if (result != null || !value.trim()) return;
    const ok = value.trim().toLowerCase() === answer.toLowerCase();
    setResult(ok);
    onAnswer(ok);
  };

  const tone = result == null ? null : result ? OK : NG;

  return (
    <div className="flex h-full flex-col gap-[12px]">
      <KoPromptCard word={word} />
      <div className="relative flex flex-1 flex-col justify-center rounded-[12px] bg-[#F5F5F5] px-[18px] py-[16px]">
        {feedback && <div className="absolute left-1/2 top-[12px] z-[3] -translate-x-1/2 whitespace-nowrap">{feedback}</div>}
        <p className="text-[18px] font-bold leading-[2.1] text-ink">
          {before}
          <input
            value={result == null ? value : answer}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            readOnly={result != null}
            aria-label="빈칸에 들어갈 단어 입력"
            placeholder={`${answer.charAt(0)}…`}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="mx-[2px] inline-block h-[36px] rounded-[8px] border bg-white px-[8px] text-center align-middle text-[16px] font-bold outline-none placeholder:font-semibold placeholder:text-[#C5C5C5] focus:border-[#FF70D4]"
            style={{
              width: `${Math.max(answer.length, 4) + 2}ch`,
              borderColor: tone?.border ?? '#CCCCCC',
              color: tone?.text ?? '#111',
              backgroundColor: tone?.bg ?? '#fff',
            }}
          />
          {after}
        </p>
        {result === false && (
          <p className="mt-2 text-[12px] font-semibold" style={{ color: NG.text }}>
            입력: <span className="line-through">{value}</span>
          </p>
        )}
        <ResultMark isCorrect={result} />
      </div>
      <PrimaryButton disabled={!value.trim() || result != null} onClick={submit}>
        확인
      </PrimaryButton>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 문장 만들기 — 단어 조각을 순서대로 눌러 영어 문장 완성
// ──────────────────────────────────────────────────────────────────

const tokenize = (s: string) => s.replace(/[.!?]$/, '').split(/\s+/).filter(Boolean);

export function SentenceArrangeView({
  word,
  feedback,
  onAnswer,
}: {
  word: DemoWord;
  feedback?: ReactNode;
  onAnswer: (correct: boolean) => void;
}) {
  const answer = useMemo(() => tokenize(word.example.en), [word]);
  const punct = word.example.en.match(/[.!?]$/)?.[0] ?? '';
  // 조각 섞기 — 마운트 때 한 번만
  const chips = useMemo(
    () => answer.map((t, i) => ({ id: i, text: t })).sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [picked, setPicked] = useState<number[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const done = picked.length === answer.length;

  const toggle = (id: number) => {
    if (result != null) return;
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const submit = () => {
    if (!done || result != null) return;
    const built = picked.map((id) => chips.find((c) => c.id === id)!.text.toLowerCase());
    const ok = built.join(' ') === answer.map((t) => t.toLowerCase()).join(' ');
    setResult(ok);
    onAnswer(ok);
  };

  return (
    <div className="flex h-full flex-col gap-[12px]">
      <KoPromptCard word={word} />
      <div className="relative flex flex-1 flex-col rounded-[12px] bg-[#F5F5F5] px-[14px] py-[14px]">
        {feedback && <div className="absolute left-1/2 top-[10px] z-[3] -translate-x-1/2 whitespace-nowrap">{feedback}</div>}
        {/* 놓은 조각 줄 */}
        <div className="mt-[26px] flex min-h-[84px] flex-wrap content-start gap-[6px] border-b border-[#E0E0E0] pb-[10px]">
          {picked.map((id) => {
            const c = chips.find((x) => x.id === id)!;
            return (
              <motion.button
                layout
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="h-[32px] rounded-[8px] border bg-white px-[10px] text-[14px] font-bold text-ink"
                style={result == null ? { borderColor: '#CCCCCC' } : { borderColor: (result ? OK : NG).border, color: (result ? OK : NG).text, backgroundColor: (result ? OK : NG).bg }}
              >
                {c.text}
              </motion.button>
            );
          })}
          {done && <span className="self-end text-[16px] font-bold text-ink">{punct}</span>}
        </div>
        {result === false && (
          <p className="mt-2 text-[12px] leading-[1.5] text-sub">
            <span className="font-bold text-mute">정답 문장 </span>
            {word.example.en}
          </p>
        )}
        {/* 남은 조각 */}
        <div className="mt-auto flex flex-wrap justify-center gap-[6px] pt-[12px]">
          {chips.map((c) => {
            const used = picked.includes(c.id);
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                disabled={used || result != null}
                whileTap={!used ? { scale: 0.94 } : undefined}
                className="h-[32px] rounded-[8px] border px-[10px] text-[14px] font-bold"
                style={used ? { borderColor: '#E5E5E5', backgroundColor: '#E5E5E5', color: 'transparent' } : { borderColor: '#CCCCCC', backgroundColor: '#fff', color: '#111' }}
              >
                {c.text}
              </motion.button>
            );
          })}
        </div>
        <ResultMark isCorrect={result} />
      </div>
      <div className="flex shrink-0 gap-[8px]">
        <button
          type="button"
          onClick={() => setPicked([])}
          disabled={result != null || picked.length === 0}
          aria-label="처음부터 다시 놓기"
          className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[12px] border border-[#CCCCCC] bg-white text-sub disabled:opacity-40"
        >
          <ArrowCounterClockwise size={18} weight="bold" />
        </button>
        <PrimaryButton disabled={!done || result != null} onClick={submit}>
          확인
        </PrimaryButton>
      </div>
    </div>
  );
}
