// AI 추천 테스트 데모용 14문제 생성기 — 실서비스 takeTest/Main.jsx + question plugins 기반
// 5가지 문제 유형 혼합: multipleChoice / multipleChoiceListening / fillInTheBlank / cardMatch / cardMatchListening

import { demoWords, type DemoWord, type MemoryStatus } from './demoWords';

export type QuestionType =
  | 'multipleChoice'
  | 'multipleChoiceListening'
  | 'fillInTheBlank'
  | 'cardMatch'
  | 'cardMatchListening';

export interface Option {
  word: string;
  ipa: string;
  meanings: string[];
}

export interface TestQuestion {
  questionType: QuestionType;
  /** 대상 단어 (multipleChoice/Listening/fillInTheBlank 단일 단어) */
  word?: DemoWord;
  /** 4개 카드 세트 (cardMatch/cardMatchListening) */
  words?: DemoWord[];
  /** 4지선다 옵션들 (multipleChoice/Listening/fillInTheBlank) */
  options?: Option[];
  /** 정답 인덱스 (options 또는 words에 대한) */
  resultIndex?: number;
  /** 사용자 응답 인덱스 (풀이 후 채워짐) */
  userResultIndex?: number;
  /** 채점 결과 (단일 단어 문제: 정/오답 / cardMatch: 모두 한 번에 정답이었는지) */
  isCorrect?: boolean;
  /** cardMatch 단어별 정답 여부 (wordId → boolean) */
  perWordCorrect?: Record<number, boolean>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickWithout<T>(arr: T[], exclude: T, count: number): T[] {
  return shuffle(arr.filter((x) => x !== exclude)).slice(0, count);
}

/** 옵션 4개 만들기 — 정답 단어 + 다른 3개 단어 → 무작위 위치에 정답 배치 */
function buildOptionsFor(targetWord: DemoWord, pool: DemoWord[]): { options: Option[]; resultIndex: number } {
  const distractors = pickWithout(pool, targetWord, 3);
  const all = [targetWord, ...distractors];
  const shuffled = shuffle(all);
  const resultIndex = shuffled.findIndex((w) => w.id === targetWord.id);
  const options: Option[] = shuffled.map((w) => ({
    word: w.word,
    ipa: w.ipa,
    meanings: w.meanings,
  }));
  return { options, resultIndex };
}

/** 데모 테스트 세트 생성 — 총 14단어 사용
 *   multipleChoice × 2  (2단어)
 *   multipleChoiceListening × 2  (2단어)
 *   fillInTheBlank × 2  (2단어)
 *   cardMatch × 1  (4단어)
 *   cardMatchListening × 1  (4단어)
 *   합계: 6 문제 / 14 단어
 *   진행률은 단어 기준으로 카운트 (카드 매칭 1개 매칭 = 1단어 진행)
 */
export function buildTestQuestions(): TestQuestion[] {
  const pool = [...demoWords];
  const shuffled = shuffle(pool); // 14개 단어 셔플
  const questions: TestQuestion[] = [];

  // 1) multipleChoice × 2 (단어 0,1)
  for (let i = 0; i < 2; i++) {
    const word = shuffled[i];
    const { options, resultIndex } = buildOptionsFor(word, pool);
    questions.push({ questionType: 'multipleChoice', word, options, resultIndex });
  }

  // 2) multipleChoiceListening × 2 (단어 2,3)
  for (let i = 2; i < 4; i++) {
    const word = shuffled[i];
    const { options, resultIndex } = buildOptionsFor(word, pool);
    questions.push({ questionType: 'multipleChoiceListening', word, options, resultIndex });
  }

  // 3) fillInTheBlank × 2 (단어 4,5)
  for (let i = 4; i < 6; i++) {
    const word = shuffled[i];
    const { options, resultIndex } = buildOptionsFor(word, pool);
    questions.push({ questionType: 'fillInTheBlank', word, options, resultIndex });
  }

  // 4) cardMatch × 1 (단어 6~9, 4단어)
  questions.push({ questionType: 'cardMatch', words: shuffled.slice(6, 10) });

  // 5) cardMatchListening × 1 (단어 10~13, 4단어)
  questions.push({ questionType: 'cardMatchListening', words: shuffled.slice(10, 14) });

  return questions;
}

/** 한 문제가 차지하는 단어 수 — 진행률 계산용 */
export function wordCountOf(q: TestQuestion): number {
  if (q.questionType === 'cardMatch' || q.questionType === 'cardMatchListening') {
    return q.words?.length ?? 0;
  }
  return q.word ? 1 : 0;
}

/** 전체 단어 수 (보통 14) */
export const TOTAL_WORDS = 14;
