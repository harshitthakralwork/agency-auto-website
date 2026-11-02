export function shouldReduceMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function applyAccessibleStaticState(element: HTMLElement) {
  element.style.opacity = "1";
  element.style.transform = "none";
  element.style.visibility = "visible";
}
