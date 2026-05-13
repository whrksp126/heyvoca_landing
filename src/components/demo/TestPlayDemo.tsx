// AI 추천 테스트 데모 — 실서비스 takeTest/Main.jsx 및 question plugins 기반 5가지 문제 유형 인터랙티브
// 14문제 풀이형, 정답/오답 피드백, 결과 화면

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, X, SpeakerHigh, HandsClapping } from '@phosphor-icons/react';
import { buildTestQuestions, type TestQuestion, type Option as QOption } from '../../data/testQuestions';
import type { DemoWord, MemoryStatus } from '../../data/demoWords';
import { demoWords, nextStatusOnGood, nextStatusOnBad } from '../../data/demoWords';
import MemorizationStatus from './MemorizationStatus';
import { getTextSound, stopCurrentSound } from '../../utils/tts';

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
  let style = '';
  if (isCorrect !== null && isAnswer) {
    // 정답 정답표시
    style = 'border-[#22C55E] text-[#16A34A] bg-[#DCFCE7]';
  } else if (isCorrect === false && selected) {
    style = 'border-[#EF4444] text-[#DC2626] bg-[#FEE2E2]';
  } else if (isCorrect === null && selected) {
    style = 'border-primary-500 bg-primary-100/40 text-ink';
  } else {
    style = 'border-[#E5E7EB] text-ink';
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
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-[-1] -translate-x-1/2 -translate-y-1/2">
      <AnimatePresence>
        {isCorrect === true && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25, duration: 0.3 }}
          >
            <Circle size={150} weight="bold" color="#22C55E" />
          </motion.div>
        )}
        {isCorrect === false && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 600, damping: 25, duration: 0.3 }}
          >
            <X size={150} weight="bold" color="#EF4444" />
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
}

function FillBlankCard({ question, userSelected, isCorrect, isAnswered, onSelect }: FillProps) {
  const word = question.word!;
  const blanked = replaceWordWithBlank(word.example.en, word.word);
  return (
    <div className="flex h-full flex-col gap-[15px]">
      <div className="relative flex flex-1 flex-col items-center justify-center gap-[12px] rounded-[12px] bg-[#F5F5F5] px-[20px] py-[24px] text-center">
        <p className="text-[12px] font-bold uppercase tracking-wider text-mute">빈칸에 들어갈 단어는?</p>
        <p className="text-[18px] font-semibold text-ink leading-[1.5]">
          {blanked.split('_____').map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className="mx-1 inline-block min-w-[80px] border-b-2 border-primary-500 align-baseline">
                  {isAnswered && (
                    <span className="px-2 font-bold text-primary-500">{word.word}</span>
                  )}
                </span>
              )}
            </span>
          ))}
        </p>
        {isAnswered && (
          <p className="text-[13px] text-mute">{word.example.ko}</p>
        )}
        <ResultOverlay isCorrect={isCorrect} />
      </div>

      <div className="grid grid-cols-2 gap-[10px]">
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
  onAllMatched: (isCorrect: boolean) => void;
}

function CardMatchCard({ question, isListening, onAllMatched }: CardMatchProps) {
  const words = question.words!;
  // 좌측 단어 카드 (또는 음성 카드)
  const leftCards = useMemo(() => words.map((w) => ({ id: w.id, word: w.word, label: w.word })), [words]);
  // 우측 뜻 카드 — 셔플
  const rightCards = useMemo(() => {
    return [...words]
      .sort(() => Math.random() - 0.5)
      .map((w) => ({ id: w.id, meaning: w.meanings[0], label: w.meanings.slice(0, 2).join(', ') }));
  }, [words]);

  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<{ left: number; right: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const handleLeftClick = (id: number) => {
    if (matched.has(id)) return;
    if (isListening) {
      const target = leftCards.find((c) => c.id === id);
      if (target) getTextSound(target.word, 'en');
    }
    setSelectedLeft(id);
    if (selectedRight != null) tryMatch(id, selectedRight);
  };
  const handleRightClick = (id: number) => {
    if (matched.has(id)) return;
    setSelectedRight(id);
    if (selectedLeft != null) tryMatch(selectedLeft, id);
  };

  const tryMatch = (leftId: number, rightId: number) => {
    if (leftId === rightId) {
      const next = new Set(matched);
      next.add(leftId);
      setMatched(next);
      setSelectedLeft(null);
      setSelectedRight(null);
      if (next.size === words.length) {
        setTimeout(() => onAllMatched(mistakes === 0), 400);
      }
    } else {
      setWrongFlash({ left: leftId, right: rightId });
      setMistakes((m) => m + 1);
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  };

  return (
    <div className="flex h-full flex-col gap-[15px]">
      <div className="rounded-[12px] bg-[#F5F5F5] p-[16px]">
        <p className="mb-[12px] text-center text-[13px] font-semibold text-mute">
          {isListening ? '음성을 듣고 뜻과 짝지으세요' : '단어와 뜻을 짝지으세요'}
        </p>
        <div className="grid grid-cols-2 gap-[10px]">
          {/* 좌측: 단어 또는 스피커 */}
          <div className="flex flex-col gap-[8px]">
            {leftCards.map((c) => {
              const isMatched = matched.has(c.id);
              const isSelected = selectedLeft === c.id;
              const isWrong = wrongFlash?.left === c.id;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => handleLeftClick(c.id)}
                  disabled={isMatched}
                  whileTap={!isMatched ? { scale: 0.96 } : undefined}
                  animate={
                    isWrong
                      ? { x: [-4, 4, -4, 4, 0], backgroundColor: '#FEE2E2' }
                      : isMatched
                      ? { opacity: 0.4, backgroundColor: '#DCFCE7' }
                      : { x: 0, opacity: 1 }
                  }
                  transition={{ duration: 0.4 }}
                  className={`flex h-[50px] items-center justify-center rounded-[10px] border text-center text-[14px] font-bold ${
                    isSelected ? 'border-primary-500 bg-primary-100/40' : 'border-[#E5E7EB] bg-white'
                  } text-ink`}
                >
                  {isListening ? (
                    <SpeakerHigh size={20} weight="fill" color={isMatched ? '#22C55E' : '#FF70D4'} />
                  ) : (
                    c.label
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* 우측: 뜻 */}
          <div className="flex flex-col gap-[8px]">
            {rightCards.map((c) => {
              const isMatched = matched.has(c.id);
              const isSelected = selectedRight === c.id;
              const isWrong = wrongFlash?.right === c.id;
              return (
                <motion.button
                  key={c.id}
                  type="button"
                  onClick={() => handleRightClick(c.id)}
                  disabled={isMatched}
                  whileTap={!isMatched ? { scale: 0.96 } : undefined}
                  animate={
                    isWrong
                      ? { x: [-4, 4, -4, 4, 0], backgroundColor: '#FEE2E2' }
                      : isMatched
                      ? { opacity: 0.4, backgroundColor: '#DCFCE7' }
                      : { x: 0, opacity: 1 }
                  }
                  transition={{ duration: 0.4 }}
                  className={`flex h-[50px] items-center justify-center overflow-hidden rounded-[10px] border px-2 text-center text-[12px] font-bold ${
                    isSelected ? 'border-primary-500 bg-primary-100/40' : 'border-[#E5E7EB] bg-white'
                  } text-ink`}
                >
                  <span className="line-clamp-2">{c.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        <p className="mt-[12px] text-center text-[11px] text-mute">
          {matched.size}/{words.length} 매칭 완료 {mistakes > 0 && `· 오답 ${mistakes}회`}
        </p>
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
}

function ResultScreen({ questions, statusBefore, statusAfter, onRestart }: ResultScreenProps) {
  const totalAnswered = questions.filter((q) => typeof q.isCorrect === 'boolean').length;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const evolved = Object.keys(statusAfter).filter(
    (id) => statusAfter[+id] !== statusBefore[+id],
  ).length;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-[20px] rounded-[12px] bg-[#F5F5F5] p-[24px] text-center">
      <HandsClapping size={64} weight="fill" color="#FF70D4" />
      <h3 className="text-[24px] font-bold text-ink">테스트 완료!</h3>
      <div className="grid w-full grid-cols-3 gap-[8px] text-center">
        <div className="rounded-[10px] bg-white p-[12px]">
          <p className="text-[12px] text-mute">정답률</p>
          <p className="mt-1 text-[22px] font-bold text-primary-500">{accuracy}%</p>
        </div>
        <div className="rounded-[10px] bg-white p-[12px]">
          <p className="text-[12px] text-mute">맞춘 개수</p>
          <p className="mt-1 text-[22px] font-bold text-ink">
            {correctCount}/{totalAnswered}
          </p>
        </div>
        <div className="rounded-[10px] bg-white p-[12px]">
          <p className="text-[12px] text-mute">진화한 단어</p>
          <p className="mt-1 text-[22px] font-bold text-[#38CE38]">{evolved}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRestart}
        className="mt-[8px] inline-flex h-[45px] items-center justify-center rounded-[8px] bg-primary-500 px-[24px] text-[14px] font-bold text-white transition hover:bg-primary-600"
      >
        다시 시작
      </button>
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

  // 자동 TTS — multipleChoiceListening 진입 시
  useEffect(() => {
    if (!cur || isFinished) return;
    stopCurrentSound();
    setIsSpeaking(false);
    if (cur.questionType === 'multipleChoiceListening' && cur.word) {
      setIsSpeaking(true);
      getTextSound(cur.word.word, 'en').finally(() => setIsSpeaking(false));
    }
  }, [progressIndex, isFinished, cur]);

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
    // 단어 단계 진화
    const wordId = cur.word?.id;
    if (wordId != null) {
      setStatusByWord((prev) => ({
        ...prev,
        [wordId]: correct ? nextStatusOnGood(prev[wordId] ?? 'unlearned') : nextStatusOnBad(prev[wordId] ?? 'unlearned'),
      }));
    }
    setTimeout(advanceToNext, correct ? 900 : 1300);
  };

  // cardMatch 완료 처리
  const handleCardMatchComplete = (isAllCorrect: boolean) => {
    const idx = progressIndex;
    setQuestions((qs) => {
      const next = [...qs];
      next[idx] = { ...next[idx], isCorrect: isAllCorrect };
      return next;
    });
    // 4개 단어 모두 진화
    setStatusByWord((prev) => {
      const next = { ...prev };
      cur.words?.forEach((w) => {
        next[w.id] = isAllCorrect ? nextStatusOnGood(prev[w.id] ?? 'unlearned') : (prev[w.id] ?? 'unlearned');
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
    setUserSelected(null);
    setIsCorrect(null);
    setIsAnswered(false);
    setIsSpeaking(false);
    setIsFinished(false);
    setStatusByWord(initialStatus);
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
      <div className="rounded-[44px] bg-ink p-[6px] shadow-card">
        <div className="relative overflow-hidden rounded-[38px] bg-white">
          <div className="absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-ink" />

          {/* status bar */}
          <div className="flex items-center justify-between px-7 pt-2 text-[10px] font-semibold text-ink">
            <span>9:41</span>
            <span>●●●●</span>
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-[20px] pt-6">
            <span className="text-[14px] font-semibold text-ink">AI 추천 테스트</span>
            <span className="text-[12px] font-semibold text-mute">
              {isFinished ? '완료' : `${progressIndex + 1} / ${totalQuestions}`}
            </span>
          </div>

          {/* 프로그레스 바 — 실서비스: h-[16px] mb-[15px] rounded-[50px] */}
          <div className="px-[16px] pt-[5px]">
            <motion.div className="relative mb-[15px] h-[16px] w-full overflow-hidden rounded-[50px] bg-primary-100">
              <motion.div
                className="h-full rounded-[50px] bg-primary-500"
                initial={{ width: '0%' }}
                animate={{ width: `${(progressIndex / totalQuestions) * 100 + (isAnswered ? (1 / totalQuestions) * 100 : 0)}%` }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              />
              <span
                className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#7b7b7b]"
                style={{ letterSpacing: '-0.2px' }}
              >
                {progressIndex}/{totalQuestions}
              </span>
            </motion.div>
          </div>

          {/* 문제 영역 */}
          <div className="relative h-[500px] overflow-hidden px-[16px] pb-[20px]">
            {isFinished ? (
              <ResultScreen
                questions={questions}
                statusBefore={initialStatus}
                statusAfter={statusByWord}
                onRestart={handleRestart}
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
                    />
                  )}
                  {cur.questionType === 'fillInTheBlank' && (
                    <FillBlankCard
                      question={cur}
                      userSelected={userSelected}
                      isCorrect={isCorrect}
                      isAnswered={isAnswered}
                      onSelect={handleSelect}
                    />
                  )}
                  {(cur.questionType === 'cardMatch' || cur.questionType === 'cardMatchListening') && (
                    <CardMatchCard
                      key={progressIndex}
                      question={cur}
                      isListening={cur.questionType === 'cardMatchListening'}
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
