import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.scss';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children?: ReactNode;
  /** Disable hover effect */
  staticCard?: boolean;
  /** Compact padding */
  compact?: boolean;
}

export function Card({
  staticCard = false,
  compact = false,
  className,
  children,
  ...props
}: CardProps) {
  const classNames = [
    styles.card,
    staticCard && styles.static,
    compact && styles.compact,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={[styles.title, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </h3>
  );
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children?: ReactNode;
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={[styles.description, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </p>
  );
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={[styles.footer, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
