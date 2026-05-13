// 5단계 암기상태 타입 (heyvoca_front MemorizationStatus.jsx 출처)
// unlearned: 미학습  / leaf: 단기암기 / plant: 중기암기 / carrot: 장기암기 / overdue: 복습 지연
export type MemoryStatus = 'unlearned' | 'leaf' | 'plant' | 'carrot' | 'overdue';

export interface DemoWord {
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

export const demoWords: DemoWord[] = [
  {
    word: 'apple',
    ipa: '/ˈæpəl/',
    pos: 'n.',
    meanings: ['사과', '사과나무'],
    example: {
      en: 'An apple a day keeps the doctor away.',
      ko: '하루에 사과 하나면 의사가 필요 없다.',
    },
    badge: { tone: 'new', label: '미학습' },
    status: 'unlearned',
    interval: 0,
    repetition: 0,
  },
  {
    word: 'serendipity',
    ipa: '/ˌserənˈdɪpəti/',
    pos: 'n.',
    meanings: ['뜻밖의 행운', '우연한 발견'],
    example: {
      en: 'A series of serendipities led to her career.',
      ko: '연속된 우연이 그녀의 커리어로 이어졌다.',
    },
    badge: { tone: 'review', label: '단기암기' },
    status: 'leaf',
    interval: 3,
    repetition: 1,
  },
  {
    word: 'accomplish',
    ipa: '/əˈkɑːmplɪʃ/',
    pos: 'v.',
    meanings: ['성취하다', '완수하다'],
    example: {
      en: 'She accomplished her goal of running a marathon.',
      ko: '그녀는 마라톤을 완주하는 목표를 이뤘다.',
    },
    badge: { tone: 'review', label: '중기암기' },
    status: 'plant',
    interval: 24,
    repetition: 3,
  },
  {
    word: 'mellifluous',
    ipa: '/məˈlɪfluəs/',
    pos: 'a.',
    meanings: ['감미로운', '듣기 좋은'],
    example: {
      en: 'Her mellifluous voice filled the hall.',
      ko: '감미로운 그녀의 목소리가 홀을 채웠다.',
    },
    badge: { tone: 'review', label: '장기암기' },
    status: 'carrot',
    interval: 92,
    repetition: 6,
  },
  {
    word: 'ephemeral',
    ipa: '/ɪˈfemərəl/',
    pos: 'a.',
    meanings: ['덧없는', '순식간의'],
    example: {
      en: 'Beauty is often ephemeral.',
      ko: '아름다움은 종종 덧없다.',
    },
    badge: { tone: 'review', label: '복습 지연' },
    status: 'overdue',
    interval: 18,
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
