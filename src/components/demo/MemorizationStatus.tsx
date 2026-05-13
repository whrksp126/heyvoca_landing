// 실서비스 heyvoca_front/src/components/common/MemorizationStatus.jsx 의 TSX 포팅 (정적 표시 모드만)
// 5단계: unlearned / leaf / plant / carrot + overdue 오버라이드
// 색상·아이콘·텍스트 모두 실서비스와 동일

import { Leaf, Plant, Carrot, EggCrack } from '@phosphor-icons/react';

export type MemoryStatus = 'unlearned' | 'leaf' | 'plant' | 'carrot' | 'overdue';

interface StatusStyle {
  border: string;
  text: string;
  bg: string;
  icon: React.ReactNode;
}

const baseStyles: Record<Exclude<MemoryStatus, 'overdue'>, StatusStyle> = {
  unlearned: {
    border: '#9D835A',
    text: '#9D835A',
    bg: '#FFFCF3',
    icon: <EggCrack size={10} weight="fill" />,
  },
  leaf: {
    border: '#77CE4F',
    text: '#77CE4F',
    bg: '#F2FFEB',
    icon: <Leaf size={10} weight="fill" />,
  },
  plant: {
    border: '#38CE38',
    text: '#38CE38',
    bg: '#EBFFEE',
    icon: <Plant size={10} weight="fill" />,
  },
  carrot: {
    border: '#F68300',
    text: '#F68300',
    bg: '#FFF8E8',
    icon: <Carrot size={10} weight="fill" />,
  },
};

const overdueOverride = {
  border: '#F26A6A',
  text: '#F26A6A',
  bg: '#FFE9E9',
};

const STATUS_LABELS: Record<MemoryStatus, string> = {
  unlearned: '미학습',
  leaf: '단기암기',
  plant: '중기암기',
  carrot: '장기암기',
  overdue: '복습 지연',
};

interface MemorizationStatusProps {
  status: MemoryStatus;
  /** 아이콘만 표시 (작은 원형 뱃지) */
  iconOnly?: boolean;
  /** 라벨 텍스트 강제 지정 (예: '복습 지연' 동적 변경) */
  forceLabel?: string;
}

export default function MemorizationStatus({ status, iconOnly = false, forceLabel }: MemorizationStatusProps) {
  const isOverdue = status === 'overdue';
  const baseKey: Exclude<MemoryStatus, 'overdue'> = isOverdue ? 'leaf' : status;
  const base = baseStyles[baseKey];

  const styles: StatusStyle = isOverdue
    ? { ...base, ...overdueOverride }
    : base;

  const label = forceLabel ?? STATUS_LABELS[status];

  if (iconOnly) {
    return (
      <div
        className="flex h-[18px] w-[18px] items-center justify-center rounded-full border"
        style={{ borderColor: styles.border, backgroundColor: styles.bg, color: styles.text }}
      >
        {styles.icon}
      </div>
    );
  }

  return (
    <div
      className="flex w-max items-center gap-[3px] rounded-[50px] border px-[5px] py-[3px] text-[10px] font-semibold"
      style={{ borderColor: styles.border, backgroundColor: styles.bg, color: styles.text }}
    >
      {styles.icon}
      <span>{label}</span>
    </div>
  );
}
