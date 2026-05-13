// 5단계 암기상태 타입 (heyvoca_front MemorizationStatus.jsx 출처)
// unlearned: 미학습  / leaf: 단기암기 / plant: 중기암기 / carrot: 장기암기 / overdue: 복습 지연
export type MemoryStatus = 'unlearned' | 'leaf' | 'plant' | 'carrot' | 'overdue';

export interface DemoWord {
  // heyvoca_dict.voca.id — TTS 등 백엔드 API 호출 시 실서비스와 일관
  id: number;
  word: string;
  ipa: string;
  pos: string;
  meanings: string[];
  example: { en: string; ko: string };
  // 기존 코드 호환용 (badge.tone, badge.label) — 기존 컴포넌트에서 사용 중
  badge: { tone: 'review' | 'new'; label: string };
  // 5단계 상태 (랜딩 데모용)
  status: MemoryStatus;
  // SM2/FSRS 인터벌(일수) — UI 디스플레이용
  interval: number;
  // 복습 반복 횟수
  repetition: number;
}

// 14개 데모 단어 — heyvoca_dict 사전 DB에서 추출 (2026-05-13)
// 발음·뜻·예문이 모두 있는 단어 중 난이도(level) 다양성을 고려해 선정
// 초기 status 분포: unlearned 3 / leaf 3 / plant 3 / carrot 3 / overdue 2
export const demoWords: DemoWord[] = [
  // === unlearned (미학습) 3개 ===
  {
    id: 3799,
    word: 'apple',
    ipa: '/ǽpl/',
    pos: 'n.',
    meanings: ['사과', '사과나무'],
    example: {
      en: 'She picked a red apple from the tree.',
      ko: '그녀는 나무에서 빨간 사과를 땄다.',
    },
    badge: { tone: 'new', label: '미학습' },
    status: 'unlearned',
    interval: 0,
    repetition: 0,
  },
  {
    id: 12372,
    word: 'aspiration',
    ipa: '/ӕspəréiʃən/',
    pos: 'n.',
    meanings: ['열망', '포부'],
    example: {
      en: 'Her aspiration for fame drove her career.',
      ko: '명예에 대한 그녀의 열망이 경력을 이끌었다.',
    },
    badge: { tone: 'new', label: '미학습' },
    status: 'unlearned',
    interval: 0,
    repetition: 0,
  },
  {
    id: 9489,
    word: 'ubiquitous',
    ipa: '/juːbíkwətəs/',
    pos: 'a.',
    meanings: ['어디에나 있는', '만연한'],
    example: {
      en: 'Plastic waste is ubiquitous in the ocean.',
      ko: '플라스틱 쓰레기는 바다에 어디에나 존재한다.',
    },
    badge: { tone: 'new', label: '미학습' },
    status: 'unlearned',
    interval: 0,
    repetition: 0,
  },

  // === leaf (단기암기) 3개 ===
  {
    id: 8912,
    word: 'resilient',
    ipa: '/rizíljənt/',
    pos: 'a.',
    meanings: ['탄력 있는', '회복력 있는'],
    example: {
      en: 'Rubber is more resilient than wood.',
      ko: '고무는 나무보다 탄력이 크다.',
    },
    badge: { tone: 'review', label: '단기암기' },
    status: 'leaf',
    interval: 3,
    repetition: 1,
  },
  {
    id: 6985,
    word: 'accomplish',
    ipa: '/əkάmpliʃ/',
    pos: 'v.',
    meanings: ['성취하다', '달성하다'],
    example: {
      en: 'She accomplished her goal within a year.',
      ko: '그녀는 1년 안에 목표를 달성했다.',
    },
    badge: { tone: 'review', label: '단기암기' },
    status: 'leaf',
    interval: 5,
    repetition: 2,
  },
  {
    id: 11435,
    word: 'serendipity',
    ipa: '/sèrəndípəti/',
    pos: 'n.',
    meanings: ['행운', '뜻밖의 발견'],
    example: {
      en: 'Their meeting was a result of pure serendipity.',
      ko: '그들의 만남은 순전한 우연한 행운의 결과였다.',
    },
    badge: { tone: 'review', label: '단기암기' },
    status: 'leaf',
    interval: 7,
    repetition: 2,
  },

  // === plant (중기암기) 3개 ===
  {
    id: 486,
    word: 'dedicate',
    ipa: '/dédikèit/',
    pos: 'v.',
    meanings: ['헌신하다', '바치다'],
    example: {
      en: 'They dedicated a memorial to the fallen soldiers.',
      ko: '그들은 전사한 병사들을 위해 기념비를 헌납했다.',
    },
    badge: { tone: 'review', label: '중기암기' },
    status: 'plant',
    interval: 18,
    repetition: 3,
  },
  {
    id: 11705,
    word: 'endeavor',
    ipa: '/indévər/',
    pos: 'v.',
    meanings: ['애쓰다', '노력'],
    example: {
      en: 'She endeavored to answer every question.',
      ko: '그녀는 모든 문제를 풀려고 노력했다.',
    },
    badge: { tone: 'review', label: '중기암기' },
    status: 'plant',
    interval: 24,
    repetition: 3,
  },
  {
    id: 4231,
    word: 'enthusiasm',
    ipa: '/inθúːziӕzm/',
    pos: 'n.',
    meanings: ['열정', '열광'],
    example: {
      en: 'His enthusiasm for collecting stamps never faded.',
      ko: '우표 수집에 대한 그의 열정은 사그라들지 않았다.',
    },
    badge: { tone: 'review', label: '중기암기' },
    status: 'plant',
    interval: 35,
    repetition: 4,
  },

  // === carrot (장기암기) 3개 ===
  {
    id: 884,
    word: 'book',
    ipa: '/buk/',
    pos: 'n.',
    meanings: ['책', '도서'],
    example: {
      en: 'She gave me a book of poems for my birthday.',
      ko: '그녀는 내 생일에 시 책을 선물해 줬다.',
    },
    badge: { tone: 'review', label: '장기암기' },
    status: 'carrot',
    interval: 92,
    repetition: 6,
  },
  {
    id: 4120,
    word: 'journey',
    ipa: '/dʒə́ːrni/',
    pos: 'n.',
    meanings: ['여정', '여행'],
    example: {
      en: 'They went on a journey to the mountains.',
      ko: '그들은 산으로 여행을 떠났다.',
    },
    badge: { tone: 'review', label: '장기암기' },
    status: 'carrot',
    interval: 86,
    repetition: 5,
  },
  {
    id: 19980,
    word: 'mellifluous',
    ipa: '/melífluəs/',
    pos: 'a.',
    meanings: ['감미로운', '듣기 좋은'],
    example: {
      en: 'Her voice was mellifluous and soothed everyone.',
      ko: '그녀의 목소리는 달콤하고 유려해서 모두를 안심시켰다.',
    },
    badge: { tone: 'review', label: '장기암기' },
    status: 'carrot',
    interval: 120,
    repetition: 7,
  },

  // === overdue (복습 지연) 2개 ===
  {
    id: 13389,
    word: 'ephemeral',
    ipa: '/ifémərəl/',
    pos: 'a.',
    meanings: ['덧없는', '단명한'],
    example: {
      en: 'Ephemeral insects live for only one day.',
      ko: '하루살이 곤충은 단 하루만 산다.',
    },
    badge: { tone: 'review', label: '복습 지연' },
    status: 'overdue',
    interval: 18,
    repetition: 4,
  },
  {
    id: 8740,
    word: 'perseverance',
    ipa: '/pə̀ːrsəvíərəns/',
    pos: 'n.',
    meanings: ['인내', '끈기'],
    example: {
      en: 'She achieved her goal through sheer perseverance.',
      ko: '그녀는 순전한 인내심으로 목표를 달성했다.',
    },
    badge: { tone: 'review', label: '복습 지연' },
    status: 'overdue',
    interval: 22,
    repetition: 4,
  },
];

// 5단계 상태 메타데이터 — 컴포넌트에서 공통으로 사용
export interface MemoryStatusMeta {
  id: MemoryStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  // Phosphor 아이콘 이름 (컴포넌트에서 동적 import)
  iconName: 'EggCrack' | 'Leaf' | 'Plant' | 'Carrot' | 'Warning';
}

export const memoryStatusMeta: Record<MemoryStatus, MemoryStatusMeta> = {
  unlearned: {
    id: 'unlearned',
    label: '미학습',
    description: '아직 만나본 적 없는 단어',
    color: '#9D835A',
    bgColor: '#FFFCF3',
    iconName: 'EggCrack',
  },
  leaf: {
    id: 'leaf',
    label: '단기암기',
    description: '며칠 안에 다시 보면 좋아요',
    color: '#77CE4F',
    bgColor: '#F2FFEB',
    iconName: 'Leaf',
  },
  plant: {
    id: 'plant',
    label: '중기암기',
    description: '한 달 가까이 기억이 유지돼요',
    color: '#38CE38',
    bgColor: '#EBFFEE',
    iconName: 'Plant',
  },
  carrot: {
    id: 'carrot',
    label: '장기암기',
    description: '두 달 이상 단단히 자리잡았어요',
    color: '#F68300',
    bgColor: '#FFF8E8',
    iconName: 'Carrot',
  },
  overdue: {
    id: 'overdue',
    label: '복습 지연',
    description: '예정일이 지났어요',
    color: '#F26A6A',
    bgColor: '#FFE9E9',
    iconName: 'Warning',
  },
};

// 상태별 라벨 (간단 조회용)
export const memoryStatusOrder: MemoryStatus[] = [
  'unlearned',
  'leaf',
  'plant',
  'carrot',
];

// 정답(완벽) 시 다음 상태
export function nextStatusOnGood(status: MemoryStatus): MemoryStatus {
  if (status === 'overdue') return 'leaf'; // overdue는 복귀 시 leaf
  const idx = memoryStatusOrder.indexOf(status);
  if (idx === -1) return status;
  if (idx >= memoryStatusOrder.length - 1) return 'carrot';
  return memoryStatusOrder[idx + 1];
}

// 오답(모르겠음) 시 다음 상태
export function nextStatusOnBad(status: MemoryStatus): MemoryStatus {
  if (status === 'overdue') return 'unlearned'; // overdue에서 모르겠음 → 처음으로
  const idx = memoryStatusOrder.indexOf(status);
  if (idx <= 0) return 'unlearned';
  return memoryStatusOrder[idx - 1];
}
