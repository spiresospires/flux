import { useEffect, useRef } from 'react';
import { CX, CY, R_HEX, CENTRE, SPOKE, NODES, flintTier, project, roundedHex } from './flintGeometry';

// ─── Flint AI icon ────────────────────────────────────────────────────────────
// A static rounded hexagon frame with a gradient stroke, enclosing a node network
// that spins in 3D ON HOVER and holds still the rest of the time.
//
// All geometry, tiers and projection maths live in ./flintGeometry — this file is
// only the renderer. The split is deliberate: the containment check needs the same
// numbers, and duplicating them meant a validator that could silently pass while
// checking geometry that was no longer rendered.
//
// The network orbits the VERTICAL axis like a turning globe: nodes sweep around
// the front and back, growing as they come toward the viewer and shrinking as
// they recede. A real 3D rotation, not a flat clock-hands spin.
//
// Hover behaviour: the spin ramps up on hover and ramps down on leave, FREEZING
// at whatever angle it reached rather than snapping back to zero. Once fully
// stopped the rAF loop returns without rescheduling, so an idle rail costs zero
// frames. Perpetual motion in persistent navigation is distracting and a
// vestibular-accessibility problem — hover-gating is what makes this mark usable
// in the rail at all.
//
// Flat by design — no filters, shadows, glows or gradients on the nodes. Depth
// reads from size alone.

interface FlintIconProps {
  isHovered: boolean;
  isActive?: boolean;
  size?: number;
}

export function FlintIcon({ isHovered, isActive = false, size = 20 }: FlintIconProps) {
  const tier = flintTier(size, isActive);
  const uid = `${size}-${isActive ? 'a' : 'i'}`;

  const groupRefs = useRef<(SVGGElement | null)[]>([]);
  const spokeRefs = useRef<(SVGLineElement | null)[]>([]);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const netRef = useRef<SVGGElement | null>(null);

  // Survive re-renders and effect re-runs, so leaving and re-entering hover
  // resumes from where it stopped rather than jumping back to zero.
  const thetaRef = useRef(0);
  const speedRef = useRef(0);

  const drawn = tier.subset;

  useEffect(() => {
    const t = flintTier(size, isActive);

    const draw = (theta: number) => {
      const depths: { el: SVGGElement; z: number }[] = [];

      t.subset.forEach((idx, k) => {
        const n = NODES[idx];
        const p = project(n, t.spread, theta);
        const spoke = spokeRefs.current[k];
        const node = nodeRefs.current[k];
        const g = groupRefs.current[k];
        if (spoke) {
          spoke.setAttribute('x2', p.x.toFixed(2));
          spoke.setAttribute('y2', p.y.toFixed(2));
        }
        if (node) {
          node.setAttribute('cx', p.x.toFixed(2));
          node.setAttribute('cy', p.y.toFixed(2));
          node.setAttribute('r', (n.r * t.scale * p.s).toFixed(2));
        }
        if (g) depths.push({ el: g, z: p.z });
      });

      // the centre sits on the axis: z is always 0, so it never changes size
      const centreGroup = groupRefs.current[t.subset.length];
      if (centreGroup) depths.push({ el: centreGroup, z: 0 });

      // SVG has no z-index — depth order IS document order. Draw far to near.
      depths.sort((a, b) => a.z - b.z);
      const net = netRef.current;
      if (net) depths.forEach(d => net.appendChild(d.el));
    };

    draw(thetaRef.current);   // correct pose immediately, hovered or not

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;      // honour the preference: never spins

    const BASE = 40;          // degrees per second at full speed (~9s a turn)
    const ACCEL = 140;        // deg/s² spinning up   → full speed in .29s
    const DECEL = 110;        // deg/s² spinning down → dead stop in .36s

    // Linear ramps, deliberately not an exponential ease. An exponential only
    // approaches zero, so the icon keeps creeping imperceptibly for seconds after
    // the pointer leaves; constant deceleration actually reaches 0 and stops.
    let raf = 0;
    let last = 0;

    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      const target = isHovered ? BASE : 0;
      const rate = (isHovered ? ACCEL : DECEL) * dt;
      speedRef.current = speedRef.current < target
        ? Math.min(target, speedRef.current + rate)
        : Math.max(target, speedRef.current - rate);

      // Fully stopped: draw the final pose and let the loop die, so an idle icon
      // in the rail costs zero frames.
      if (!isHovered && speedRef.current === 0) {
        draw(thetaRef.current);
        return;
      }

      thetaRef.current = (thetaRef.current + speedRef.current * dt) % 360;
      draw(thetaRef.current);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isHovered, size, isActive]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      role="img"
      aria-label="Flint"
    >
      <defs>
        {/* deep violet-blue at bottom-left → bright sky-blue at top-right */}
        <linearGradient id={`flintFrame-${uid}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#3B2FC9" />
          <stop offset=".55" stopColor="#2E6AD6" />
          <stop offset="1" stopColor="#52C4F2" />
        </linearGradient>
      </defs>

      {/* Frame is a sibling of the network, never a parent — it cannot move. */}
      <path
        d={roundedHex(R_HEX, tier.corner)}
        fill="none"
        stroke={`url(#flintFrame-${uid})`}
        strokeWidth={tier.stroke}
        strokeLinejoin="round"
      />

      <g ref={netRef}>
        {drawn.map((idx, k) => (
          <g key={idx} ref={el => { groupRefs.current[k] = el; }}>
            <line
              ref={el => { spokeRefs.current[k] = el; }}
              x1={CX} y1={CY} x2={CX} y2={CY}
              stroke={SPOKE} strokeWidth={tier.spoke} strokeLinecap="round"
            />
            <circle
              ref={el => { nodeRefs.current[k] = el; }}
              cx={CX} cy={CY} r={NODES[idx].r * tier.scale} fill={NODES[idx].c}
            />
          </g>
        ))}

        <g ref={el => { groupRefs.current[drawn.length] = el; }}>
          <circle cx={CX} cy={CY} r={tier.centre} fill={CENTRE} />
        </g>
      </g>
    </svg>
  );
}
