import { useCallback, useEffect, useRef, useState } from 'react';
import { Play } from '@phosphor-icons/react';

// 실제 앱 녹화 영상(public/videos/*.mp4, 720×1560, 무음, 자막 내장)을
// 휴대폰 틀 안에서 자동 반복 재생한다.
// - 화면에 보일 때만 재생(IntersectionObserver), 벗어나면 멈춤
// - 탭 전환 시 해당 영상을 처음부터
// - prefers-reduced-motion 이면 자동재생 대신 포스터 + 재생 버튼

export interface ShowcaseClip {
  id: string;
  label: string;
  caption: string;
  src: string;
  poster: string;
}

interface Props {
  clips: ShowcaseClip[];
  ariaLabel: string;
}

export default function AppVideoShowcase({ clips, ariaLabel }: Props) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [manualPlay, setManualPlay] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setInView(entry.isIntersecting);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shouldPlay = inView && (!reduced || manualPlay);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (shouldPlay) {
      const p = v.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } else {
      v.pause();
    }
  }, [shouldPlay, active]);

  const select = useCallback(
    (i: number) => {
      if (i === active) {
        const v = videoRef.current;
        if (v) v.currentTime = 0;
        return;
      }
      setActive(i);
      // 모션 축소 사용자는 탭을 바꾸면 다시 포스터 상태로
      if (reduced) setManualPlay(false);
    },
    [active, reduced],
  );

  const clip = clips[active];

  return (
    <div ref={wrapRef} className="mx-auto flex w-full max-w-[360px] flex-col items-center">
      <div role="tablist" aria-label={ariaLabel} className="flex w-full flex-wrap justify-center gap-2">
        {clips.map((c, i) => {
          const selected = i === active;
          return (
            <button
              key={c.id}
              type="button"
              role="tab"
              id={`tab-${c.id}`}
              aria-selected={selected}
              aria-controls={`panel-${c.id}`}
              onClick={() => select(i)}
              className={
                'rounded-full border px-4 py-2 text-body-sm font-semibold transition-colors duration-200 focus-visible:shadow-ring ' +
                (selected
                  ? 'border-ink bg-ink text-white'
                  : 'border-hairline bg-white text-sub hover:border-ink hover:text-ink')
              }
            >
              {c.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${clip.id}`}
        aria-labelledby={`tab-${clip.id}`}
        className="mt-6 w-[260px] sm:w-[280px] md:w-[300px]"
      >
        <div className="rounded-[44px] bg-ink p-[6px] shadow-card">
          <div className="relative aspect-[720/1560] overflow-hidden rounded-[38px] bg-[#F5F5F5]">
            <video
              key={clip.id}
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              src={clip.src}
              poster={clip.poster}
              muted
              playsInline
              loop
              preload="none"
              aria-label={clip.caption}
            />
            {reduced && !manualPlay && (
              <button
                type="button"
                onClick={() => setManualPlay(true)}
                className="absolute inset-0 flex items-center justify-center bg-ink/10 focus-visible:shadow-ring"
                aria-label={`${clip.label} 영상 재생`}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-primary-500 shadow-card">
                  <Play size={28} weight="fill" />
                </span>
              </button>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-body-sm text-sub text-pretty">{clip.caption}</p>
      </div>
    </div>
  );
}
