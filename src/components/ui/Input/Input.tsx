import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.scss';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input label */
  label?: string;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Icon element */
  icon?: ReactNode;
}

export function Input({
  label,
  error = false,
  errorMessage,
  icon,
  className,
  ...props
}: InputProps) {
  const inputClassNames = [
    styles.input,
    error && styles.error,
    icon && styles.withIcon,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.iconWrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input className={inputClassNames} spellCheck={false} autoComplete="off" {...props} />
      </div>
      {errorMessage && <span className={styles.errorMessage}>{errorMessage}</span>}
    </div>
  );
}
