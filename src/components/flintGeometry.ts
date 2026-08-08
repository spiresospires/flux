// ─── Flint icon geometry ──────────────────────────────────────────────────────
// Single source of truth for the Flint mark's 3D geometry, size tiers and
// projection maths.
//
// This module exists to be imported by BOTH the renderer (FlintIcon.tsx) and the
// containment check (flintGeometry.test.ts), so the geometry has exactly one
// definition. An earlier PowerShell validator kept a second copy of the node
// table; that would drift the moment anyone edited the component, and the
// validator would then happily pass while checking geometry that is no longer
// rendered. A check that can silently validate the wrong thing is worse than
// no check.
//
// Verified by mutation: widening a node's `d` fails 12 containment assertions,
// and the tests were confirmed to go red before being trusted.

export const CX = 60;
export const CY = 60;
export const R_HEX = 52;
export const CAM = 170;              // camera distance; smaller = stronger perspective
export const DEG = Math.PI / 180;

export const CENTRE = '#0461BA';
// Must equal CENTRE. A node in front of the centre has its spoke drawn AFTER the
// central node (that is what the depth sort does), so a contrasting spoke colour
// paints a visible stripe across the central node's face and it looks transparent.
export const SPOKE = CENTRE;

export type Node3D = { phi: number; psi: number; d: number; r: number; c: string };

// phi = azimuth, psi = elevation, d = distance from centre.
// Tier subsets index into this array, so the ORDER IS LOAD-BEARING.
export const NODES: Node3D[] = [
  { phi: 0, psi: 28, d: 30, r: 6.5, c: '#5BA0E8' },
  { phi: 45, psi: -15, d: 26, r: 5.0, c: '#2F6FD0' },
  { phi: 95, psi: 35, d: 28, r: 6.0, c: '#7FC4EE' },
  { phi: 140, psi: -30, d: 31, r: 7.0, c: '#3B2FC9' },
  { phi: 170, psi: -45, d: 27, r: 3.5, c: '#5BA0E8' },
  { phi: 185, psi: 10, d: 24, r: 4.5, c: '#1E3A8A' },
  { phi: 230, psi: -40, d: 27, r: 5.5, c: '#2F6FD0' },
  { phi: 275, psi: 22, d: 30, r: 7.0, c: '#5BA0E8' },
  { phi: 320, psi: -8, d: 22, r: 4.0, c: '#0461BA' },
];

export interface FlintTier {
  maxSize: number;
  stroke: number;
  corner: number;
  spoke: number;
  scale: number;
  spread: number;
  centre: number;
  subset: number[];
}

// Optical sizing. Flint ships at 14px (ProjectMapView, inline), 20px (LeftRail)
// and 88px (Chat hero). Nine nodes rasterise to an indistinct smudge below ~24px,
// so small sizes draw a subset — larger nodes, thicker spokes, pulled inward.
//
// `spread` is not decoration: small sizes squeeze containment from both ends at
// once, because a thicker frame stroke pulls the inner edge inward while larger
// nodes push reach outward. Without it the 14px tier overflows the frame by 1.45.
export const FLINT_TIERS: FlintTier[] = [
  { maxSize: 15, stroke: 11.0, corner: 6.5, spoke: 5.5, scale: 1.30, spread: 0.86, centre: 7.9, subset: [0, 3, 7] },
  { maxSize: 24, stroke: 9.25, corner: 8.0, spoke: 4.5, scale: 1.18, spread: 0.92, centre: 7.3, subset: [0, 2, 3, 6, 7] },
  { maxSize: 9999, stroke: 6.75, corner: 9.5, spoke: 3.0, scale: 1.00, spread: 1.00, centre: 6.25, subset: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
];

/** isActive thickens the frame, which moves the inner edge INWARD — so the
 *  active state is the tighter case for containment and must be checked too. */
export const ACTIVE_STROKE_MULT = 1.12;
export const ACTIVE_CENTRE_MULT = 1.06;

export function flintTier(size: number, isActive: boolean): FlintTier {
  const t = FLINT_TIERS.find(x => size <= x.maxSize) ?? FLINT_TIERS[FLINT_TIERS.length - 1];
  return isActive
    ? { ...t, stroke: t.stroke * ACTIVE_STROKE_MULT, centre: t.centre * ACTIVE_CENTRE_MULT }
    : t;
}

/**
 * Rotate a node about the VERTICAL axis and project it.
 *
 * Rotation about Y is cheap because elevation never changes:
 *   rho = d·cos(psi)   horizontal orbit radius
 *   y   = d·sin(psi)   constant — Y rotation cannot alter height
 * A CSS `transform: rotateY()` cannot substitute for this: SVG children get no
 * per-element 3D perspective, so it just squashes the network horizontally.
 */
export function project(n: Node3D, spread: number, theta: number) {
  const d = n.d * spread;
  const rho = d * Math.cos(n.psi * DEG);
  const a = (n.phi + theta) * DEG;
  const z = rho * Math.sin(a);
  const s = CAM / (CAM - z);
  return {
    x: CX + rho * Math.cos(a) * s,
    y: CY - d * Math.sin(n.psi * DEG) * s,   // SVG y grows downward, so negate
    s,
    z,
  };
}

/** Rounded regular hexagon, point-top: each vertex cut back by `rc` along both
 *  edges and rejoined with a quadratic through the original vertex. */
export function roundedHex(radius: number, rc: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
    return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)] as const;
  });
  const unit = (from: readonly number[], to: readonly number[]) => {
    const dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy);
    return [dx / L, dy / L] as const;
  };
  let d = '';
  for (let i = 0; i < 6; i++) {
    const cur = pts[i], prev = pts[(i + 5) % 6], next = pts[(i + 1) % 6];
    const u1 = unit(cur, prev), u2 = unit(cur, next);
    d += `${i === 0 ? 'M' : 'L'}${(cur[0] + u1[0] * rc).toFixed(2)},${(cur[1] + u1[1] * rc).toFixed(2)}`
      + `Q${cur[0].toFixed(2)},${cur[1].toFixed(2)} `
      + `${(cur[0] + u2[0] * rc).toFixed(2)},${(cur[1] + u2[1] * rc).toFixed(2)}`;
  }
  return `${d}Z`;
}

/**
 * Worst-case distance from the frame centre reached by any drawn node, sampled
 * over a full turn, versus the frame's inner stroke edge.
 *
 * Perspective makes nodes SWELL as they swing toward the camera, so peak reach
 * sits just PAST the horizontal extreme (where z=0, scale=1), not at it — at the
 * hero tier the worst angle is 235°, nowhere near the widest point. This is why
 * containment cannot be eyeballed or reasoned about from the resting pose.
 */
export function tierClearance(tier: FlintTier) {
  const inradius = R_HEX * Math.cos(30 * DEG);
  const innerEdge = inradius - tier.stroke / 2;

  let maxReach = tier.centre;      // the centre disc must fit too
  let worstNode = -1;
  let worstAngle = 0;

  for (const idx of tier.subset) {
    const n = NODES[idx];
    for (let deg = 0; deg < 360; deg++) {
      const p = project(n, tier.spread, deg);
      const reach = Math.hypot(p.x - CX, p.y - CY) + n.r * tier.scale * p.s;
      if (reach > maxReach) {
        maxReach = reach;
        worstNode = idx;
        worstAngle = deg;
      }
    }
  }
  return { innerEdge, maxReach, clearance: innerEdge - maxReach, worstNode, worstAngle };
}
