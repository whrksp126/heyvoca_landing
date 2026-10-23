// 단어 상태 배지 — 실서비스 당근 농장 작물 그림 + 단계 이름.
// (옛 '미학습/단기암기/중기암기/장기암기' 배지를 대체. 매핑은 data/demoWords.ts memoryStatusMeta)

import { memoryStatusMeta, type MemoryStatus } from '../../data/demoWords';
import { cropImage } from '../../data/crop';

export type { MemoryStatus };

/** 작물 그림 한 장 */
export function CropIcon({ status, size = 16 }: { status: MemoryStatus; size?: number }) {
  const meta = memoryStatusMeta[status];
  return (
    <img
      src={cropImage(meta.crop, { thirsty: meta.thirsty })}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className="shrink-0 select-none object-contain"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

interface MemorizationStatusProps {
  status: MemoryStatus;
  /** 그림만 표시 */
  iconOnly?: boolean;
  /** 라벨 텍스트 강제 지정 */
  forceLabel?: string;
}

export default function MemorizationStatus({ status, iconOnly = false, forceLabel }: MemorizationStatusProps) {
  const meta = memoryStatusMeta[status];
  if (iconOnly) return <CropIcon status={status} size={18} />;
  return (
    <div
      className="flex w-max items-center gap-[3px] rounded-[50px] px-[6px] py-[2px] text-[10px] font-semibold"
      style={{ backgroundColor: meta.bgColor, color: meta.color }}
    >
      <CropIcon status={status} size={14} />
      <span>{forceLabel ?? meta.label}</span>
    </div>
  );
}
