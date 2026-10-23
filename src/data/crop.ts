// 당근 농장 작물 — 실서비스 heyvoca_front 와 같은 단계·이름·색·XP 문턱.
//   단계/이름: utils/crop.js (CROP_STAGES, CROP_LABEL)
//   색:       utils/crop.js CROP_COLOR (seed #9D835A / sprout #77CE4F / leaf #38CE38 / carrot #F68300 / golden #F2B713)
//   XP 문턱:  utils/cropXp.js — 성장 문턱 일수(STABILITY_*_DAYS) × 10
//             씨앗 0 / 새싹 50 / 이파리 210 / 당근 600 / 황금 당근 1800
// 그림: heyvoca_front/src/assets/images/farm/crops/** 를 webp 로 옮긴 것(public/images/crops/).

export type Crop = 'seed' | 'sprout' | 'leaf' | 'carrot' | 'golden';

export const CROP_STAGES: Crop[] = ['seed', 'sprout', 'leaf', 'carrot', 'golden'];

export const CROP_LABEL: Record<Crop, string> = {
  seed: '씨앗',
  sprout: '새싹',
  leaf: '이파리',
  carrot: '당근',
  golden: '황금 당근',
};

export const CROP_COLOR: Record<Crop, string> = {
  seed: '#9D835A',
  sprout: '#77CE4F',
  leaf: '#38CE38',
  carrot: '#F68300',
  golden: '#F2B713',
};

export const CROP_XP: Record<Crop, number> = {
  seed: 0,
  sprout: 50,
  leaf: 210,
  carrot: 600,
  golden: 1800,
};

/** 다음 단계 — 황금 당근은 끝 */
export function nextCrop(crop: Crop): Crop | null {
  const i = CROP_STAGES.indexOf(crop);
  return i >= 0 && i < CROP_STAGES.length - 1 ? CROP_STAGES[i + 1] : null;
}

/** XP → 단계 */
export function cropFromXp(xp: number): Crop {
  let out: Crop = 'seed';
  for (const c of CROP_STAGES) if (xp >= CROP_XP[c]) out = c;
  return out;
}

/** 작물 그림.
 *  placement 'unplanted' = 뽑아낸 판(목록·칩용, 씨앗은 씨앗 봉투), 'planted' = 밭에서 자라는 판.
 *  thirsty = 복습할 때가 지나 목마른 작물(실서비스 drying 판). */
export function cropImage(crop: Crop, opts: { planted?: boolean; thirsty?: boolean } = {}): string {
  if (crop === 'golden') return '/images/crops/golden.webp';
  if (opts.planted && !opts.thirsty) return `/images/crops/planted-healthy-${crop}.webp`;
  return `/images/crops/unplanted-${opts.thirsty ? 'drying' : 'healthy'}-${crop}.webp`;
}
