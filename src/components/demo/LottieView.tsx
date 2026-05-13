import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  speed?: number;
  className?: string;
  ariaLabel?: string;
}

export default function LottieView({
  src,
  loop = true,
  autoplay = true,
  speed = 1,
  className,
  ariaLabel = '애니메이션',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let dispose: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!canvasRef.current) return;
      // Probe src existence (avoid console-spamming 404s when the
      // .lottie asset hasn't been added yet).
      try {
        const probe = await fetch(src, { method: 'HEAD', cache: 'force-cache' });
        if (!probe.ok) return;
      } catch {
        return;
      }
      if (cancelled || !canvasRef.current) return;
      try {
        const mod = await import('@lottiefiles/dotlottie-web');
        if (cancelled || !canvasRef.current) return;
        const inst = new mod.DotLottie({
          canvas: canvasRef.current,
          src,
          loop,
          autoplay: autoplay && !reduced,
          speed,
        });
        dispose = () => {
          try {
            inst.destroy();
          } catch {}
        };
      } catch {
        // 실패 시 조용히 폴백
      }
    })();
    return () => {
      cancelled = true;
      if (dispose) dispose();
    };
  }, [src, loop, autoplay, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
