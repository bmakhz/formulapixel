import { ReactNode } from 'react';
import { Pressable, Text } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  onPress?: () => void;
  className?: string;
  textClassName?: string;
  disabled?: boolean;
};

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-500 border-emerald-400',
  secondary: 'bg-zinc-800 border-zinc-700',
  ghost: 'bg-transparent border-zinc-700',
  destructive: 'bg-red-500 border-red-400',
};

const TEXT_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'text-black',
  secondary: 'text-zinc-100',
  ghost: 'text-zinc-200',
  destructive: 'text-black',
};

export function Button({
  children,
  variant = 'primary',
  onPress,
  className = '',
  textClassName = '',
  disabled = false,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`min-h-11 items-center justify-center rounded-xl border px-4 ${BUTTON_VARIANTS[variant]} ${disabled ? 'opacity-50' : 'active:opacity-90'} ${className}`}
    >
      <Text className={`font-semibold ${TEXT_VARIANTS[variant]} ${textClassName}`}>{children}</Text>
    </Pressable>
  );
}
