// 추천 데모용 단어장 데이터
// fitFor / fitForDuration 는 0~1 사이 매치도 점수. 1에 가까울수록 잘 맞음.

export interface DemoVocaBook {
  id: string;
  name: string;
  category: string;
  wordCount: number;
  // 난이도: 1=초급, 2=중급, 3=상급
  level: 1 | 2 | 3;
  // 학습 패턴별 매치도
  fitFor: {
    morning: number; // 아침형
    evening: number; // 저녁형
    weekend: number; // 주말 집중
  };
  // 학습 시간(분)별 매치도
  fitForDuration: {
    5: number;
    15: number;
    30: number;
  };
  // 단어장 표지 이미지 경로 (public/images/)
  coverImage: string;
  // 카드 색상 (5색 팔레트 — UploadExcelNewBottomSheet.jsx 출처)
  color: string;
}

export const demoVocaBooks: DemoVocaBook[] = [
  {
    id: 'toeic-basic',
    name: 'TOEIC 기초 필수',
    category: 'TOEIC',
    wordCount: 540,
    level: 1,
    fitFor: { morning: 0.95, evening: 0.6, weekend: 0.7 },
    fitForDuration: { 5: 0.95, 15: 0.85, 30: 0.6 },
    coverImage: '/images/voca_book_1.png',
    color: '#FF70D4',
  },
  {
    id: 'toeic-advanced',
    name: 'TOEIC 실전 800+',
    category: 'TOEIC',
    wordCount: 1240,
    level: 3,
    fitFor: { morning: 0.7, evening: 0.85, weekend: 0.95 },
    fitForDuration: { 5: 0.4, 15: 0.75, 30: 0.95 },
    coverImage: '/images/voca_book_5.png',
    color: '#CD8DFF',
  },
  {
    id: 'suneung-core',
    name: '수능 핵심 1800',
    category: '수능',
    wordCount: 1800,
    level: 2,
    fitFor: { morning: 0.85, evening: 0.75, weekend: 0.9 },
    fitForDuration: { 5: 0.6, 15: 0.9, 30: 0.85 },
    coverImage: '/images/voca_book_10.png',
    color: '#74D5FF',
  },
  {
    id: 'suneung-deep',
    name: '수능 심화 + EBS',
    category: '수능',
    wordCount: 1450,
    level: 3,
    fitFor: { morning: 0.6, evening: 0.9, weekend: 0.95 },
    fitForDuration: { 5: 0.3, 15: 0.7, 30: 0.95 },
    coverImage: '/images/voca_book_1.png',
    color: '#42F98B',
  },
  {
    id: 'biz-english',
    name: '비즈니스 영어 회화',
    category: '비즈니스',
    wordCount: 820,
    level: 2,
    fitFor: { morning: 0.95, evening: 0.7, weekend: 0.5 },
    fitForDuration: { 5: 0.85, 15: 0.9, 30: 0.7 },
    coverImage: '/images/voca_book_5.png',
    color: '#FFBD3C',
  },
  {
    id: 'daily-talk',
    name: '일상 회화 300',
    category: '회화',
    wordCount: 300,
    level: 1,
    fitFor: { morning: 0.8, evening: 0.95, weekend: 0.6 },
    fitForDuration: { 5: 0.95, 15: 0.7, 30: 0.4 },
    coverImage: '/images/voca_book_10.png',
    color: '#FF70D4',
  },
  {
    id: 'ielts-academic',
    name: 'IELTS Academic',
    category: 'IELTS',
    wordCount: 1100,
    level: 3,
    fitFor: { morning: 0.7, evening: 0.85, weekend: 0.95 },
    fitForDuration: { 5: 0.35, 15: 0.7, 30: 0.95 },
    coverImage: '/images/voca_book_1.png',
    color: '#CD8DFF',
  },
  {
    id: 'reading-news',
    name: '독서·뉴스 어휘',
    category: '독해',
    wordCount: 680,
    level: 2,
    fitFor: { morning: 0.9, evening: 0.6, weekend: 0.85 },
    fitForDuration: { 5: 0.55, 15: 0.95, 30: 0.85 },
    coverImage: '/images/voca_book_5.png',
    color: '#74D5FF',
  },
];

// 매치도 계산 함수 — TestRecommendDemo에서 사용
export function scoreVocaBook(
  book: DemoVocaBook,
  userLevel: 1 | 2 | 3,
  pattern: 'morning' | 'evening' | 'weekend',
  duration: 5 | 15 | 30,
): number {
  // 난이도 거리 (0~1)
  const levelDist = Math.abs(book.level - userLevel) / 2;
  const levelScore = 1 - levelDist; // 같은 난이도면 1, 두 단계 떨어지면 0
  const patternScore = book.fitFor[pattern];
  const durationScore = book.fitForDuration[duration];
  // 가중 평균: 난이도 0.4 + 패턴 0.3 + 시간 0.3
  return levelScore * 0.4 + patternScore * 0.3 + durationScore * 0.3;
}
