// 작물 성장 데모 — 한 단어가 XP 를 쌓으며 씨앗 → 새싹 → 이파리 → 당근 → 황금 당근으로 자란다.
// 실서비스 단어 상세 GrowthPath(작물 아래 문턱 숫자, 현재 XP) · FarmStatusBar("90 / 210 XP") 를 재현.
// 문턱은 data/crop.ts (실서비스 utils/cropXp.js 와 같은 값). 스크롤 진행도에 따라 XP 가 오른다.

import { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Drop } from '@phosphor-icons/react';
import { CROP_STAGES, CROP_LABEL, CROP_COLOR, CROP_XP, cropFromXp, nextCrop, cropImage } from '../../data/crop';

const DEMO_WORD = { word: 'school', meaning: '학교' };

// 스크롤 0~1 → XP. 단계마다 같은 스크롤 구간을 쓰도록 문턱 사이를 선형 보간한다.
function xpAt(p: number): number {
  const seg = Math.min(0.999, Math.max(0, p)) * CROP_STAGES.length;
  const i = Math.floor(seg);
  const frac = seg - i;
  const from = CROP_XP[CROP_STAGES[i]];
  const nextStage = CROP_STAGES[i + 1];
  if (!nextStage) return from;
  return Math.round(from + (CROP_XP[nextStage] - from) * frac);
}

export default function MemoryEvolutionDemo() {
  const prefersReduced = useReducedMotion();
  const [xp, setXp] = useState(prefersReduced ? 90 : 0);
  const ref = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 35%'] });
  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (prefersReduced) return;
    setXp(xpAt(p));
  });

  const crop = cropFromXp(xp);
  const next = nextCrop(crop);
  const color = CROP_COLOR[crop];
  const floor = CROP_XP[crop];
  const ceil = next ? CROP_XP[next] : floor;
  const ratio = next ? (xp - floor) / (ceil - floor) : 1;
  const stageIdx = CROP_STAGES.indexOf(crop);

  return (
    <div ref={ref} className="card relative overflow-hidden p-6 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-caption font-semibold uppercase tracking-[0.12em] text-mute">작물 성장</p>
        <span className="text-caption text-mute">맞힐수록 XP</span>
      </div>

      {/* 단어 + 작물 */}
      <div className="flex items-center gap-4 rounded-[14px] bg-surface p-4">
        <div className="relative h-[84px] w-[84px] shrink-0">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={crop}
              src={cropImage(crop)}
              alt={`${CROP_LABEL[crop]} 그림`}
              width={84}
              height={84}
              initial={{ scale: 0.6, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </AnimatePresence>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[24px] font-bold leading-tight tracking-tight text-ink">{DEMO_WORD.word}</p>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ color, backgroundColor: `${color}1A` }}
            >
              {CROP_LABEL[crop]}
            </span>
          </div>
          <p className="mt-0.5 text-body-sm text-sub">{DEMO_WORD.meaning}</p>

          {/* XP 게이지 — 실서비스 FarmStatusBar 표기 "90 / 210 XP" */}
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-[12px] font-semibold">
              <span className="tabular-nums" style={{ color: '#FF70D4' }}>
                {xp}
                <span className="text-mute"> / {next ? ceil : floor} XP</span>
              </span>
              <span className="text-mute">{next ? `${CROP_LABEL[next]}까지 ${ceil - xp}` : '다 자랐어요'}</span>
            </div>
            <div className="mt-1.5 h-[6px] w-full overflow-hidden rounded-full bg-hairline">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#FF70D4' }}
                animate={{ width: `${Math.max(4, ratio * 100)}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 성장 경로 — 작물 아래 문턱 XP */}
      <ol className="mt-6 grid grid-cols-5 gap-1">
        {CROP_STAGES.map((c, i) => {
          const reached = i <= stageIdx;
          const active = i === stageIdx;
          return (
            <li key={c} className="flex flex-col items-center text-center">
              <motion.div
                animate={{ scale: active ? 1.12 : 1, opacity: reached ? 1 : 0.35 }}
                transition={{ duration: 0.3 }}
                className="flex h-[52px] w-full items-end justify-center"
              >
                <img
                  src={cropImage(c)}
                  alt=""
                  aria-hidden
                  width={48}
                  height={48}
                  loading="lazy"
                  className={`h-[48px] w-[48px] object-contain ${reached ? '' : 'grayscale'}`}
                />
              </motion.div>
              <p
                className="mt-1.5 whitespace-nowrap text-[11px] font-bold sm:text-[12px]"
                style={{ color: active ? CROP_COLOR[c] : reached ? '#555' : '#B0B0B0' }}
              >
                {CROP_LABEL[c]}
              </p>
              <p className="text-[11px] font-semibold tabular-nums text-mute">{CROP_XP[c]}</p>
            </li>
          );
        })}
      </ol>

      {/* 목마른 작물 — 복습할 때가 지난 단어 */}
      <div className="mt-6 flex items-start gap-3 border-t border-dashed border-hairline pt-5">
        <img
          src={cropImage('leaf', { thirsty: true })}
          alt=""
          aria-hidden
          width={44}
          height={44}
          loading="lazy"
          className="h-[44px] w-[44px] shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-body font-semibold text-ink">
            <Drop size={14} weight="fill" color="#2E90FA" aria-hidden />
            복습할 때가 되면 목말라해요
          </p>
          <p className="mt-0.5 text-body-sm text-sub text-pretty">
            맞히면 물을 준 것처럼 다시 살아나요. 틀려도 XP만 줄 뿐, 지금 단계 아래로는 내려가지 않아요.
          </p>
        </div>
      </div>
    </div>
  );
}
