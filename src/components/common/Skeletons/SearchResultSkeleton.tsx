import { Skeleton } from '../../ui';

interface SearchResultSkeletonProps {
  count?: number;
}

export function SearchResultSkeleton({ count = 3 }: SearchResultSkeletonProps): React.ReactElement {
  return (
    <div className="search-result-skeleton">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="search-result-skeleton__item">
          <Skeleton variant="circle" width={40} height={40} />
          <div className="search-result-skeleton__content">
            <Skeleton variant="text" width="50%" />
            <Skeleton variant="text" width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}
