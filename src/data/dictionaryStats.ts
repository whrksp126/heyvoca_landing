// 자체 사전 통계 — 메인 페이지/카피에서 표시.
// 실제 수치는 로컬 사전 dump(20261029-1) 실측 기준이며 수동 갱신합니다.

export const dictionaryStats = {
  // 영한 사전 표제어 수
  wordCount: 49990,
  // 영한 사전 예문 수
  exampleCount: 99093,
  // 일한 사전 항목 수 (heyvoca_dict_ja)
  jaWordCount: 23143,
  // 서점 단어장 수 (영어 213 + 일본어 JLPT 25)
  bookstoreBookCount: 238,
  // 마지막 사전 갱신일 (YYYY-MM-DD)
  lastUpdated: '2026-11-08',
};

// 카피용 포맷 문자열 (CountUpNumber 는 "숫자+접미사" 형식을 파싱)
export const dictWordCount: string = '49,000+';
export const dictExampleCount: string = '99,000+';
export const jaDictWordCount: string = '23,000+';
export const bookstoreBookCount: string = '230+';
