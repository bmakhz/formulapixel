import { ReactNode } from 'react';
import { View } from 'react-native';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = '' }: CardProps) {
  return (
    <View
      className={
        'rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-lg shadow-black/40 ' + className
      }
    >
      {children}
    </View>
  );
}
