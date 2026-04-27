import type { SkillListLayoutProps } from './types';
import styles from './SkillList.module.scss';

export function SkillListLayout({ children, className }: SkillListLayoutProps): React.ReactElement {
  return <div className={[styles.layout, className].filter(Boolean).join(' ')}>{children}</div>;
}
