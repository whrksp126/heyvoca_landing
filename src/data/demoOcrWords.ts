// OCR 시뮬레이션용 데이터 — 단일 소스에서 책 페이지 본문과 인식 박스 좌표를 함께 도출.
// 5개 타깃 단어(demoWords.ts와 동일)가 본문에 자연스럽게 등장하며, 박스 좌표는 줄/열 index 기반으로 자동 계산.

export interface OcrBoxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DemoOcrWord {
  word: string;
  ipa: string;
  meaningSummary: string;
  meanings: string[];
  examples: { en: string; ko: string }[];
  rect: OcrBoxRect;
}

// ─── 책 페이지 본문 (오리지널 산문, 타깃 5개 단어 포함) ──────────────────────
// 모노스페이스 폰트 가정으로 글자 간격이 균일해야 박스 좌표 계산이 정확함.
export const pageLines: string[] = [
  'Sometimes serendipity arrives in',
  'the smallest moments — an apple',
  'shared at dusk, an ephemeral',
  'glance through the open doorway.',
  'She wrote mellifluous notes by',
  'candlelight, hoping to accomplish',
  'one quiet thing each evening,',
  'to listen, to hold a small truth,',
  'and begin again at sunrise.',
];

// 모노스페이스 본문 렌더 파라미터 (BookPageSvg와 공유)
export const TEXT_RENDER = {
  pageW: 100,
  pageH: 140,
  lineXStart: 6,
  lineYStart: 22,
  lineHeight: 7,
  charW: 1.92,        // 모노스페이스 fontSize 3.2 기준 글자 advance
  fontSize: 3.2,
  textHeight: 5.2,    // 인식 박스 높이 (글자 상단 여백 포함)
  yOffsetFromBaseline: 3.6, // baseline 기준 박스 top까지 거리
};

function findWordRect(word: string): OcrBoxRect | null {
  for (let lineIdx = 0; lineIdx < pageLines.length; lineIdx++) {
    const line = pageLines[lineIdx];
    const col = line.indexOf(word);
    if (col !== -1) {
      return {
        x: TEXT_RENDER.lineXStart + col * TEXT_RENDER.charW,
        y: TEXT_RENDER.lineYStart + lineIdx * TEXT_RENDER.lineHeight - TEXT_RENDER.yOffsetFromBaseline,
        width: word.length * TEXT_RENDER.charW,
        height: TEXT_RENDER.textHeight,
      };
    }
  }
  return null;
}

// 타깃 단어 5개 — demoWords.ts 와 동일한 단어 사용
const TARGETS: Array<Omit<DemoOcrWord, 'rect'>> = [
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
  },
  {
    word: 'apple',
    ipa: '/ˈæpəl/',
    meaningSummary: '사과',
    meanings: ['사과', '사과나무'],
    examples: [
      {
        en: 'An <b>apple</b> a day keeps the doctor away.',
        ko: '하루에 사과 하나면 의사가 필요 없다.',
      },
    ],
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
  },
];

export const demoOcrWords: DemoOcrWord[] = TARGETS.map((t) => {
  const rect = findWordRect(t.word);
  if (!rect) {
    throw new Error(`demoOcrWords: target word "${t.word}" not found in pageLines`);
  }
  return { ...t, rect };
});

// 추가 dummy 박스 — 다른 일반 단어 위에도 인식 박스가 보이게 (단, dict 매칭은 안 됨)
// 매칭 박스 우선, 더미는 옅게.
const DUMMY_WORDS = ['Sometimes', 'glance', 'notes', 'evening', 'truth'];

export const ocrAllBoxes: OcrBoxRect[] = [
  ...demoOcrWords.map((w) => w.rect),
  ...DUMMY_WORDS.map((w) => findWordRect(w)).filter((r): r is OcrBoxRect => r !== null),
];

export const ocrMatchedBoxCount = demoOcrWords.length;
