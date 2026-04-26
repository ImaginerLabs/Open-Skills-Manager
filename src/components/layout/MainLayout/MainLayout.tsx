import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Globe, FolderOpen, Gear, MagnifyingGlass, Cloud } from '@phosphor-icons/react';
import styles from './MainLayout.module.scss';
import { Input } from '../../ui';

export interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps): React.ReactElement {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <BookOpen size={24} weight="fill" />
            <span>Skills Manager</span>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Library</div>
            <NavLink to="/library" className={({ isActive }) => [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')}>
              <BookOpen size={18} />
              <span>App Library</span>
            </NavLink>
          </div>
          <div className={styles.navSection}>
            <div className={styles.navSectionTitle}>Scopes</div>
            <NavLink to="/global" className={({ isActive }) => [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')}>
              <Globe size={18} />
              <span>Global Skills</span>
            </NavLink>
            <NavLink to="/projects" className={({ isActive }) => [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')}>
              <FolderOpen size={18} />
              <span>Projects</span>
            </NavLink>
          </div>
          <div className={styles.navSection}>
            <NavLink to="/settings" className={({ isActive }) => [styles.navItem, isActive && styles.active].filter(Boolean).join(' ')}>
              <Gear size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>
      </aside>
      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.searchWrapper}>
            <Input placeholder="Search skills..." icon={<MagnifyingGlass size={16} />} />
          </div>
          <div className={styles.topBarActions}>
            <Cloud size={20} weight="fill" className={styles.navItem} />
          </div>
        </header>
        <div className={styles.content}>{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
