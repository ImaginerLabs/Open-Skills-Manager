import type { CSSProperties, HTMLAttributes } from 'react';
import styles from './Skeleton.module.scss';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: 'text' | 'circle' | 'rect';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  const styleOverride: CSSProperties = {
    width: width ?? (variant === 'circle' ? height : undefined),
    height: height ?? (variant === 'text' ? '1em' : undefined),
    ...style,
  };

  return (
    <div
      className={[styles.skeleton, styles[variant], className].filter(Boolean).join(' ')}
      style={styleOverride}
      {...props}
    />
  );
}
