// 자체 사전 통계 — 메인 페이지/카피에서 표시.
// 실제 수치는 백엔드 사전 dump 기준이며 주기적으로 갱신됩니다.

export const dictionaryStats = {
  // 등록된 표제어 수
  wordCount: 4680,
  // 등록된 예문 수
  exampleCount: 23400,
  // 단어당 평균 의미 개수
  avgMeaningsPerWord: 2.8,
  // 마지막 사전 갱신일 (YYYY-MM-DD)
  lastUpdated: '2026-05-13',
};

// 카피용 포맷 문자열
export const dictWordCount: string = '4,680+';
export const dictExampleCount: string = '23,000+';
export const dictAvgMeanings: string = '2.8개';
