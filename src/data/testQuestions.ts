// 복습 테스트 데모용 문제 생성기 — 실서비스 takeTest/Main.jsx + question plugins 기반
// 문제 유형 혼합: 사지선다 / 듣기 / 빈칸 채우기 / 빈칸 입력 / 문장 만들기 / 카드 맞추기

import { demoWords, type DemoWord, type MemoryStatus } from './demoWords';

export type QuestionType =
  | 'multipleChoice'
  | 'multipleChoiceListening'
  | 'fillInTheBlank'
  | 'fillInTheBlankTyping'
  | 'sentenceArrange'
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

/** 데모 테스트 세트 생성 — 총 12단어 사용
 *   multipleChoice × 2 · multipleChoiceListening × 2 · fillInTheBlank × 2
 *   fillInTheBlankTyping × 1 · sentenceArrange × 1 · cardMatch × 1 (4단어)
 *   진행률은 단어 기준으로 카운트 (카드 맞추기 1쌍 = 1단어 진행)
 *   문장 만들기는 조각이 너무 많지 않게 짧은 예문 단어로, 입력 문제는 철자가 짧은 단어로 고른다.
 */
export function buildTestQuestions(): TestQuestion[] {
  const pool = [...demoWords];
  const wordCount = (w: DemoWord) => w.example.en.split(/\s+/).length;
  // 문장 만들기 · 빈칸 입력 대상 먼저 고정
  const arrange = shuffle(pool.filter((w) => wordCount(w) <= 7))[0];
  const typing = shuffle(pool.filter((w) => w !== arrange && w.word.length <= 8))[0];
  const rest = shuffle(pool.filter((w) => w !== arrange && w !== typing));
  const questions: TestQuestion[] = [];

  const single = (type: QuestionType, word: DemoWord) => {
    const { options, resultIndex } = buildOptionsFor(word, pool);
    questions.push({ questionType: type, word, options, resultIndex });
  };

  single('multipleChoice', rest[0]);
  single('multipleChoiceListening', rest[1]);
  single('fillInTheBlank', rest[2]);
  questions.push({ questionType: 'fillInTheBlankTyping', word: typing });
  single('multipleChoice', rest[3]);
  single('fillInTheBlank', rest[4]);
  questions.push({ questionType: 'sentenceArrange', word: arrange });
  single('multipleChoiceListening', rest[5]);
  questions.push({ questionType: 'cardMatch', words: rest.slice(6, 10) });

  return questions;
}

/** 한 문제가 차지하는 단어 수 — 진행률 계산용 */
export function wordCountOf(q: TestQuestion): number {
  if (q.questionType === 'cardMatch' || q.questionType === 'cardMatchListening') {
    return q.words?.length ?? 0;
  }
  return q.word ? 1 : 0;
}

/** 전체 단어 수 */
export const TOTAL_WORDS = 12;
