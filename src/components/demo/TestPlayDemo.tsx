// AI 추천 테스트 데모 — 실서비스 takeTest/Main.jsx 및 question plugins 기반 5가지 문제 유형 인터랙티브
// 14문제 풀이형, 정답/오답 피드백, 결과 화면

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, X, Check, SpeakerHigh, HandsClapping, Leaf, Plant, Carrot, EggCrack, Trophy, Sparkle, Target, Diamond } from '@phosphor-icons/react';
import { buildTestQuestions, TOTAL_WORDS, wordCountOf, type TestQuestion, type Option as QOption } from '../../data/testQuestions';
import type { DemoWord, MemoryStatus } from '../../data/demoWords';
import { demoWords, nextStatusOnGood, nextStatusOnBad } from '../../data/demoWords';
import MemorizationStatus from './MemorizationStatus';
import { getTextSound, stopCurrentSound } from '../../utils/tts';

// 실서비스 stateNameMap + 색상 (MemorizationStatus와 동일)
const STATE_NAME: Record<MemoryStatus, string> = {
  unlearned: '미학습',
  leaf: '단기 암기',
  plant: '중기 암기',
  carrot: '장기 암기',
  overdue: '복습 지연',
};

const STATE_COLOR: Record<MemoryStatus, { border: string; text: string; bg: string; icon: React.ReactNode }> = {
  unlearned: { border: '#9D835A', text: '#9D835A', bg: '#FFFCF3', icon: <EggCrack size={10} weight="fill" /> },
  leaf: { border: '#77CE4F', text: '#77CE4F', bg: '#F2FFEB', icon: <Leaf size={10} weight="fill" /> },
  plant: { border: '#38CE38', text: '#38CE38', bg: '#EBFFEE', icon: <Plant size={10} weight="fill" /> },
  carrot: { border: '#F68300', text: '#F68300', bg: '#FFF8E8', icon: <Carrot size={10} weight="fill" /> },
  overdue: { border: '#F26A6A', text: '#F26A6A', bg: '#FFE9E9', icon: <Leaf size={10} weight="fill" /> },
};

// 단계별 정답 시 권장 복습 간격(일) — 실서비스 FSRS 추정 유사
const NEXT_REVIEW_DAYS_BY_STATE: Record<MemoryStatus, number> = {
  unlearned: 1,
  leaf: 3,
  plant: 14,
  carrot: 60,
  overdue: 1,
};

interface MemoryStateChange {
  from: MemoryStatus;
  to: MemoryStatus;
}

// ──────────────────────────────────────────────────────────────────
// 유틸
// ──────────────────────────────────────────────────────────────────

function getDisplayMeanings(meanings: string[]): string[] {
  const uniq = Array.from(new Set(meanings));
  if (uniq.length <= 2) return uniq;
  const count = Math.random() < 0.5 ? 2 : Math.min(3, uniq.length);
  return uniq.sort(() => Math.random() - 0.5).slice(0, count);
}

// 예문에서 단어를 ___ 로 치환 (단어/활용형 모두 매칭)
function replaceWordWithBlank(sentence: string, word: string): string {
  const root = word.replace(/(ing|ed|s|ies|er|est)$/i, '');
  const re = new RegExp(`\\b(${word}|${root}\\w*)\\b`, 'i');
  return sentence.replace(re, '_____');
}

// ──────────────────────────────────────────────────────────────────
// 4지선다 옵션 버튼
// ──────────────────────────────────────────────────────────────────

interface OptionBtnProps {
  text: string;
  selected: boolean;
  isCorrect: boolean | null;
  isAnswer: boolean;
  disabled: boolean;
  onClick: () => void;
}

function OptionButton({ text, selected, isCorrect, isAnswer, disabled, onClick }: OptionBtnProps) {
  // 색상 토큰 (실서비스 heyvoca_front 동일):
  //   정답: #32D583 / bg #ECFDF3  오답: #F97066 / bg #FEF3F2
  //   선택됨(채점 전): #FF70D4 / bg #FFF4FC
  let style = '';
  if (isCorrect !== null && isAnswer) {
    style = 'border-[#32D583] text-[#0F8A4A] bg-[#ECFDF3]';
  } else if (isCorrect === false && selected) {
    style = 'border-[#F97066] text-[#C03A2E] bg-[#FEF3F2]';
  } else if (isCorrect === null && selected) {
    style = 'border-[#FF70D4] bg-[#FFF4FC] text-ink';
  } else {
    style = 'border-[#CCCCCC] text-ink bg-white';
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.96 } : undefined}
      className={`flex h-[50px] w-full items-center justify-center overflow-hidden rounded-[10px] border px-[20px] text-center text-[14px] font-bold ${style}`}
    >
      <span className="line-clamp-2">{text}</span>
    </motion.button>
  );
}

// ──────────────────────────────────────────────────────────────────
// 결과 오버레이 (Circle/X)
// ──────────────────────────────────────────────────────────────────

function ResultOverlay({ isCorrect }: { isCorrect: boolean | null }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2">
      <AnimatePresence>
        {isCorrect === true && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25, duration: 0.3 }}
          >
            <Circle size={150} weight="bold" color="#32D583" />
          </motion.div>
        )}
        {isCorrect === false && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.85 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25, duration: 0.3 }}
          >
            <X size={150} weight="bold" color="#F97066" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// multipleChoice / multipleChoiceListening 렌더러
// ──────────────────────────────────────────────────────────────────

interface MCProps {
  question: TestQuestion;
  optionsDisplay: string[];
  userSelected: number | null;
  isCorrect: boolean | null;
  isAnswered: boolean;
  onSelect: (i: number) => void;
  onSpeak: () => void;
  isSpeaking: boolean;
  memoryStateChange: MemoryStateChange | null;
  nextReviewDays: number | null;
}

// 상태 rank — 상승/하락 판정용
const STATE_RANK_GLOBAL: Record<MemoryStatus, number> = {
  overdue: -1,
  unlearned: 0,
  leaf: 1,
  plant: 2,
  carrot: 3,
};

function MemoryStateChangeBadge({ change }: { change: MemoryStateChange }) {
  const c = STATE_COLOR[change.to];
  const isDowngrade = STATE_RANK_GLOBAL[change.to] < STATE_RANK_GLOBAL[change.from];
  const message = isDowngrade
    ? `${STATE_NAME[change.to]}로 하락`
    : `${STATE_NAME[change.to]}로 상승!`;
  return (
    <motion.div
      className="flex items-center gap-[3px] overflow-hidden whitespace-nowrap rounded-[50px] border px-[8px] py-[3px] text-[10px] font-semibold"
      style={{ color: c.text, borderColor: c.border, backgroundColor: c.bg }}
      initial={{ maxWidth: 28 }}
      animate={{ maxWidth: 200 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="shrink-0">{c.icon}</span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.25 }}
      >
        {message}
      </motion.span>
    </motion.div>
  );
}

function NextReviewBadge({ days }: { days: number }) {
  // 실서비스 토큰: bg-primary-main-200 (#FFD7F3), text-primary-main-600 (#FF70D4)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex h-[18px] items-center justify-center whitespace-nowrap rounded-[3px] px-[6px] text-[10px] font-semibold"
      style={{ backgroundColor: '#FFD7F3', color: '#FF70D4' }}
    >
      {days}일 후 복습 예정
    </motion.div>
  );
}

function MultipleChoiceCard({
  question,
  optionsDisplay,
  userSelected,
  isCorrect,
  isAnswered,
  onSelect,
  onSpeak,
  isSpeaking,
  memoryStateChange,
  nextReviewDays,
}: MCProps) {
  const isListening = question.questionType === 'multipleChoiceListening';
  return (
    <div className="flex h-full flex-col gap-[15px]">
      {/* 상단: 단어 또는 스피커 */}
      <motion.div
        onClick={onSpeak}
        whileTap={{ scale: 0.97 }}
        className="relative flex flex-1 cursor-pointer items-center justify-center rounded-[12px] bg-[#F5F5F5]"
      >
        {/* 상단 중앙 — 채점 후 암기 상태 변경 뱃지 */}
        {isAnswered && memoryStateChange && (
          <div className="absolute left-1/2 top-[15px] z-[2] -translate-x-1/2 whitespace-nowrap">
            <MemoryStateChangeBadge change={memoryStateChange} />
          </div>
        )}
        {/* 하단 중앙 — 채점 후 복습 예정일 뱃지 (변경 배지와 동시 표시) */}
        {isAnswered && nextReviewDays != null && (
          <div className="absolute bottom-[15px] left-1/2 z-[2] -translate-x-1/2">
            <NextReviewBadge days={nextReviewDays} />
          </div>
        )}

        {isListening && !isAnswered ? (
          <div className="relative flex items-center justify-center">
            {isSpeaking && (
              <>
                <motion.div
                  className="absolute rounded-full border-2 border-primary-500"
                  initial={{ width: 60, height: 60, opacity: 0.7 }}
                  animate={{ width: 110, height: 110, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute rounded-full border-2 border-primary-500"
                  initial={{ width: 60, height: 60, opacity: 0.7 }}
                  animate={{ width: 110, height: 110, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                />
              </>
            )}
            <motion.div animate={isSpeaking ? { scale: [1, 1.12, 1] } : { scale: 1 }} transition={isSpeaking ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } : {}}>
              <SpeakerHigh size={60} weight="fill" color={isSpeaking ? '#FF70D4' : '#C5C5C5'} />
            </motion.div>
          </div>
        ) : (
          <h2 className="relative z-[1] max-w-[90%] text-center text-[28px] font-bold text-ink">
            {question.word?.word}
            <ResultOverlay isCorrect={isCorrect} />
          </h2>
        )}
      </motion.div>

      {/* 하단: 4지선다 */}
      <div className="flex flex-col gap-[10px]">
        {question.options?.map((opt, i) => (
          <OptionButton
            key={i}
            text={optionsDisplay[i]}
            selected={userSelected === i}
            isCorrect={isCorrect}
            isAnswer={question.resultIndex === i}
            disabled={isAnswered}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// fillInTheBlank 렌더러
// ──────────────────────────────────────────────────────────────────

interface FillProps {
  question: TestQuestion;
  userSelected: number | null;
  isCorrect: boolean | null;
  isAnswered: boolean;
  onSelect: (i: number) => void;
  memoryStateChange: MemoryStateChange | null;
  nextReviewDays: number | null;
}

function FillBlankCard({ question, userSelected, isCorrect, isAnswered, onSelect, memoryStateChange, nextReviewDays }: FillProps) {
  const word = question.word!;
  const blanked = replaceWordWithBlank(word.example.en, word.word);
  const parts = blanked.split('_____');
  const before = parts[0] ?? '';
  const after = parts[1] ?? '';

  // 빈칸 박스 스타일 — 실서비스와 동일 토큰
  let blankClass = 'border-[#CCCCCC] bg-white text-ink';
  if (isAnswered && isCorrect) {
    blankClass = 'border-[#32D583] text-[#0F8A4A] bg-[#ECFDF3]';
  } else if (isAnswered && isCorrect === false) {
    blankClass = 'border-[#F97066] text-[#C03A2E] bg-[#FEF3F2]';
  }

  return (
    <div className="flex h-full flex-col gap-[15px]">
      {/* 한국어 + 영어 예문 통합 영역 (채점 피드백 기준점) */}
      <div className="relative flex h-full flex-col overflow-hidden rounded-[12px]">
        {/* 한국어 예문 — primary-main-50 #FFF4FC */}
        <div
          className="flex min-h-[72px] items-center px-[20px] py-[15px]"
          style={{ backgroundColor: '#FFF4FC' }}
        >
          <p className="text-[14px] font-normal text-ink">{word.example.ko}</p>
        </div>

        {/* 영어 예문 + 빈칸 박스 — bg-layout-gray-50 #F5F5F5 */}
        <div
          className="relative flex-1 px-[20px] py-[15px]"
          style={{ backgroundColor: '#F5F5F5' }}
        >
          <p
            className="relative z-[2] text-[16px] font-normal text-ink"
            style={{ lineHeight: '2.2' }}
          >
            {before}
            <span
              className={`inline-flex h-[25px] min-w-[70px] items-center justify-center rounded-[5px] border px-[15px] align-middle text-[15px] font-semibold transition-all duration-200 ${blankClass}`}
            >
              {isAnswered ? word.word : ''}
            </span>
            {after}
          </p>

          {/* O/X 오버레이 — 영문 영역 중앙 */}
          <ResultOverlay isCorrect={isCorrect} />
        </div>

        {/* 암기 상태 변경 배지 — 통합 영역 상단 중앙 (한국어+영문 박스 기준) */}
        {isAnswered && memoryStateChange && (
          <div className="absolute left-1/2 top-[12px] z-[3] -translate-x-1/2 whitespace-nowrap">
            <MemoryStateChangeBadge change={memoryStateChange} />
          </div>
        )}

        {/* 복습 예정일 — 통합 영역 하단 중앙 (변경 배지와 동시 표시) */}
        {isAnswered && nextReviewDays != null && (
          <div className="absolute bottom-[12px] left-1/2 z-[3] -translate-x-1/2">
            <NextReviewBadge days={nextReviewDays} />
          </div>
        )}
      </div>

      {/* 선택지 4개 — 세로 (실서비스 동일) */}
      <div className="flex flex-col gap-[8px]">
        {question.options?.map((opt, i) => (
          <OptionButton
            key={i}
            text={opt.word}
            selected={userSelected === i}
            isCorrect={isCorrect}
            isAnswer={question.resultIndex === i}
            disabled={isAnswered}
            onClick={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// cardMatch / cardMatchListening 렌더러 — 단어 카드 4개 ↔ 뜻 카드 4개 짝짓기
// ──────────────────────────────────────────────────────────────────

interface CardMatchProps {
  question: TestQuestion;
  isListening: boolean;
  currentStatusByWord: Record<number, MemoryStatus>;
  onWordResolved: () => void;
  onAllMatched: (perWordCorrect: Record<number, boolean>) => void;
}

// 각 단어별 매칭 결과 상태
interface WordResolved {
  prevState: MemoryStatus;
  newState: MemoryStatus;
  changed: boolean;
  isCorrect: boolean;
}

function CardMatchCard({ question, isListening, currentStatusByWord, onWordResolved, onAllMatched }: CardMatchProps) {
  const words = question.words!;
  // 좌측 단어 카드 (또는 음성 카드)
  const leftCards = useMemo(() => words.map((w) => ({ id: w.id, word: w.word })), [words]);
  // 우측 뜻 카드 — 셔플 (mount 시 한 번만)
  const rightCards = useMemo(() => {
    return [...words]
      .sort(() => Math.random() - 0.5)
      .map((w) => ({ id: w.id, label: w.meanings.slice(0, 2).join(', ') }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [correctFlash, setCorrectFlash] = useState<Set<number>>(new Set());
  const [wrongFlashLeft, setWrongFlashLeft] = useState<Set<number>>(new Set());
  const [wrongFlashRight, setWrongFlashRight] = useState<Set<number>>(new Set());
  const [animating, setAnimating] = useState<Set<number>>(new Set());
  const [wordResolved, setWordResolved] = useState<Record<number, WordResolved>>({});
  const resolvedCountRef = useRef(0);
  const wordResultsRef = useRef<Record<number, boolean>>({});

  const resolveWord = (wordId: number, isCorrect: boolean) => {
    const prev = currentStatusByWord[wordId] ?? 'unlearned';
    const next = isCorrect ? nextStatusOnGood(prev) : nextStatusOnBad(prev);
    setWordResolved((r) => ({
      ...r,
      [wordId]: { prevState: prev, newState: next, changed: prev !== next, isCorrect },
    }));
  };

  const checkMatch = (leftId: number, rightId: number) => {
    const isMatch = leftId === rightId;
    setSelectedLeft(null);
    setSelectedRight(null);
    setAnimating((s) => new Set([...s, leftId]));
    wordResultsRef.current[leftId] = isMatch;

    if (isMatch) {
      resolveWord(leftId, true);
      setCorrectFlash((s) => new Set([...s, leftId]));
      // 매칭 즉시 단어 1개 진행 — 카드 매칭 한 쌍 정답 시 프로그레스 +1
      onWordResolved();
      window.setTimeout(() => {
        setCorrectFlash((s) => { const n = new Set(s); n.delete(leftId); return n; });
        setMatched((s) => new Set([...s, leftId]));
        setAnimating((s) => { const n = new Set(s); n.delete(leftId); return n; });
        resolvedCountRef.current++;
        if (resolvedCountRef.current === words.length) {
          window.setTimeout(() => onAllMatched({ ...wordResultsRef.current }), 600);
        }
      }, 800);
    } else {
      resolveWord(leftId, false);
      setWrongFlashLeft((s) => new Set([...s, leftId]));
      setWrongFlashRight((s) => new Set([...s, rightId]));
      // 오답 매칭도 단어 1개 결판 — 프로그레스 +1
      onWordResolved();
      window.setTimeout(() => {
        setWrongFlashLeft((s) => { const n = new Set(s); n.delete(leftId); return n; });
        setWrongFlashRight((s) => { const n = new Set(s); n.delete(rightId); return n; });
        setFailed((s) => new Set([...s, leftId]));
        setAnimating((s) => { const n = new Set(s); n.delete(leftId); return n; });
        resolvedCountRef.current++;
        if (resolvedCountRef.current === words.length) {
          window.setTimeout(() => onAllMatched({ ...wordResultsRef.current }), 600);
        }
      }, 800);
    }
  };

  const handleLeftClick = (id: number) => {
    if (matched.has(id) || failed.has(id) || animating.has(id)) return;
    if (isListening) {
      const target = leftCards.find((c) => c.id === id);
      if (target) getTextSound(target.word, 'en');
    }
    if (selectedRight != null) {
      checkMatch(id, selectedRight);
    } else {
      setSelectedLeft(id === selectedLeft ? null : id);
    }
  };

  const handleRightClick = (id: number) => {
    if (matched.has(id) || wrongFlashRight.has(id)) return;
    if (selectedLeft != null) {
      checkMatch(selectedLeft, id);
    } else {
      setSelectedRight(id === selectedRight ? null : id);
    }
  };

  // 좌측 카드 스타일 — 실서비스 토큰 (#32D583/#F97066/#ECFDF3/#FEF3F2)
  const getLeftClass = (id: number) => {
    if (matched.has(id)) return 'border border-[#32D583] bg-[#ECFDF3] opacity-50';
    if (failed.has(id)) return 'border border-[#F97066] bg-[#FEF3F2] opacity-50';
    if (correctFlash.has(id)) return 'border border-[#32D583] bg-[#ECFDF3]';
    if (wrongFlashLeft.has(id)) return 'border border-[#F97066] bg-[#FEF3F2]';
    if (selectedLeft === id) return 'border border-[#FF70D4] bg-[#FFF4FC]';
    return 'border border-[#CCCCCC] bg-[#F5F5F5]';
  };
  const getLeftTextColor = (id: number) => {
    if (matched.has(id) || correctFlash.has(id)) return 'text-[#0F8A4A]';
    if (failed.has(id) || wrongFlashLeft.has(id)) return 'text-[#C03A2E]';
    return 'text-ink';
  };

  // 우측 카드 스타일
  const getRightClass = (id: number) => {
    if (matched.has(id)) return 'border border-[#32D583] bg-[#ECFDF3] opacity-50';
    if (correctFlash.has(id)) return 'border border-[#32D583] bg-[#ECFDF3]';
    if (wrongFlashRight.has(id)) return 'border border-[#F97066] bg-[#FEF3F2]';
    if (selectedRight === id) return 'border border-[#FF70D4] bg-white';
    return 'border border-[#CCCCCC] bg-white';
  };
  const getRightTextColor = (id: number) => {
    if (matched.has(id) || correctFlash.has(id)) return 'text-[#0F8A4A]';
    if (wrongFlashRight.has(id)) return 'text-[#C03A2E]';
    return 'text-ink';
  };

  return (
    <div className="flex h-full flex-col">
      <div className="grid h-full grid-cols-2 gap-[10px]">
        {/* 좌측: 단어 */}
        <div className="flex flex-col gap-[10px]">
          {leftCards.map((c) => {
            const resolved = wordResolved[c.id];
            const isResolved = matched.has(c.id) || failed.has(c.id);
            const isAnimating = animating.has(c.id);
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => handleLeftClick(c.id)}
                disabled={isResolved || isAnimating}
                whileTap={!isResolved && !isAnimating ? { scale: 0.95 } : undefined}
                animate={wrongFlashLeft.has(c.id) ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative flex flex-1 flex-col items-center justify-center rounded-[12px] p-[10px] transition-colors duration-150 ${getLeftClass(c.id)}`}
              >
                {/* 상단 — 암기 상태 배지 (채점 후) */}
                {resolved && (
                  <div className="absolute left-0 right-0 top-[8px] z-[2] flex justify-center">
                    {resolved.changed ? (() => {
                      const isDown = STATE_RANK_GLOBAL[resolved.newState] < STATE_RANK_GLOBAL[resolved.prevState];
                      return (
                      <motion.div
                        className="flex items-center gap-[3px] overflow-hidden whitespace-nowrap rounded-[50px] border px-[6px] py-[2px] text-[9px] font-semibold"
                        style={{
                          color: STATE_COLOR[resolved.newState].text,
                          borderColor: STATE_COLOR[resolved.newState].border,
                          backgroundColor: STATE_COLOR[resolved.newState].bg,
                        }}
                        initial={{ maxWidth: 20 }}
                        animate={{ maxWidth: 160 }}
                        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <span className="shrink-0">{STATE_COLOR[resolved.newState].icon}</span>
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                          {STATE_NAME[resolved.newState]} {isDown ? '하락' : '진화!'}
                        </motion.span>
                      </motion.div>
                      );
                    })() : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="flex h-[18px] w-[18px] items-center justify-center rounded-[18px] border"
                        style={{
                          color: STATE_COLOR[resolved.newState].text,
                          borderColor: STATE_COLOR[resolved.newState].border,
                          backgroundColor: STATE_COLOR[resolved.newState].bg,
                        }}
                      >
                        {STATE_COLOR[resolved.newState].icon}
                      </motion.div>
                    )}
                  </div>
                )}

                <span className={`text-center text-[18px] font-extrabold leading-tight ${getLeftTextColor(c.id)}`}>
                  {isListening ? <SpeakerHigh size={22} weight="fill" color="#FF70D4" /> : c.word}
                </span>

                {/* 하단 — 복습 예정일 (채점 후, 정답/오답 무관 항상 표시) */}
                {resolved && (
                  <div className="absolute bottom-[8px] left-0 right-0 z-[2] flex justify-center">
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: 0.3 }}
                      className="flex h-[18px] items-center justify-center whitespace-nowrap rounded-[3px] px-[6px] text-[10px] font-semibold"
                      style={{ backgroundColor: '#FFD7F3', color: '#FF70D4' }}
                    >
                      {NEXT_REVIEW_DAYS_BY_STATE[resolved.newState] ?? 1}일 후 복습
                    </motion.div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* 우측: 뜻 */}
        <div className="flex flex-col gap-[10px]">
          {rightCards.map((c) => {
            return (
              <motion.button
                key={c.id}
                type="button"
                onClick={() => handleRightClick(c.id)}
                disabled={matched.has(c.id) || wrongFlashRight.has(c.id)}
                whileTap={!matched.has(c.id) && !wrongFlashRight.has(c.id) ? { scale: 0.95 } : undefined}
                animate={wrongFlashRight.has(c.id) ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={`flex flex-1 flex-col items-center justify-center rounded-[12px] p-[10px] transition-colors duration-150 ${getRightClass(c.id)}`}
              >
                <span className={`break-keep text-center text-[13px] font-semibold leading-snug ${getRightTextColor(c.id)}`}>
                  {c.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 결과 화면
// ──────────────────────────────────────────────────────────────────

interface ResultScreenProps {
  questions: TestQuestion[];
  statusBefore: Record<number, MemoryStatus>;
  statusAfter: Record<number, MemoryStatus>;
  onRestart: () => void;
  onExit: () => void;
}

type ResultSlideType = 'newWords' | 'memoryImproved' | 'dailyMission' | 'achievement' | 'gem' | 'result';

interface ResultSlide {
  type: ResultSlideType;
  data?: any;
}

// 핑크 글로우 배경 — 실서비스 ResultItemBackground01/02 SVG 사용
function GlowBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      {/* ResultItemBackground02: 큰 배경 (scale 호흡) */}
      <motion.img
        src="/images/ResultItemBackground02.svg"
        alt=""
        aria-hidden
        className="absolute w-[460px] h-[360px] object-contain"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* ResultItemBackground01: 회전 + scale */}
      <motion.img
        src="/images/ResultItemBackground01.svg"
        alt=""
        aria-hidden
        className="absolute w-[200px] h-[200px] object-contain"
        animate={{ rotate: [0, 360, 720], scale: [1, 1.5, 1, 1.5, 1], opacity: [0.8, 1, 0.8, 1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// 큰 아이콘 + 텍스트 슬라이드 (newWords, memoryImproved, dailyMission, achievement, gem)
function IconMessageSlide({
  icon,
  message,
  highlight,
  delay = 0.3,
}: {
  icon: React.ReactNode;
  message: React.ReactNode;
  highlight?: React.ReactNode;
  delay?: number;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-[14px]">
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -180 }}
        animate={{ scale: 1, opacity: 1, rotate: 0, y: [0, -8, 0] }}
        transition={{
          scale: { type: 'spring', stiffness: 200, damping: 15 },
          rotate: { type: 'spring', stiffness: 200, damping: 15 },
          opacity: { duration: 0.6 },
          y: { delay: 0.8, duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
        }}
        className="relative z-[1]"
      >
        {icon}
      </motion.div>
      <motion.p
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay, duration: 0.4 }}
        className="text-center text-[14px] font-bold text-ink"
      >
        {highlight && (
          <>
            <strong style={{ color: '#FF70D4' }}>{highlight}</strong>
            {message}
          </>
        )}
        {!highlight && message}
      </motion.p>
    </div>
  );
}

// 마지막 결과 화면 (원형 프로그레스 + 단어 목록 + 두 버튼) — 실서비스 디자인 그대로
function FinalResult({
  questions,
  statusAfter,
  onRestart,
  onExit,
}: {
  questions: TestQuestion[];
  statusAfter: Record<number, MemoryStatus>;
  onRestart: () => void;
  onExit: () => void;
}) {
  // 단어 목록 flatten — cardMatch는 words[] 펼치기, 단어별 정답 여부 사용
  const items = useMemo(() => {
    const out: Array<{ id: number; word: string; meaning: string; isCorrect: boolean; status: MemoryStatus }> = [];
    questions.forEach((q) => {
      if ((q.questionType === 'cardMatch' || q.questionType === 'cardMatchListening') && q.words) {
        q.words.forEach((w) => {
          const wordCorrect = q.perWordCorrect?.[w.id] ?? q.isCorrect ?? false;
          out.push({
            id: w.id,
            word: w.word,
            meaning: w.meanings.slice(0, 2).join(', '),
            isCorrect: wordCorrect,
            status: statusAfter[w.id] ?? 'unlearned',
          });
        });
      } else if (q.word) {
        out.push({
          id: q.word.id,
          word: q.word.word,
          meaning: q.word.meanings.slice(0, 2).join(', '),
          isCorrect: q.isCorrect ?? false,
          status: statusAfter[q.word.id] ?? 'unlearned',
        });
      }
    });
    return out;
  }, [questions, statusAfter]);

  // 단어 기준 점수
  const totalQuestions = items.length;
  const correctQuestions = items.filter((it) => it.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((correctQuestions / totalQuestions) * 100) : 0;

  // 원형 프로그레스 — 실서비스: 238x238 r=104.8 strokeWidth=28.4
  // iPhone 프레임 안 축소: 180x180 r=80 strokeWidth=22
  const r = 80;
  const c = 2 * Math.PI * r;

  // 자연 흐름 — 부모(iPhone 프레임 결과 영역)가 overflow-y-auto를 가지면 전체 영역 스크롤됨
  return (
    <div className="flex min-h-full flex-col">
      {/* 헤더 — sticky로 상단 고정 */}
      <div className="sticky top-0 z-10 flex h-[40px] items-center justify-center bg-white">
        <h2 className="text-[15px] font-bold text-ink">학습 결과</h2>
      </div>

      {/* 원형 프로그레스 */}
      <div className="flex flex-col items-center py-[8px]">
        <div className="relative flex h-[180px] w-[180px] items-center justify-center">
          <svg className="absolute h-full w-full -rotate-90 -scale-y-100" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={r} fill="none" stroke="#F5F5F5" strokeWidth="22" />
            {correctQuestions > 0 && (
              <motion.circle
                cx="90"
                cy="90"
                r={r}
                fill="none"
                stroke="#FF70D4"
                strokeWidth="22"
                strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c * (1 - correctQuestions / totalQuestions) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            )}
          </svg>
          <div className="flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-[30px] font-extrabold"
              style={{ color: '#FF70D4' }}
            >
              {score}점
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="text-[12px] font-bold"
            >
              <span style={{ color: '#FF70D4' }}>{correctQuestions}</span>
              <span style={{ color: '#CCCCCC' }}>/{totalQuestions}</span>
            </motion.div>
          </div>
        </div>
      </div>

      {/* 단어 목록 — 자연 흐름, 내부 스크롤 없음 */}
      <div className="px-[14px] pb-[10px]">
        <div className="flex flex-col gap-[8px]">
          {items.map((it, idx) => {
            const meta = STATE_COLOR[it.status];
            return (
              <motion.div
                key={`${it.id}-${idx}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.8 + idx * 0.04, 1.5) }}
                className="flex items-center gap-[10px] rounded-[12px] px-[14px] py-[12px]"
                style={{ backgroundColor: it.isCorrect ? '#ECFDF3' : '#FEF3F2' }}
              >
                <div className="shrink-0">
                  {it.isCorrect ? (
                    <Circle size={20} weight="bold" color="#32D583" />
                  ) : (
                    <X size={20} weight="bold" color="#F97066" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <div className="flex items-center justify-between gap-[6px]">
                    <h3 className="truncate text-[14px] font-bold text-ink">{it.word}</h3>
                    <div
                      className="flex shrink-0 items-center gap-[3px] whitespace-nowrap rounded-[50px] border px-[6px] py-[2px] text-[9px] font-semibold"
                      style={{ color: meta.text, borderColor: meta.border, backgroundColor: meta.bg }}
                    >
                      <span>{meta.icon}</span>
                      <span>{STATE_NAME[it.status]}</span>
                    </div>
                  </div>
                  <p className="truncate text-[11px] text-sub">{it.meaning}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 하단 두 버튼 — sticky로 하단 고정 */}
      <div
        className="sticky bottom-0 z-10 flex items-center justify-between gap-[10px] px-[14px] pb-[14px] pt-[8px]"
        style={{ background: 'linear-gradient(0deg, #fff 0%, #fff 60%, rgba(255,255,255,0) 100%)' }}
      >
        <motion.button
          type="button"
          onClick={onRestart}
          whileTap={{ scale: 0.95 }}
          className="flex h-[42px] flex-1 items-center justify-center rounded-[8px] text-[14px] font-bold text-white"
          style={{ backgroundColor: '#CCCCCC' }}
        >
          테스트 다시 하기
        </motion.button>
        <motion.button
          type="button"
          onClick={onExit}
          whileTap={{ scale: 0.95 }}
          className="flex h-[42px] flex-1 items-center justify-center rounded-[8px] text-[14px] font-bold text-white"
          style={{ backgroundColor: '#FF70D4' }}
        >
          학습 종료
        </motion.button>
      </div>
    </div>
  );
}

function ResultScreen({ questions, statusBefore, statusAfter, onRestart, onExit }: ResultScreenProps) {
  // 단어 단위 통계 (cardMatch는 words[] 단위로 평가)
  const allWordIds = useMemo(() => {
    const set = new Set<number>();
    questions.forEach((q) => {
      if ((q.questionType === 'cardMatch' || q.questionType === 'cardMatchListening') && q.words) {
        q.words.forEach((w) => set.add(w.id));
      } else if (q.word) {
        set.add(q.word.id);
      }
    });
    return [...set];
  }, [questions]);

  const newWordCount = allWordIds.filter(
    (id) => statusBefore[id] === 'unlearned' && statusAfter[id] !== 'unlearned',
  ).length;
  const evolvedCount = allWordIds.filter((id) => {
    const before = STATE_RANK_GLOBAL[statusBefore[id]];
    const after = STATE_RANK_GLOBAL[statusAfter[id]];
    return before != null && after != null && after > before;
  }).length;

  // 슬라이드 시퀀스 — 실서비스 흐름: newWords → memoryImproved → dailyMission → achievement → gem → result (마지막은 항상)
  const slides = useMemo<ResultSlide[]>(() => {
    const arr: ResultSlide[] = [];
    if (newWordCount > 0) arr.push({ type: 'newWords', data: { count: newWordCount } });
    if (evolvedCount > 0) arr.push({ type: 'memoryImproved', data: { count: evolvedCount } });
    arr.push({ type: 'dailyMission' });
    arr.push({ type: 'achievement', data: { name: '단어왕', level: 1 } });
    arr.push({ type: 'gem', data: { count: 10 } });
    arr.push({ type: 'result' });
    return arr;
  }, [newWordCount, evolvedCount]);

  const [slideIdx, setSlideIdx] = useState(0);
  const current = slides[slideIdx];

  const goNext = () => {
    if (slideIdx < slides.length - 1) setSlideIdx((i) => i + 1);
  };

  // 마지막 result 화면이면 별도 레이아웃
  if (current?.type === 'result') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="result"
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
          className="flex h-full flex-col bg-white"
        >
          <FinalResult
            questions={questions}
            statusAfter={statusAfter}
            onRestart={onRestart}
            onExit={onExit}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // 일반 슬라이드: 헤더 + 핑크 글로우 + 아이콘/메시지 + 하단 "확인" 버튼
  return (
    <div className="flex h-full flex-col bg-white">
      {/* 헤더 */}
      <div className="flex h-[40px] items-center justify-center">
        <h2 className="text-[15px] font-bold text-ink">학습 결과</h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slideIdx}
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.5 }}
          className="relative flex flex-1 flex-col items-center justify-center px-[20px]"
        >
          <GlowBackground />
          <div className="relative z-[1] flex w-full flex-col items-center justify-center">
            {current?.type === 'newWords' && (
              <IconMessageSlide
                icon={
                  <img
                    src="/images/WordsStudied.png"
                    alt="새 단어 학습"
                    className="h-[100px] w-[100px] object-contain"
                  />
                }
                highlight={<>새 단어 {current.data.count}개</>}
                message={'를 학습했어요!'}
              />
            )}
            {current?.type === 'memoryImproved' && (
              <IconMessageSlide
                icon={
                  <div
                    className="flex h-[100px] w-[100px] items-center justify-center rounded-full border-[3px]"
                    style={{ backgroundColor: '#EBFFEE', borderColor: '#38CE38' }}
                  >
                    <Plant size={52} weight="fill" color="#38CE38" />
                  </div>
                }
                highlight={<>{current.data.count}개</>}
                message={'의 단어 암기 상태가 상승했어요!'}
              />
            )}
            {current?.type === 'dailyMission' && (
              <IconMessageSlide
                icon={
                  <img
                    src="/images/DailyMissionComplete.png"
                    alt="데일리 미션 완료"
                    className="h-[100px] w-[100px] object-contain"
                  />
                }
                highlight={<>데일리 미션</>}
                message={'을 완료했어요!'}
              />
            )}
            {current?.type === 'achievement' && (
              <IconMessageSlide
                icon={
                  <div className="relative h-[70px]">
                    {/* 배경 원 (레벨 1 = 갈색 #D3A686) */}
                    <div
                      className="h-[60px] w-[60px] rounded-full"
                      style={{ backgroundColor: '#D3A686' }}
                    />
                    {/* 캐릭터 이미지 (실서비스 동일 — WordKing.png) */}
                    <img
                      src="/images/WordKing.png"
                      alt={current.data.name}
                      className="absolute bottom-[10px] left-1/2 z-[1] h-[60px] w-[60px] -translate-x-1/2 object-contain"
                    />
                    {/* 레벨 텍스트 — 흰 stroke 효과 */}
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[16px] font-bold"
                      style={{
                        color: '#D3A686',
                        fontFamily: "'Cafe24Ssurround', sans-serif",
                        textShadow:
                          '-1.2px -1.2px 0 #fff, 1.2px -1.2px 0 #fff, -1.2px 1.2px 0 #fff, 1.2px 1.2px 0 #fff',
                      }}
                    >
                      <span className="text-[10px]">LV.</span>
                      {current.data.level}
                    </span>
                  </div>
                }
                highlight={<>{current.data.name} {current.data.level}레벨</>}
                message={'을 달성했어요!'}
                delay={0.5}
              />
            )}
            {current?.type === 'gem' && (
              <IconMessageSlide
                icon={
                  <img
                    src="/images/gem.png"
                    alt="보석"
                    className="h-[100px] w-[100px] object-contain"
                  />
                }
                highlight={<>보석 {current.data.count}개</>}
                message={'를 획득했어요!'}
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 하단 "확인" 버튼 — 실서비스와 동일 */}
      <div className="px-[16px] pb-[16px] pt-[12px]">
        <motion.button
          type="button"
          onClick={goNext}
          whileTap={{ scale: 0.95 }}
          className="flex h-[45px] w-full items-center justify-center rounded-[8px] text-[15px] font-bold text-white"
          style={{ backgroundColor: '#FF70D4' }}
        >
          확인
        </motion.button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// 메인 TestPlayDemo
// ──────────────────────────────────────────────────────────────────

export interface TestMetrics {
  progressIndex: number;
  total: number;
  statusByWord: Record<number, MemoryStatus>;
  typeCounts: Record<string, number>;
}

export default function TestPlayDemo({
  onMetricsChange,
}: {
  onMetricsChange?: (m: TestMetrics) => void;
}) {
  const [questions, setQuestions] = useState<TestQuestion[]>(() => buildTestQuestions());
  const [progressIndex, setProgressIndex] = useState(0);
  const [userSelected, setUserSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [memoryStateChange, setMemoryStateChange] = useState<MemoryStateChange | null>(null);
  const [nextReviewDays, setNextReviewDays] = useState<number | null>(null);
  const [userStarted, setUserStarted] = useState(false);
  const [hasEverStarted, setHasEverStarted] = useState(false);
  // 단어 기준 진행률 (0~14) — 카드 매칭은 한 단어 매칭할 때마다 +1
  const [wordProgress, setWordProgress] = useState(0);

  // 단어별 상태 추적 (시작 시점 vs 현재) — 우측 사이드 패널용
  const initialStatus = useMemo<Record<number, MemoryStatus>>(() => {
    const acc: Record<number, MemoryStatus> = {};
    demoWords.forEach((w) => {
      acc[w.id] = w.status;
    });
    return acc;
  }, []);
  const [statusByWord, setStatusByWord] = useState<Record<number, MemoryStatus>>(initialStatus);

  const cur = questions[progressIndex];
  const totalQuestions = questions.length;

  // 메트릭 통지
  useEffect(() => {
    const typeCounts: Record<string, number> = {};
    questions.forEach((q) => {
      typeCounts[q.questionType] = (typeCounts[q.questionType] ?? 0) + 1;
    });
    onMetricsChange?.({
      progressIndex,
      total: totalQuestions,
      statusByWord,
      typeCounts,
    });
  }, [progressIndex, totalQuestions, statusByWord, questions, onMetricsChange]);

  // 자동 TTS — 슬라이드 진입 시 단어 자동 재생 (cardMatch/fillInTheBlank 제외, 실서비스 동일)
  useEffect(() => {
    if (!userStarted || !cur || isFinished) return;
    stopCurrentSound();
    setIsSpeaking(false);
    const autoSpeakTypes = ['multipleChoice', 'multipleChoiceListening'];
    if (autoSpeakTypes.includes(cur.questionType) && cur.word) {
      setIsSpeaking(true);
      getTextSound(cur.word.word, 'en').finally(() => setIsSpeaking(false));
    }
  }, [progressIndex, isFinished, cur, userStarted]);

  // 옵션 표시 텍스트 (랜덤 의미 2~3개) — 진입 시점에 고정
  const optionsDisplay = useMemo(() => {
    if (!cur?.options) return [];
    return cur.options.map((o) => getDisplayMeanings(o.meanings).join(', '));
  }, [progressIndex, cur?.options]);

  // 언마운트 시 정리
  useEffect(() => () => stopCurrentSound(), []);

  const advanceToNext = useCallback(() => {
    stopCurrentSound();
    setUserSelected(null);
    setIsCorrect(null);
    setIsAnswered(false);
    setIsSpeaking(false);
    setMemoryStateChange(null);
    setNextReviewDays(null);
    if (progressIndex < totalQuestions - 1) {
      setProgressIndex((i) => i + 1);
    } else {
      setIsFinished(true);
    }
  }, [progressIndex, totalQuestions]);

  // multipleChoice / Listening / fillInTheBlank 정답 처리
  const handleSelect = (i: number) => {
    if (isAnswered) return;
    const correct = cur.resultIndex === i;
    setUserSelected(i);
    setIsCorrect(correct);
    setIsAnswered(true);
    const idx = progressIndex;
    setQuestions((qs) => {
      const next = [...qs];
      next[idx] = { ...next[idx], userResultIndex: i, isCorrect: correct };
      return next;
    });
    // 단어 1개 결판 — 프로그레스 +1
    setWordProgress((p) => Math.min(p + 1, TOTAL_WORDS));
    // 단어 단계 진화 + 채점 인터랙션 (암기 상태 변경 뱃지 + 복습 예정일 동시 표시)
    const wordId = cur.word?.id;
    if (wordId != null) {
      setStatusByWord((prev) => {
        const prevState = prev[wordId] ?? 'unlearned';
        const newState = correct ? nextStatusOnGood(prevState) : nextStatusOnBad(prevState);
        // 단계 변화 있으면 변경 배지 + 복습 예정일 동시 표시
        if (prevState !== newState) {
          setMemoryStateChange({ from: prevState, to: newState });
          setNextReviewDays(NEXT_REVIEW_DAYS_BY_STATE[newState] ?? 3);
        } else {
          // 단계 변화 없음 → 복습 예정일만 표시 (정답/오답 무관)
          setMemoryStateChange(null);
          setNextReviewDays(NEXT_REVIEW_DAYS_BY_STATE[newState] ?? (correct ? 3 : 1));
        }
        return { ...prev, [wordId]: newState };
      });
    }
    // 정답: 채점 인터랙션 보여주는 시간 확보 (1.6초), 오답: 좀 더 긴 1.8초
    setTimeout(advanceToNext, correct ? 1600 : 1800);
  };

  // cardMatch 완료 처리 — 단어별 정답 여부 dict 수신
  const handleCardMatchComplete = (perWordCorrect: Record<number, boolean>) => {
    const idx = progressIndex;
    const allCorrect = Object.values(perWordCorrect).every(Boolean);
    setQuestions((qs) => {
      const next = [...qs];
      next[idx] = { ...next[idx], isCorrect: allCorrect, perWordCorrect };
      return next;
    });
    // 각 단어별 정답 여부로 상태 진화
    setStatusByWord((prev) => {
      const next = { ...prev };
      cur.words?.forEach((w) => {
        const isOk = perWordCorrect[w.id];
        const cur2 = prev[w.id] ?? 'unlearned';
        next[w.id] = isOk ? nextStatusOnGood(cur2) : nextStatusOnBad(cur2);
      });
      return next;
    });
    setTimeout(advanceToNext, 600);
  };

  // 스피커 클릭 (multipleChoice/Listening 공통)
  const handleSpeak = () => {
    if (!cur.word) return;
    setIsSpeaking(true);
    getTextSound(cur.word.word, 'en').finally(() => setIsSpeaking(false));
  };

  const handleRestart = () => {
    stopCurrentSound();
    setQuestions(buildTestQuestions());
    setProgressIndex(0);
    setWordProgress(0);
    setUserSelected(null);
    setIsCorrect(null);
    setIsAnswered(false);
    setIsSpeaking(false);
    setIsFinished(false);
    setMemoryStateChange(null);
    setNextReviewDays(null);
    setStatusByWord(initialStatus);
  };

  const handleStartDemo = () => {
    stopCurrentSound();
    setQuestions(buildTestQuestions());
    setProgressIndex(0);
    setWordProgress(0);
    setUserSelected(null);
    setIsCorrect(null);
    setIsAnswered(false);
    setIsSpeaking(false);
    setIsFinished(false);
    setMemoryStateChange(null);
    setNextReviewDays(null);
    setStatusByWord(initialStatus);
    setUserStarted(true);
    setHasEverStarted(true);
  };

  const handleExitToGate = () => {
    stopCurrentSound();
    setUserStarted(false);
    setIsFinished(false);
  };

  // 슬라이드 variants
  const slideVariants = {
    enter: { x: '100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  };

  if (!cur && !isFinished) return null;

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      <div className="relative rounded-[44px] bg-ink p-[6px] shadow-card">
        <div className="relative overflow-hidden rounded-[38px] bg-white">
          {/* 시작 게이트 오버레이 */}
          <AnimatePresence>
            {!userStarted && (
              <motion.div
                key="test-gate"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm"
              >
                <motion.button
                  type="button"
                  onClick={handleStartDemo}
                  aria-label={hasEverStarted ? '다시 체험하기' : '체험하기'}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-[10px] bg-[#FF70D4] px-[28px] h-[52px] text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(255,112,212,0.4)]"
                >
                  {hasEverStarted ? '다시 체험하기' : '체험하기'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-ink" />

          {/* status bar */}
          <div className="flex items-center justify-between px-7 pt-2 text-[10px] font-semibold text-ink">
            <span>9:41</span>
            <span>●●●●</span>
          </div>

          {/* 프로그레스 바 — 단어 기준 진행률 (총 14단어, 카드 매칭은 단어별 +1) */}
          <div className="px-[16px] pt-6">
            <motion.div className="relative mb-[15px] h-[16px] w-full overflow-hidden rounded-[50px] bg-primary-100">
              <motion.div
                className="h-full rounded-[50px] bg-primary-500"
                initial={{ width: '0%' }}
                animate={{ width: `${(wordProgress / TOTAL_WORDS) * 100}%` }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
              <span
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#7b7b7b]"
                style={{ letterSpacing: '-0.2px' }}
              >
                {wordProgress}/{TOTAL_WORDS}
              </span>
            </motion.div>
          </div>

          {/* 문제 영역 — 결과 화면일 때는 전체 영역 스크롤 */}
          <div className={`relative h-[500px] px-[16px] pb-[20px] ${isFinished ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            {isFinished ? (
              <ResultScreen
                questions={questions}
                statusBefore={initialStatus}
                statusAfter={statusByWord}
                onRestart={handleRestart}
                onExit={handleExitToGate}
              />
            ) : (
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={progressIndex}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute inset-x-[16px] top-0 bottom-[20px]"
                >
                  {(cur.questionType === 'multipleChoice' || cur.questionType === 'multipleChoiceListening') && (
                    <MultipleChoiceCard
                      question={cur}
                      optionsDisplay={optionsDisplay}
                      userSelected={userSelected}
                      isCorrect={isCorrect}
                      isAnswered={isAnswered}
                      onSelect={handleSelect}
                      onSpeak={handleSpeak}
                      isSpeaking={isSpeaking}
                      memoryStateChange={memoryStateChange}
                      nextReviewDays={nextReviewDays}
                    />
                  )}
                  {cur.questionType === 'fillInTheBlank' && (
                    <FillBlankCard
                      question={cur}
                      userSelected={userSelected}
                      isCorrect={isCorrect}
                      isAnswered={isAnswered}
                      onSelect={handleSelect}
                      memoryStateChange={memoryStateChange}
                      nextReviewDays={nextReviewDays}
                    />
                  )}
                  {(cur.questionType === 'cardMatch' || cur.questionType === 'cardMatchListening') && (
                    <CardMatchCard
                      key={progressIndex}
                      question={cur}
                      isListening={cur.questionType === 'cardMatchListening'}
                      currentStatusByWord={statusByWord}
                      onWordResolved={() => setWordProgress((p) => Math.min(p + 1, TOTAL_WORDS))}
                      onAllMatched={handleCardMatchComplete}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-caption text-mute">
        선택지를 눌러 정답을 맞춰보세요. 5가지 문제 유형이 섞여 14문제 출제됩니다.
      </p>
    </div>
  );
}
