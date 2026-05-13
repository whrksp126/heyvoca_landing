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
  /** 채점 결과 */
  isCorrect?: boolean;
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

/** 14문제 데모 세트 생성 — 유형 분포: MC 4, MC-Listen 3, Fill 3, CardMatch 2, CardMatchListening 2 = 14 */
export function buildTestQuestions(): TestQuestion[] {
  const pool = [...demoWords];
  const shuffled = shuffle(pool);
  const questions: TestQuestion[] = [];

  // 1) multipleChoice × 4
  for (let i = 0; i < 4; i++) {
    const word = shuffled[i];
    const { options, resultIndex } = buildOptionsFor(word, pool);
    questions.push({ questionType: 'multipleChoice', word, options, resultIndex });
  }

  // 2) multipleChoiceListening × 3
  for (let i = 4; i < 7; i++) {
    const word = shuffled[i];
    const { options, resultIndex } = buildOptionsFor(word, pool);
    questions.push({ questionType: 'multipleChoiceListening', word, options, resultIndex });
  }

  // 3) fillInTheBlank × 3
  for (let i = 7; i < 10; i++) {
    const word = shuffled[i];
    const { options, resultIndex } = buildOptionsFor(word, pool);
    questions.push({ questionType: 'fillInTheBlank', word, options, resultIndex });
  }

  // 4) cardMatch × 2 (각 4개 단어 매칭)
  questions.push({ questionType: 'cardMatch', words: shuffled.slice(10, 14) });
  questions.push({ questionType: 'cardMatch', words: shuffle([...pool]).slice(0, 4) });

  // 5) cardMatchListening × 2
  questions.push({ questionType: 'cardMatchListening', words: shuffle([...pool]).slice(0, 4) });
  questions.push({ questionType: 'cardMatchListening', words: shuffle([...pool]).slice(0, 4) });

  return questions;
}
