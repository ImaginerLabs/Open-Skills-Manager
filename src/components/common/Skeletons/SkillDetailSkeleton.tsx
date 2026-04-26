import { Skeleton } from '../../ui';

export function SkillDetailSkeleton(): React.ReactElement {
  return (
    <div className="skill-detail-skeleton">
      <div className="skill-detail-skeleton__header">
        <Skeleton variant="circle" width={64} height={64} />
        <div className="skill-detail-skeleton__title">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
      <div className="skill-detail-skeleton__content">
        <Skeleton variant="rect" height={200} />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
}
