export function linspace(start: number, stop: number, n: number): number[] {
  if (n < 2) return [start];
  const step = (stop - start) / (n - 1);
  return Array.from({ length: n }, (_, i) => start + i * step);
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
