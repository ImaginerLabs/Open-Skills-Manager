import { useState, useCallback, useEffect } from 'react';

export interface UseSkillListAnimationResult {
  animationKey: number;
  triggerAnimation: () => void;
}

export function useSkillListAnimation(
  dependencies: React.DependencyList = []
): UseSkillListAnimationResult {
  const [animationKey, setAnimationKey] = useState(0);

  const triggerAnimation = useCallback(() => {
    setAnimationKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    triggerAnimation();
    // Dependencies are intentionally dynamic to allow re-triggering animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    animationKey,
    triggerAnimation,
  };
}

export function getAnimationDelay(index: number): number {
  return Math.min(index * 30, 300);
}
