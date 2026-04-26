import type { ReactNode, ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Icon only button */
  iconOnly?: boolean;
  /** Button content */
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'medium',
  iconOnly = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    size !== 'medium' && styles[size],
    iconOnly && styles.iconOnly,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
}
