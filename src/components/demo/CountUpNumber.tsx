import { useEffect, useRef, useState } from 'react';

interface Props {
  value: string;
  durationMs?: number;
}

function parseValue(raw: string): { target: number; suffix: string } {
  const match = raw.match(/^([\d,]+)(.*)$/);
  if (!match) return { target: 0, suffix: raw };
  const target = parseInt(match[1].replace(/,/g, ''), 10);
  const suffix = match[2] ?? '';
  if (Number.isNaN(target)) return { target: 0, suffix: raw };
  return { target, suffix };
}

export default function CountUpNumber({ value, durationMs = 1500 }: Props) {
  const { target, suffix } = parseValue(value);
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setShown(target);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const startTs = performance.now();
            let raf = 0;
            const tick = (ts: number) => {
              const t = Math.min(1, (ts - startTs) / durationMs);
              const eased = 1 - Math.pow(1 - t, 3);
              setShown(Math.round(target * eased));
              if (t < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
            observer.disconnect();
            return () => cancelAnimationFrame(raf);
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString('ko-KR')}
      {suffix}
    </span>
  );
}
