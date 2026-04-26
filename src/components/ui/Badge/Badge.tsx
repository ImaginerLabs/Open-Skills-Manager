import type { HTMLAttributes } from 'react';
import styles from './Badge.module.scss';

export type TrustLevel = 'official' | 'verified' | 'community' | 'unverified';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Trust level variant */
  level?: TrustLevel;
  /** Badge size */
  size?: 'small' | 'medium' | 'large';
}

export function Badge({
  level = 'community',
  size = 'medium',
  className,
  children,
  ...props
}: BadgeProps) {
  const classNames = [styles.badge, styles[level], size !== 'medium' && styles[size], className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  );
}
