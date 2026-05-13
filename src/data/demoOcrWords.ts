// OCR 시뮬레이션용 mock 응답 단어 데이터.
// 각 단어는 책 페이지 SVG 위 좌표(인식 박스)와 매칭됨.
//
// 좌표계 설명:
// - 책 페이지 SVG viewBox: 100 × 140 (퍼센트 기준, 가로 100, 세로 140)
// - 단어 박스 좌표는 본문 라인들과 1:1로 매칭되어 있어 실제 단어 위치에 정확히 겹침.
// - line height: 7, 본문 시작 y: 22 (= 첫 줄 y 위치, baseline 기준 위쪽으로 4 정도가 글자 박스 top).

export interface OcrBoxRect {
  // 책 페이지 SVG 좌표계 (viewBox 100×140) 기준
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DemoOcrWord {
  word: string;
  ipa: string;
  // 리스트에서 보여줄 짧은 의미 요약 (1줄)
  meaningSummary: string;
  meanings: string[];
  // 단어의 품사 표기 (실제 서비스 dict와 동일하게 '동사', '명사' 등)
  examples: { en: string; ko: string }[];
  // SVG 위 인식 박스 좌표 (등장 순서)
  rect: OcrBoxRect;
}

// 책 페이지 위에 표시할 모든 인식 박스 (메인 6개 + 더미 박스).
// 좌표는 BookPageSvg 의 본문 라인들과 정확히 일치하도록 측정됨.
// 박스 높이 5는 본문 글자 박스를 살짝 감싸도록 설정.
export const ocrAllBoxes: OcrBoxRect[] = [
  // 1줄(y=22): Sometimes [serendipity] arrives in
  { x: 22.5, y: 18.5, width: 19, height: 5.5 },   // [0] serendipity ★
  // 2줄(y=29): small moments — an [ephemeral] glance, a
  { x: 28, y: 25.5, width: 17, height: 5.5 },     // [1] ephemeral ★
  // 3줄(y=36): song. She wrote [mellifluous] words and
  { x: 22, y: 32.5, width: 19, height: 5.5 },     // [2] mellifluous ★
  // 4줄(y=43): kept a [resilient] spirit through
  { x: 17.5, y: 39.5, width: 14, height: 5.5 },   // [3] resilient ★
  // 5줄(y=50): everything. [Ubiquitous] light surrounded
  { x: 24.5, y: 46.5, width: 17, height: 5.5 },   // [4] ubiquitous ★
  // 6줄(y=57): them, and she had to [accomplish] one
  { x: 36.5, y: 53.5, width: 18, height: 5.5 },   // [5] accomplish ★
  // 더미 박스 (다른 일반 단어들 — 등장은 하지만 dict 결과엔 없음)
  { x: 5, y: 18.5, width: 16, height: 5.5 },      // [6] Sometimes
  { x: 47, y: 25.5, width: 12, height: 5.5 },     // [7] glance
  { x: 43, y: 32.5, width: 9, height: 5.5 },      // [8] words
  { x: 33, y: 39.5, width: 11, height: 5.5 },     // [9] spirit
  { x: 5, y: 46.5, width: 18, height: 5.5 },      // [10] everything
  { x: 5, y: 53.5, width: 11, height: 5.5 },      // [11] them
];

// 인식 결과 리스트로 노출되는 단어 6개 (실제 서비스 /ocr/words 응답과 동일한 shape).
export const demoOcrWords: DemoOcrWord[] = [
  {
    word: 'serendipity',
    ipa: '/ˌserənˈdɪpəti/',
    meaningSummary: '뜻밖의 행운, 우연한 발견',
    meanings: ['뜻밖의 행운', '우연한 발견', '뜻하지 않게 좋은 것을 찾아내는 능력'],
    examples: [
      {
        en: 'A series of <b>serendipities</b> led to her career.',
        ko: '연속된 우연이 그녀의 커리어로 이어졌다.',
      },
    ],
    rect: { x: 22.5, y: 18.5, width: 19, height: 5.5 },
  },
  {
    word: 'ephemeral',
    ipa: '/ɪˈfemərəl/',
    meaningSummary: '덧없는, 순식간의',
    meanings: ['덧없는', '수명이 짧은', '순식간에 사라지는'],
    examples: [
      {
        en: 'Beauty is often <b>ephemeral</b>.',
        ko: '아름다움은 종종 덧없다.',
      },
    ],
    rect: { x: 28, y: 25.5, width: 17, height: 5.5 },
  },
  {
    word: 'mellifluous',
    ipa: '/məˈlɪfluəs/',
    meaningSummary: '감미로운, 듣기 좋은',
    meanings: ['감미로운', '듣기 좋은', '꿀같이 부드러운'],
    examples: [
      {
        en: 'Her <b>mellifluous</b> voice filled the hall.',
        ko: '감미로운 그녀의 목소리가 홀을 채웠다.',
      },
    ],
    rect: { x: 22, y: 32.5, width: 19, height: 5.5 },
  },
  {
    word: 'resilient',
    ipa: '/rɪˈzɪliənt/',
    meaningSummary: '회복력 있는, 탄력 있는',
    meanings: ['회복력이 있는', '탄력 있는', '쉽게 흔들리지 않는'],
    examples: [
      {
        en: 'Children are remarkably <b>resilient</b>.',
        ko: '아이들은 놀라울 만큼 회복력이 빠르다.',
      },
    ],
    rect: { x: 17.5, y: 39.5, width: 14, height: 5.5 },
  },
  {
    word: 'ubiquitous',
    ipa: '/juːˈbɪkwɪtəs/',
    meaningSummary: '어디에나 있는, 흔한',
    meanings: ['어디에나 있는', '편재하는', '흔히 보이는'],
    examples: [
      {
        en: 'Smartphones are <b>ubiquitous</b> nowadays.',
        ko: '요즘은 스마트폰을 어디서나 볼 수 있다.',
      },
    ],
    rect: { x: 24.5, y: 46.5, width: 17, height: 5.5 },
  },
  {
    word: 'accomplish',
    ipa: '/əˈkɑːmplɪʃ/',
    meaningSummary: '성취하다, 완수하다',
    meanings: ['성취하다', '완수하다', '해내다'],
    examples: [
      {
        en: 'She <b>accomplished</b> her goal of running a marathon.',
        ko: '그녀는 마라톤을 완주하는 목표를 이뤘다.',
      },
    ],
    rect: { x: 36.5, y: 53.5, width: 18, height: 5.5 },
  },
];

// 매칭된 인식 박스만 (메인 6개 — 처음 6개 = 매칭 단어, 이후 = 더미).
// 인식 박스 stagger 등장 시 매칭 박스를 우선 강조, 더미는 좀 더 옅게 표현.
export const ocrMatchedBoxCount = 6;
