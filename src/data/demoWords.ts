export interface DemoWord {
  word: string;
  ipa: string;
  pos: string;
  meanings: string[];
  example: { en: string; ko: string };
  badge: { label: string; tone: 'new' | 'review' };
}

export const demoWords: DemoWord[] = [
  {
    word: 'serendipity',
    ipa: '/ˌserənˈdɪpəti/',
    pos: 'n.',
    meanings: ['뜻밖의 행운', '우연한 발견'],
    example: {
      en: 'It was pure serendipity that we met that day.',
      ko: '그날 우리가 만난 건 순전히 우연이었다.',
    },
    badge: { label: '처음 보는 단어', tone: 'new' },
  },
  {
    word: 'accomplish',
    ipa: '/əˈkɑːmplɪʃ/',
    pos: 'v.',
    meanings: ['해내다, 성취하다'],
    example: {
      en: 'She finally accomplished her long-term goal.',
      ko: '그녀는 마침내 장기 목표를 달성했다.',
    },
    badge: { label: '다시 만난 단어', tone: 'review' },
  },
  {
    word: 'mellifluous',
    ipa: '/məˈlɪfluəs/',
    pos: 'adj.',
    meanings: ['감미로운 (목소리·소리)'],
    example: {
      en: 'The singer had a mellifluous voice.',
      ko: '그 가수는 감미로운 목소리를 가졌다.',
    },
    badge: { label: '처음 보는 단어', tone: 'new' },
  },
];
