export interface PerformanceBudget {
  maxFrameCacheCapacity: number;
  maxDpr: number;
  mobileQualityScale: number;
  enableHardwareAcceleration: boolean;
}

export const defaultPerformanceBudget: PerformanceBudget = {
  maxFrameCacheCapacity: 40,
  maxDpr: 2,
  mobileQualityScale: 0.75,
  enableHardwareAcceleration: true,
};

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
