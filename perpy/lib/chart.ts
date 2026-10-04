// Small helpers that turn numbers into SVG path strings.
// The random walk is "seeded", so the same seed always draws the same line.
// That keeps server and browser output identical.

export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// A wiggly line of n+1 points that starts at `a` and ends at `b`.
export function walk(seed: number, n: number, a: number, b: number, vol: number) {
  const r = rng(seed);
  const w = [0];
  for (let i = 1; i <= n; i++) w.push(w[i - 1] + (r() - 0.5) * vol);
  return w.map((x, i) => a + ((b - a) * i) / n + x - (w[n] * i) / n);
}

// Points -> "M0,10L5,12..." scaled to fit a width x height box.
export function toPath(pts: number[], width: number, height: number, padTop = 0, padBottom = 0) {
  const mn = Math.min(...pts);
  const mx = Math.max(...pts);
  const span = mx - mn || 1;
  return pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * width;
      const y = height - padBottom - ((v - mn) / span) * (height - padTop - padBottom);
      return `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join("");
}
