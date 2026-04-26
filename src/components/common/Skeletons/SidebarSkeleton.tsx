import { Skeleton } from '../../ui';

export function SidebarSkeleton(): React.ReactElement {
  return (
    <div className="sidebar-skeleton">
      <Skeleton variant="text" width="60%" height={24} />
      <div className="sidebar-skeleton__items">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="rect" height={32} />
        ))}
      </div>
    </div>
  );
}
