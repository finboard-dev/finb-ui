'use client';

import { cn } from '@/lib/utils';
import { CSSProperties } from 'react';

interface ShimmerProps {
  className?: string;
  style?: CSSProperties;
}

export function Shimmer({ className, style }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-transparent via-muted/60 to-transparent',
        className
      )}
      style={style}
    />
  );
}
