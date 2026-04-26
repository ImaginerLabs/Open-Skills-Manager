import { Skeleton } from '../../ui';

interface SkillListSkeletonProps {
  count?: number;
}

export function SkillListSkeleton({ count = 6 }: SkillListSkeletonProps): React.ReactElement {
  return (
    <div className="skill-list-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skill-list-skeleton__card">
          <Skeleton variant="rect" height={120} />
          <div className="skill-list-skeleton__content">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
