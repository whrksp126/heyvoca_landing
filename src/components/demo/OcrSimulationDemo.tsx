import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowsClockwise,
  CaretLeft,
  Image as ImageIcon,
  SpeakerHigh,
  X,
} from '@phosphor-icons/react';
import {
  demoOcrWords,
  ocrAllBoxes,
  ocrMatchedBoxCount,
  pageLines,
  TEXT_RENDER,
} from '../../data/demoOcrWords';

// ─────────────────────────────────────────────────────────────────────────────
// 시퀀스 단계
// 0: 카메라 뷰파인더 (0.0 – 1.6s)
// 1: 셔터 + 플래시 + 캡처 (1.6 – 2.5s)
// 2: 인식 박스 stagger (2.5 – 4.8s)
// 3: 인식된 단어 풀시트 슬라이드 인 (4.8 – 6.0s)
// 4: 첫 단어 자동 zoom + 단어 상세 풀시트 (6.0 – 8.4s)
// 5: 페이드 아웃 (8.4 – 9.4s)
// ─────────────────────────────────────────────────────────────────────────────
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

const STAGE_DURATIONS_MS: Record<Stage, number> = {
  0: 1600,
  1: 900,
  2: 2300,
  3: 1200,
  4: 2400,
  5: 1000,
};

// 책 페이지 viewBox (TEXT_RENDER와 공유)
const PAGE_W = TEXT_RENDER.pageW;
const PAGE_H = TEXT_RENDER.pageH;

// ─────────────────────────────────────────────────────────────────────────────
// 책 페이지 SVG — 실제 인쇄된 영문 책 페이지를 모사
// - serif 폰트 (Georgia)
// - 베이지 종이 톤 + 종이 결 노이즈 (feTurbulence)
// - 본문은 ocrAllBoxes 좌표와 정확히 매칭되는 라인 구성
// - 좌상단/우상단 모서리 살짝 그늘짐
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 책 페이지 SVG — 인쇄된 영문 책 페이지 모사
// - pageLines 와 TEXT_RENDER 를 단일 소스로 사용 → 인식 박스 좌표와 1:1 매칭
// - 모노스페이스 폰트로 글자 advance 균일화 (박스 정렬 정확성 ↑)
// ─────────────────────────────────────────────────────────────────────────────
function BookPageSvg({ className }: { className?: string }) {
  const { lineXStart, lineYStart, lineHeight, fontSize } = TEXT_RENDER;
  return (
    <svg
      viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="paperGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#FAF6EE" />
          <stop offset="50%" stopColor="#F4ECDA" />
          <stop offset="100%" stopColor="#EDE2C9" />
        </linearGradient>
        <filter id="paperNoise" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.30  0 0 0 0.18 0"
          />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id="pageVignette" cx="50%" cy="50%" r="75%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>
      </defs>

      {/* 종이 바닥 */}
      <rect x="0" y="0" width={PAGE_W} height={PAGE_H} fill="url(#paperGrad)" />
      <rect
        x="0"
        y="0"
        width={PAGE_W}
        height={PAGE_H}
        fill="url(#paperGrad)"
        filter="url(#paperNoise)"
        opacity="0.55"
      />

      {/* 챕터 표제 */}
      <text
        x={PAGE_W / 2}
        y="9"
        textAnchor="middle"
        fontSize="2.6"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#8a7544"
        fontWeight="700"
        letterSpacing="0.6"
      >
        CHAPTER ONE
      </text>
      <text
        x={PAGE_W / 2}
        y="14"
        textAnchor="middle"
        fontSize="3.4"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#3a2e1a"
        fontStyle="italic"
        fontWeight="400"
      >
        Small Moments
      </text>
      <line
        x1={PAGE_W / 2 - 10}
        y1="16"
        x2={PAGE_W / 2 + 10}
        y2="16"
        stroke="#8a7544"
        strokeWidth="0.15"
      />

      {/* 본문 — pageLines를 모노스페이스 폰트로 렌더 (박스 좌표와 동기화) */}
      {pageLines.map((line, lineIdx) => (
        <text
          key={lineIdx}
          x={lineXStart}
          y={lineYStart + lineIdx * lineHeight}
          fontSize={fontSize}
          fontFamily="'Courier New', ui-monospace, monospace"
          fill="#2d2418"
          fontWeight="500"
          xmlSpace="preserve"
        >
          {line}
        </text>
      ))}

      {/* 페이지 번호 */}
      <text
        x={PAGE_W / 2}
        y={PAGE_H - 8}
        textAnchor="middle"
        fontSize="2.4"
        fontFamily="Georgia, 'Times New Roman', serif"
        fill="#8a7544"
      >
        — 12 —
      </text>

      <rect x="0" y="0" width={PAGE_W} height={PAGE_H} fill="url(#pageVignette)" />
    </svg>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// iPhone 프레임 — iPhone 15 비율 모사
// - 외곽 rounded-[44px], 내부 rounded-[38px]
// - 다이내믹 아일랜드 / status bar / 가짜 신호·배터리
// ─────────────────────────────────────────────────────────────────────────────
function PhoneFrame({
  children,
  topBarTheme = 'light',
}: {
  children: React.ReactNode;
  // status bar 글자 색 (카메라 화면에선 흰색, 결과 화면에선 어두운 색)
  topBarTheme?: 'light' | 'dark';
}) {
  const textColor = topBarTheme === 'light' ? 'text-white' : 'text-ink';
  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      {/* 사이드 버튼 시각화 (왼쪽 음량 +, -, 우측 전원) */}
      <span
        aria-hidden
        className="absolute left-[-2px] top-[120px] z-[1] h-[44px] w-[3px] rounded-l bg-ink/80"
      />
      <span
        aria-hidden
        className="absolute left-[-2px] top-[180px] z-[1] h-[64px] w-[3px] rounded-l bg-ink/80"
      />
      <span
        aria-hidden
        className="absolute right-[-2px] top-[150px] z-[1] h-[80px] w-[3px] rounded-r bg-ink/80"
      />

      <div className="rounded-[44px] bg-ink p-[6px] shadow-card">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[38px] bg-[#F4ECDA]">
          {/* 다이내믹 아일랜드 */}
          <div className="absolute left-1/2 top-[10px] z-[60] h-[24px] w-[92px] -translate-x-1/2 rounded-full bg-black">
            {/* 카메라 점 */}
            <span
              aria-hidden
              className="absolute right-[8px] top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-[#0b0b0b] ring-1 ring-[#1a1a1a]"
            >
              <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1f3344]" />
            </span>
          </div>

          {/* status bar */}
          <div
            className={`absolute inset-x-0 top-[12px] z-[55] flex items-center justify-between px-[22px] text-[11px] font-semibold ${textColor}`}
          >
            <span className="tracking-tight">9:41</span>
            <div className="flex items-center gap-[5px]">
              {/* 신호 막대 4개 */}
              <span className="flex items-end gap-[1.5px]">
                <span className="block h-[3px] w-[2px] rounded-[1px] bg-current" />
                <span className="block h-[5px] w-[2px] rounded-[1px] bg-current" />
                <span className="block h-[7px] w-[2px] rounded-[1px] bg-current" />
                <span className="block h-[9px] w-[2px] rounded-[1px] bg-current" />
              </span>
              {/* WiFi 아이콘 (단순화) */}
              <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden>
                <path
                  d="M6.5 2.2c1.8 0 3.5.7 4.7 1.9l-1.1 1.1A5 5 0 0 0 6.5 3.8a5 5 0 0 0-3.6 1.4L1.8 4.1A6.6 6.6 0 0 1 6.5 2.2zM6.5 4.8c1 0 2 .4 2.7 1.1l-1 1A2.5 2.5 0 0 0 6.5 6c-.7 0-1.4.3-1.7.9l-1-1A4 4 0 0 1 6.5 4.8zM6.5 7l1.1 1.1L6.5 9.2 5.4 8.1 6.5 7z"
                  fill="currentColor"
                />
              </svg>
              {/* 배터리 */}
              <span className="relative ml-[2px] inline-block h-[10px] w-[20px] rounded-[3px] border border-current">
                <span className="absolute inset-[1px] right-[6px] rounded-[1px] bg-current" />
                <span className="absolute right-[-3px] top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r bg-current" />
              </span>
            </div>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 카메라 뷰파인더 모서리 brackets
// ─────────────────────────────────────────────────────────────────────────────
function CornerBrackets() {
  const len = 'h-[18px] w-[18px]';
  return (
    <>
      <span
        aria-hidden
        className={`absolute left-[24px] top-[80px] ${len} border-l-2 border-t-2 border-white/85`}
      />
      <span
        aria-hidden
        className={`absolute right-[24px] top-[80px] ${len} border-r-2 border-t-2 border-white/85`}
      />
      <span
        aria-hidden
        className={`absolute bottom-[160px] left-[24px] ${len} border-b-2 border-l-2 border-white/85`}
      />
      <span
        aria-hidden
        className={`absolute bottom-[160px] right-[24px] ${len} border-b-2 border-r-2 border-white/85`}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 인식 박스 코너 마크 (각 박스 4 모서리에 ㄴㄱ 모양)
// ─────────────────────────────────────────────────────────────────────────────
function BoxCorners({
  x,
  y,
  width,
  height,
  color,
  thickness = 0.35,
  length = 1.6,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  thickness?: number;
  length?: number;
}) {
  const t = thickness;
  const L = length;
  return (
    <g fill={color}>
      {/* top-left */}
      <rect x={x} y={y} width={L} height={t} />
      <rect x={x} y={y} width={t} height={L} />
      {/* top-right */}
      <rect x={x + width - L} y={y} width={L} height={t} />
      <rect x={x + width - t} y={y} width={t} height={L} />
      {/* bottom-left */}
      <rect x={x} y={y + height - t} width={L} height={t} />
      <rect x={x} y={y + height - L} width={t} height={L} />
      {/* bottom-right */}
      <rect x={x + width - L} y={y + height - t} width={L} height={t} />
      <rect x={x + width - t} y={y + height - L} width={t} height={L} />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function OcrSimulationDemo() {
  const [stage, setStage] = useState<Stage>(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // prefers-reduced-motion
  const reducedMotion = useReducedMotion();

  // 첫 단어 = stage 4에서 상세 풀시트의 메인 단어
  const featuredWord = demoOcrWords[0];

  // 첫 단어의 박스 (zoom 타겟)
  const featuredBoxIdx = 0;
  const featuredBox = ocrAllBoxes[featuredBoxIdx];

  // 뷰포트 감지: 컴포넌트가 뷰포트 안에 있을 때만 재생
  useEffect(() => {
    if (!rootRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => setHasEntered(e.isIntersecting));
      },
      { threshold: 0.3 },
    );
    obs.observe(rootRef.current);
    return () => obs.disconnect();
  }, []);

  // 시퀀스 진행
  useEffect(() => {
    if (!hasEntered || paused) return;
    if (reducedMotion) {
      // reduced motion: stage 3(인식 결과 풀시트가 떠 있는 정지 화면)에서 멈춤
      setStage(3);
      setPaused(true);
      return;
    }
    const dur = STAGE_DURATIONS_MS[stage];
    timerRef.current = window.setTimeout(() => {
      if (stage >= 5) {
        // 한 바퀴 끝 → 일시정지 + 리플레이 버튼 노출
        setLoopCount((c) => c + 1);
        setPaused(true);
        setStage(0);
        return;
      }
      setStage((s) => (s + 1) as Stage);
    }, dur);
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [stage, hasEntered, paused, reducedMotion]);

  const replay = useCallback(() => {
    setStage(0);
    setPaused(false);
  }, []);

  // 책 페이지 줌·팬 트랜스폼 — stage 4에서 첫 단어로 자동 줌인
  const bookTransform = useMemo(() => {
    if (stage < 4) {
      // 평상시 살짝 줌인 (사진 직후 1.03)
      const scale = stage >= 1 ? 1.03 : 1;
      return { scale, x: 0, y: 0 };
    }
    // stage 4: 첫 단어 박스로 zoom (DictionaryOcrResultNewFullSheet의 zoomToElement 모방)
    const targetScale = 1.9;
    // SVG viewBox 좌표 기준 박스 중심
    const cx = featuredBox.x + featuredBox.width / 2;
    const cy = featuredBox.y + featuredBox.height / 2;
    // viewBox 100x140 기준 중앙(50, 70)에서 박스 중심까지의 거리만큼 반대로 이동
    // 컨테이너 폭 기준 픽셀로 환산 (max-w-[340px] - 베젤 12 = ~328, aspect 9/19 → height ~693)
    // viewBox 1 단위 ≈ 컨테이너 폭 / 100 픽셀
    // 화면 픽셀로 변환할 때는 scale 후의 좌표계 기준이라 단순화
    const offsetX = (50 - cx) * (targetScale / 100) * 100;
    const offsetY = (70 - cy) * (targetScale / 100) * 100;
    return { scale: targetScale, x: `${offsetX}%`, y: `${offsetY}%` };
  }, [stage, featuredBox]);

  return (
    <div ref={rootRef} className="space-y-4">
      <PhoneFrame topBarTheme={stage === 0 ? 'light' : 'dark'}>
        {/* ─── 책 페이지 백그라운드 (항상 깔려 있음) ───────────────────── */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{
              scale: bookTransform.scale,
              x: bookTransform.x,
              y: bookTransform.y,
              // stage 0에서는 살짝 어두워서 뷰파인더가 도드라지게
              filter: stage === 0 ? 'brightness(0.78) blur(0.5px)' : 'brightness(1)',
            }}
            transition={{
              type: 'spring',
              stiffness: 90,
              damping: 22,
              mass: 0.9,
            }}
            style={{ transformOrigin: '50% 50%' }}
          >
            {/* stage 0에서는 페이지가 미세하게 흔들림 (손떨림) */}
            <motion.div
              className="absolute inset-0"
              animate={
                stage === 0
                  ? { x: [0, 1.5, -1.2, 0.8, -0.5, 0], y: [0, -0.8, 1.0, -0.4, 0.3, 0] }
                  : { x: 0, y: 0 }
              }
              transition={{
                duration: 3.5,
                repeat: stage === 0 ? Infinity : 0,
                ease: 'easeInOut',
              }}
            >
              <BookPageSvg className="h-full w-full" />
            </motion.div>
          </motion.div>

          {/* 책 위로 살짝 핸드/렌즈 비네팅 */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_55%,transparent_60%,rgba(0,0,0,0.18)_100%)]" />
        </div>

        {/* ─── 카메라 뷰파인더 (stage 0) ───────────────────────────────── */}
        <AnimatePresence>
          {stage === 0 && (
            <motion.div
              key="viewfinder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-20"
            >
              {/* 어두운 letterbox (상/하단) */}
              <div className="absolute inset-x-0 top-0 h-[64px] bg-black/85" />
              <div className="absolute inset-x-0 bottom-0 h-[140px] bg-black/85" />

              {/* 상단 카메라 UI */}
              <div className="absolute inset-x-0 top-[42px] z-30 flex items-center justify-between px-[18px]">
                <button
                  type="button"
                  aria-label="플래시 전환"
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white/10 text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M8 0 1 8h4l-1 6 7-8H7l1-6z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <span className="rounded-full bg-white/10 px-[10px] py-[3px] text-[10px] font-semibold uppercase tracking-wider text-white">
                  단어 인식
                </span>
                <button
                  type="button"
                  aria-label="설정"
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white/10 text-white"
                >
                  <span className="flex gap-[2px]">
                    <span className="h-[3px] w-[3px] rounded-full bg-current" />
                    <span className="h-[3px] w-[3px] rounded-full bg-current" />
                    <span className="h-[3px] w-[3px] rounded-full bg-current" />
                  </span>
                </button>
              </div>

              {/* 3x3 격자 + corner brackets */}
              <svg
                className="absolute inset-x-0 top-[64px] bottom-[140px] z-20"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden
              >
                <line
                  x1="33.3"
                  y1="0"
                  x2="33.3"
                  y2="100"
                  stroke="white"
                  strokeWidth="0.18"
                  strokeOpacity="0.32"
                />
                <line
                  x1="66.6"
                  y1="0"
                  x2="66.6"
                  y2="100"
                  stroke="white"
                  strokeWidth="0.18"
                  strokeOpacity="0.32"
                />
                <line
                  x1="0"
                  y1="33.3"
                  x2="100"
                  y2="33.3"
                  stroke="white"
                  strokeWidth="0.18"
                  strokeOpacity="0.32"
                />
                <line
                  x1="0"
                  y1="66.6"
                  x2="100"
                  y2="66.6"
                  stroke="white"
                  strokeWidth="0.18"
                  strokeOpacity="0.32"
                />
              </svg>
              <CornerBrackets />

              {/* 중앙 포커스 마커 (살짝 펄스) */}
              <motion.div
                className="absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="relative h-[56px] w-[56px] rounded-[8px] border-2 border-amber-300/95">
                  <span className="absolute left-1/2 top-1/2 h-[10px] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-amber-300/95" />
                  <span className="absolute left-1/2 top-1/2 h-[1px] w-[10px] -translate-x-1/2 -translate-y-1/2 bg-amber-300/95" />
                </div>
              </motion.div>

              {/* 안내 텍스트 */}
              <div className="absolute inset-x-0 top-[80px] z-30 flex justify-center">
                <span className="rounded-full bg-black/55 px-[12px] py-[5px] text-[11px] font-semibold text-white backdrop-blur-sm">
                  단어를 비춰주세요
                </span>
              </div>

              {/* 하단 컨트롤: 갤러리 / 셔터 / 전환 */}
              <div className="absolute inset-x-0 bottom-[32px] z-30 flex items-center justify-between px-[28px]">
                {/* 갤러리 썸네일 */}
                <button
                  type="button"
                  aria-label="갤러리"
                  className="h-[38px] w-[38px] overflow-hidden rounded-[8px] border-2 border-white/85"
                >
                  <div className="h-full w-full bg-gradient-to-br from-[#FFB6E1] via-[#FFD3D3] to-[#B3DFFF]" />
                </button>

                {/* 셔터 버튼 */}
                <div className="relative">
                  <motion.div
                    className="h-[68px] w-[68px] rounded-full border-[4px] border-white"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-[6px] rounded-full bg-white" />
                  {/* 셔터 직전 부드러운 ring 확장 */}
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full border-2 border-white/70"
                    animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                </div>

                {/* 전환 버튼 */}
                <button
                  type="button"
                  aria-label="카메라 전환"
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/15 text-white"
                >
                  <ArrowsClockwise size={18} weight="bold" />
                </button>
              </div>

              {/* 하단 모드 셀렉터 */}
              <div className="absolute inset-x-0 bottom-[110px] z-30 flex justify-center gap-[18px] text-[10px] font-semibold uppercase tracking-wider">
                <span className="text-white/55">비디오</span>
                <span className="text-amber-300">사진</span>
                <span className="text-white/55">파노라마</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── 셔터 클릭: 백색 플래시 + 클릭 ripple (stage 1) ─────────── */}
        <AnimatePresence>
          {stage === 1 && (
            <>
              {/* 흰 플래시 (80ms에 빠르게 차오르고 250ms에 빠짐) */}
              <motion.div
                key="flash"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.95, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  times: [0, 0.12, 1],
                  duration: 0.55,
                  ease: 'easeOut',
                }}
                className="pointer-events-none absolute inset-0 z-[70] bg-white"
              />
              {/* 셔터 클릭 시 ripple (중앙 하단에서 퍼짐) */}
              <motion.span
                key="ripple"
                aria-hidden
                className="pointer-events-none absolute left-1/2 bottom-[50px] z-[65] -translate-x-1/2 rounded-full border-2 border-white"
                initial={{ width: 12, height: 12, opacity: 0.8 }}
                animate={{ width: 240, height: 240, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
              {/* 캡처 사운드 시각화: 작은 라벨 */}
              <motion.div
                key="captured"
                className="absolute inset-x-0 top-[80px] z-[65] flex justify-center"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: [0, 1, 1, 0], y: [-6, 0, 0, -6] }}
                transition={{ duration: 0.9, times: [0, 0.25, 0.75, 1] }}
              >
                <span className="rounded-full bg-ink/85 px-[10px] py-[3px] text-[10px] font-semibold text-white backdrop-blur">
                  촬영됨
                </span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── 인식 박스 (stage 2~4) ───────────────────────────────────── */}
        {stage >= 2 && stage <= 4 && (
          <svg
            className="pointer-events-none absolute inset-0 z-10"
            viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            {/* 책 페이지 transform과 동기화하기 위해 SVG도 같이 transform */}
            <motion.g
              initial={false}
              animate={{
                scale: bookTransform.scale,
                x:
                  typeof bookTransform.x === 'string'
                    ? (parseFloat(bookTransform.x) / 100) * PAGE_W
                    : bookTransform.x,
                y:
                  typeof bookTransform.y === 'string'
                    ? (parseFloat(bookTransform.y) / 100) * PAGE_H
                    : bookTransform.y,
              }}
              transition={{ type: 'spring', stiffness: 90, damping: 22, mass: 0.9 }}
              style={{ transformOrigin: `${PAGE_W / 2}px ${PAGE_H / 2}px` }}
            >
              {ocrAllBoxes.map((box, i) => {
                const isMatched = i < ocrMatchedBoxCount;
                const isFeatured = stage === 4 && i === featuredBoxIdx;
                const color = isMatched ? '#FF70D4' : '#FFB6E0';
                return (
                  <motion.g
                    key={i}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: isMatched ? 1 : 0.65,
                      scale: 1,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 22,
                      delay: 0.1 + i * 0.085,
                    }}
                    style={{
                      transformOrigin: `${box.x + box.width / 2}px ${box.y + box.height / 2}px`,
                    }}
                  >
                    {/* 인식 박스 fill (반투명 핑크) */}
                    <rect
                      x={box.x}
                      y={box.y}
                      width={box.width}
                      height={box.height}
                      rx="0.6"
                      fill={color}
                      fillOpacity={isFeatured ? 0.42 : 0.18}
                      stroke={color}
                      strokeWidth={isMatched ? 0.32 : 0.22}
                      strokeOpacity={isMatched ? 1 : 0.7}
                    />
                    {/* 매칭 박스에는 corner mark 추가 */}
                    {isMatched && (
                      <BoxCorners
                        x={box.x}
                        y={box.y}
                        width={box.width}
                        height={box.height}
                        color={color}
                      />
                    )}
                  </motion.g>
                );
              })}
            </motion.g>
          </svg>
        )}

        {/* ─── 인식 박스 등장 시 spark (stage 2 후반) ──────────────────── */}
        <AnimatePresence>
          {stage === 2 && (
            <motion.div
              key="recognizing-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{
                duration: 1.4,
                times: [0, 0.5, 1],
                delay: 1.0,
              }}
              className="pointer-events-none absolute inset-0 z-[15] bg-primary-500/15"
            />
          )}
        </AnimatePresence>

        {/* ─── "단어 인식 중…" 인디케이터 (stage 2 초반) ───────────────── */}
        <AnimatePresence>
          {stage === 2 && (
            <motion.div
              key="indicator"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-x-0 top-[44px] z-[35] flex justify-center"
            >
              <span className="inline-flex items-center gap-[6px] rounded-full bg-ink/90 px-[12px] py-[6px] text-[11px] font-semibold text-white shadow-card backdrop-blur">
                <motion.span
                  className="h-[8px] w-[8px] rounded-full bg-primary-500"
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                />
                단어 인식 중…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── 인식 결과 풀시트 (stage 3, 4 — DictionaryOcrResultNewFullSheet 모사) */}
        <AnimatePresence>
          {(stage === 3 || stage === 4) && (
            <motion.div
              key="result-fullsheet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-[40] flex flex-col bg-white"
            >
              {/* 상단 status bar 영역 spacer */}
              <div className="h-[44px] flex-shrink-0" />

              {/* 페이지 헤더: 좌측 backbutton + 가운데 타이틀 */}
              <div className="relative flex h-[44px] flex-shrink-0 items-center justify-center">
                <button
                  type="button"
                  className="absolute left-[8px] flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-sub"
                  aria-label="뒤로"
                >
                  <CaretLeft size={20} weight="bold" />
                </button>
                <h2 className="text-[15px] font-bold text-ink">단어 선택</h2>
              </div>

              {/* 이미지 프리뷰 영역 (zoom-pan-pinch 모방) */}
              <div className="relative flex-1 overflow-hidden bg-[#F5F5F5]">
                <motion.div
                  className="absolute inset-0"
                  initial={false}
                  animate={{
                    scale: stage === 4 ? 1.9 : 1.6,
                    x:
                      stage === 4
                        ? `${(50 - (featuredBox.x + featuredBox.width / 2)) * 1.9}%`
                        : '0%',
                    y:
                      stage === 4
                        ? `${(50 - (featuredBox.y + featuredBox.height / 2) * (100 / PAGE_H)) * 1.9}%`
                        : '0%',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 110,
                    damping: 24,
                    mass: 0.9,
                  }}
                  style={{ transformOrigin: '50% 50%' }}
                >
                  <BookPageSvg className="h-full w-full" />
                  {/* 이미지 위 하이라이트 박스 (실제 서비스 multiply 핑크 박스) */}
                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden
                  >
                    {ocrAllBoxes.slice(0, ocrMatchedBoxCount).map((box, i) => {
                      const isFeatured = stage === 4 && i === featuredBoxIdx;
                      return (
                        <rect
                          key={i}
                          x={box.x}
                          y={box.y}
                          width={box.width}
                          height={box.height}
                          rx="0.4"
                          fill="#FF70D4"
                          fillOpacity={isFeatured ? 0.6 : 0.42}
                          style={{ mixBlendMode: 'multiply' }}
                        />
                      );
                    })}
                  </svg>
                </motion.div>
              </div>

              {/* 하단 결과 영역 — 실제 서비스 디자인 (핑크 박스 + 리스트) */}
              <div className="flex-shrink-0 space-y-[10px] px-[16px] pb-[18px] pt-[10px]">
                {/* 단어 리스트 박스 — 핑크 배경 (#FFEFFA) */}
                <div className="rounded-[10px] bg-[#FFEFFA] px-[14px] py-[4px]">
                  {demoOcrWords.map((w, i) => {
                    const isHighlighted = stage === 4 && i === 0;
                    return (
                      <motion.div
                        key={w.word}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: stage === 3 ? 0.15 + i * 0.06 : 0,
                          duration: 0.3,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                        className={`flex items-start gap-[10px] border-b border-[#F2D7E5] py-[7px] last:border-b-0 ${
                          isHighlighted ? 'rounded-[6px] bg-white/80 px-[6px]' : ''
                        }`}
                      >
                        <span
                          className={`min-w-[80px] font-mono text-[13px] font-bold ${
                            isHighlighted ? 'text-primary-700' : 'text-ink'
                          }`}
                        >
                          {w.word}
                        </span>
                        <span className="flex-1 truncate text-[12px] leading-[1.5] text-ink">
                          {w.meaningSummary}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 액션 버튼 — stage 3: 재촬영 / stage 4: 다시 선택 + 선택 */}
                {stage === 4 ? (
                  <div className="flex gap-[10px]">
                    <button
                      type="button"
                      className="h-[44px] flex-1 rounded-[10px] bg-[#CCCCCC] text-[14px] font-bold text-white"
                    >
                      다시 선택
                    </button>
                    <button
                      type="button"
                      className="h-[44px] flex-1 rounded-[10px] bg-primary-500 text-[14px] font-bold text-white shadow-card"
                    >
                      선택
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="h-[44px] w-full rounded-[10px] bg-[#CCCCCC] text-[14px] font-bold text-white"
                  >
                    재촬영
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── 단어 상세 바텀시트 (stage 4 — WordDetaileNewBottomSheet 모사) */}
        <AnimatePresence>
          {stage === 4 && (
            <>
              {/* backdrop */}
              <motion.div
                key="detail-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-[45] bg-black/35"
              />
              {/* bottom sheet */}
              <motion.div
                key="detail-sheet"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 280, damping: 32 }}
                className="absolute inset-x-0 bottom-0 z-[50] rounded-t-[28px] bg-white shadow-card"
              >
                {/* drag handle */}
                <div className="flex justify-center pb-[2px] pt-[10px]">
                  <span className="h-[4px] w-[36px] rounded-full bg-hairline" />
                </div>

                {/* 본문 */}
                <div className="px-[20px] pb-[10px] pt-[8px]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-[6px] rounded-full bg-primary-100 px-[10px] py-[3px] text-[10px] font-bold text-primary-700">
                      <span className="h-[6px] w-[6px] rounded-full bg-primary-500" />
                      미학습
                    </span>
                    <button
                      type="button"
                      aria-label="닫기"
                      className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-surface text-sub"
                    >
                      <X size={14} weight="bold" />
                    </button>
                  </div>

                  {/* 단어 + 발음 + 스피커 */}
                  <div className="mt-[10px] flex items-baseline gap-[10px]">
                    <h3 className="font-mono text-[22px] font-bold text-ink">
                      {featuredWord.word}
                    </h3>
                    <button
                      type="button"
                      aria-label="발음 듣기"
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-surface text-sub"
                    >
                      <SpeakerHigh size={14} weight="fill" />
                    </button>
                  </div>
                  <p className="mt-[2px] text-[12px] text-mute">{featuredWord.ipa}</p>

                  {/* 의미 리스트 */}
                  <div className="mt-[12px] space-y-[6px]">
                    {featuredWord.meanings.map((m, i) => (
                      <p
                        key={i}
                        className="border-b border-hairline pb-[6px] text-[14px] leading-[1.5] text-ink last:border-b-0"
                      >
                        <span className="mr-[6px] inline-block min-w-[14px] text-[11px] font-bold text-primary-500">
                          {i + 1}.
                        </span>
                        <span className="text-[11px] font-semibold text-mute">명사) </span>
                        {m}
                      </p>
                    ))}
                  </div>

                  {/* 예문 */}
                  <div className="mt-[10px] rounded-[10px] bg-surface px-[12px] py-[10px]">
                    <p
                      className="text-[13px] leading-[1.5] text-ink"
                      // 단어 강조용 b 태그 dangerously render
                      dangerouslySetInnerHTML={{
                        __html: featuredWord.examples[0].en,
                      }}
                    />
                    <p className="mt-[2px] text-[12px] leading-[1.5] text-sub">
                      {featuredWord.examples[0].ko}
                    </p>
                  </div>
                </div>

                {/* 하단 CTA */}
                <div className="flex gap-[10px] px-[20px] pb-[18px] pt-[8px]">
                  <button
                    type="button"
                    className="h-[44px] flex-1 rounded-[10px] bg-surface text-[14px] font-bold text-sub"
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    className="h-[44px] flex-[1.4] rounded-[10px] bg-primary-500 text-[14px] font-bold text-white shadow-card"
                  >
                    단어장에 추가
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── 페이드 아웃 (stage 5) — 다시 처음으로 ───────────────────── */}
        <AnimatePresence>
          {stage === 5 && (
            <motion.div
              key="fadeout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="pointer-events-none absolute inset-0 z-[80] bg-white"
            />
          )}
        </AnimatePresence>

        {/* ─── 일시정지 시 리플레이 오버레이 ───────────────────────────── */}
        {paused && hasEntered && !reducedMotion && loopCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm"
          >
            <button
              type="button"
              onClick={replay}
              className="inline-flex items-center gap-[8px] rounded-full bg-white px-[18px] py-[10px] text-[13px] font-bold text-ink shadow-card transition hover:scale-105"
            >
              <ArrowsClockwise size={16} weight="bold" />
              다시 보기
            </button>
          </motion.div>
        )}

        {/* ─── reduced motion 안내 (정적 화면) ────────────────────────── */}
        {reducedMotion && (
          <div className="absolute inset-x-3 bottom-[8px] z-[95] rounded-[10px] bg-ink/85 px-[10px] py-[6px] text-center text-[10px] text-white">
            애니메이션 감소 모드 — 정적 결과 화면 표시
          </div>
        )}
      </PhoneFrame>

      <p className="text-center text-caption text-mute">
        책 사진을 찍으면 영단어가 자동으로 인식되고, 한 번에 사전 결과를 받아볼 수 있어요.
        {loopCount > 0 && !paused ? (
          <span className="ml-[4px] inline-flex items-center gap-[3px] text-primary-600">
            <ImageIcon size={11} weight="fill" /> 자동 재생 중
          </span>
        ) : null}
      </p>
    </div>
  );
}
