import { describe, it, expect } from 'vitest';
import {
  CAM,
  CX,
  CY,
  DEG,
  CENTRE,
  SPOKE,
  NODES,
  FLINT_TIERS,
  flintTier,
  project,
  roundedHex,
  tierClearance,
} from './flintGeometry';

// These tests replace scripts/validate-flint-containment.ps1, which could never
// run in CI — GitHub and GitLab runners are Linux, and it was PowerShell. It also
// had to re-parse this module's source with regexes to avoid duplicating the node
// table; importing the module directly removes that fragility outright.

const SIZES = { inline: 14, rail: 20, hero: 88 } as const;

describe('flintTier', () => {
  it('drops to a subset at small sizes, because nine nodes smudge below ~24px', () => {
    expect(flintTier(SIZES.inline, false).subset).toHaveLength(3);
    expect(flintTier(SIZES.rail, false).subset).toHaveLength(5);
    expect(flintTier(SIZES.hero, false).subset).toHaveLength(NODES.length);
  });

  it('picks the tier by upper bound, including at the exact boundaries', () => {
    expect(flintTier(15, false).subset).toHaveLength(3);
    expect(flintTier(16, false).subset).toHaveLength(5);
    expect(flintTier(24, false).subset).toHaveLength(5);
    expect(flintTier(25, false).subset).toHaveLength(NODES.length);
  });

  it('every subset index refers to a real node', () => {
    for (const tier of FLINT_TIERS) {
      for (const idx of tier.subset) {
        expect(NODES[idx], `tier ${tier.maxSize} references node ${idx}`).toBeDefined();
      }
    }
  });

  it('thickens the frame and centre when active', () => {
    for (const size of Object.values(SIZES)) {
      const idle = flintTier(size, false);
      const active = flintTier(size, true);
      expect(active.stroke).toBeGreaterThan(idle.stroke);
      expect(active.centre).toBeGreaterThan(idle.centre);
    }
  });

  it('does not mutate the shared tier objects when applying the active multipliers', () => {
    const before = FLINT_TIERS.map(t => ({ stroke: t.stroke, centre: t.centre }));
    flintTier(SIZES.hero, true);
    flintTier(SIZES.rail, true);
    FLINT_TIERS.forEach((t, i) => {
      expect(t.stroke).toBe(before[i].stroke);
      expect(t.centre).toBe(before[i].centre);
    });
  });
});

describe('containment', () => {
  // Perspective makes nodes SWELL toward the camera, so peak reach sits just past
  // the horizontal extreme rather than at it. Small sizes squeeze from both ends
  // at once: a thicker frame stroke pulls the inner edge in while larger nodes
  // push reach out. Neither is visible from the resting pose.
  const cases = Object.entries(SIZES).flatMap(([name, size]) =>
    [false, true].map(isActive => ({ name, size, isActive })),
  );

  it.each(cases)('$name ($size px, active=$isActive) stays inside the frame', ({ size, isActive }) => {
    const { clearance, maxReach, innerEdge } = tierClearance(flintTier(size, isActive));
    expect(
      clearance,
      `reach ${maxReach.toFixed(2)} vs inner edge ${innerEdge.toFixed(2)}`,
    ).toBeGreaterThan(0);
  });

  it.each(cases)('$name ($size px, active=$isActive) keeps a usable margin', ({ size, isActive }) => {
    // Not just "doesn't overflow" — a mark grazing the frame reads as a bug even
    // when it technically fits. 1.5 units is comfortably below the current worst
    // case (2.39) so this fails on regression, not on noise.
    expect(tierClearance(flintTier(size, isActive)).clearance).toBeGreaterThan(1.5);
  });

  it('reports which node and angle is worst, so a failure is diagnosable', () => {
    const result = tierClearance(flintTier(SIZES.hero, false));
    expect(result.worstNode).toBeGreaterThanOrEqual(0);
    expect(result.worstAngle).toBeGreaterThanOrEqual(0);
    expect(result.worstAngle).toBeLessThan(360);
  });
});

describe('rotation is a rigid turn about the vertical axis', () => {
  // Inverting the projection is the only honest way to assert this. Note we do
  // NOT check that screen y holds still — it must not, because perspective scales
  // height as well as width. A node whose cy never moved would mean the
  // projection was ignoring depth entirely.
  it.each(NODES.map((_, i) => i))('node %i keeps its orbit radius and elevation', idx => {
    const n = NODES[idx];
    const expectedRho = n.d * Math.cos(n.psi * DEG);
    const expectedY = n.d * Math.sin(n.psi * DEG);

    for (let theta = 0; theta < 360; theta += 5) {
      const p = project(n, 1, theta);
      const z = CAM * (1 - 1 / p.s);           // invert persp = CAM / (CAM - z)
      const orbit = Math.hypot((p.x - CX) / p.s, z);
      const elevation = (CY - p.y) / p.s;

      expect(orbit).toBeCloseTo(expectedRho, 9);
      expect(elevation).toBeCloseTo(expectedY, 9);
    }
  });

  it('returns to the starting pose after a full turn', () => {
    for (const n of NODES) {
      const a = project(n, 1, 0);
      const b = project(n, 1, 360);
      expect(b.x).toBeCloseTo(a.x, 9);
      expect(b.y).toBeCloseTo(a.y, 9);
      expect(b.s).toBeCloseTo(a.s, 9);
    }
  });

  it('scales nodes larger at the front than at the back', () => {
    const scales = Array.from({ length: 360 }, (_, t) => project(NODES[0], 1, t).s);
    expect(Math.max(...scales)).toBeGreaterThan(1);
    expect(Math.min(...scales)).toBeLessThan(1);
  });

  it('never divides by zero — the camera always sits outside the orbit', () => {
    for (const n of NODES) {
      const rho = n.d * Math.cos(n.psi * DEG);
      expect(rho).toBeLessThan(CAM);
    }
  });
});

describe('spoke colour', () => {
  it('matches the central node', () => {
    // Load-bearing, not cosmetic. A node in front of the centre has its spoke
    // drawn AFTER the central node by the depth sort, so a contrasting colour
    // paints a visible stripe across the centre and it looks transparent.
    expect(SPOKE).toBe(CENTRE);
  });
});

describe('roundedHex', () => {
  it('produces a closed path with six rounded corners', () => {
    const d = roundedHex(52, 9.5);
    expect(d.startsWith('M')).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
    expect(d.match(/Q/g)).toHaveLength(6);
  });

  it('emits no NaN for any plausible radius/rounding pair', () => {
    for (const r of [10, 26, 52]) {
      for (const rc of [0, 1.9, 9.5]) {
        expect(roundedHex(r, rc)).not.toContain('NaN');
      }
    }
  });
});
