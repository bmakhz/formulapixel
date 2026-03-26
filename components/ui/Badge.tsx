import { ReactNode } from 'react';
import { Text, View } from 'react-native';

type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'ferrari'
  | 'mercedes'
  | 'mclaren'
  | 'redbull'
  | 'astonmartin'
  | 'williams'
  | 'alpine';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  textClassName?: string;
};

const BADGE_VARIANTS: Record<BadgeVariant, { container: string; text: string }> = {
  neutral: {
    container: 'bg-zinc-800 border-zinc-700',
    text: 'text-zinc-200',
  },
  success: {
    container: 'bg-emerald-500/15 border-emerald-500/50',
    text: 'text-emerald-300',
  },
  warning: {
    container: 'bg-amber-500/15 border-amber-500/50',
    text: 'text-amber-300',
  },
  ferrari: {
    container: 'bg-[#ED1131]/20 border-[#ED1131]/60',
    text: 'text-[#FF6B7A]',
  },
  mercedes: {
    container: 'bg-[#00D7B6]/20 border-[#00D7B6]/60',
    text: 'text-[#7FFBE8]',
  },
  mclaren: {
    container: 'bg-[#F47600]/20 border-[#F47600]/60',
    text: 'text-[#FFB26E]',
  },
  redbull: {
    container: 'bg-[#3671C6]/20 border-[#3671C6]/60',
    text: 'text-[#87B4F6]',
  },
  astonmartin: {
    container: 'bg-[#229971]/20 border-[#229971]/60',
    text: 'text-[#74E0BC]',
  },
  williams: {
    container: 'bg-[#1868DB]/20 border-[#1868DB]/60',
    text: 'text-[#7CB0FF]',
  },
  alpine: {
    container: 'bg-[#00A1E8]/20 border-[#00A1E8]/60',
    text: 'text-[#7FDBFF]',
  },
};

export function Badge({ children, variant = 'neutral', className = '', textClassName = '' }: BadgeProps) {
  const variantStyle = BADGE_VARIANTS[variant];

  return (
    <View className={`rounded-full border px-3 py-1 ${variantStyle.container} ${className}`}>
      <Text className={`text-xs font-semibold uppercase tracking-wide ${variantStyle.text} ${textClassName}`}>
        {children}
      </Text>
    </View>
  );
}
