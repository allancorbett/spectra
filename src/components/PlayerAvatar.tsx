'use client';

import { PLAYER_COLORS } from '@/lib/types';

interface PlayerAvatarProps {
  name: string;
  colorIndex: number;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export default function PlayerAvatar({ name, colorIndex, size = 'md' }: PlayerAvatarProps) {
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-bold`}
      style={{ backgroundColor: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length] }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
