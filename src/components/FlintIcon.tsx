import { motion } from 'framer-motion';

// ─── Flint AI icon ────────────────────────────────────────────────────────────
// Bloom network: 1 centre node + 8 outer nodes connected by spokes.
//
// Idle  : each outer node drifts in its own direction at its own speed.
//         Unique amplitude and duration so no two nodes sync.
//         Module-level animate/transition constants → Framer Motion never
//         restarts the drift loop on parent re-renders.
//
// Hover : spokes draw outward (staggered 38 ms), nodes radius-pulse, centre
//         pulses, white corona ring expands, sparkle dots flash at cardinals.

const _FCX = 12, _FCY = 12, _FR = 8.2;

export const FLINT_OUTER = Array.from({ length: 8 }, (_, i) => {
  const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
  return {
    x: _FCX + _FR * Math.cos(a),
    y: _FCY + _FR * Math.sin(a),
    color: (['#F472B6', '#34D399', '#FBBF24', '#A78BFA',
             '#F472B6', '#34D399', '#FBBF24', '#A78BFA'] as const)[i],
  };
});

const _FDRIFT = [
  { dx:  1.3, dy: -0.8, dur: 3.2 },
  { dx:  0.7, dy:  1.1, dur: 2.7 },
  { dx: -1.1, dy:  0.5, dur: 3.5 },
  { dx:  0.9, dy:  0.9, dur: 2.9 },
  { dx: -0.8, dy: -1.2, dur: 3.1 },
  { dx:  1.0, dy: -0.7, dur: 2.6 },
  { dx: -1.2, dy:  0.6, dur: 3.4 },
  { dx:  0.5, dy:  1.0, dur: 3.0 },
];

// Stable object references — prevents Framer Motion restarting the drift loop
export const FLINT_DRIFT_ANIMS = _FDRIFT.map(d => ({
  x: [0, d.dx, -d.dx * 0.6, d.dx * 0.25, 0] as number[],
  y: [0, d.dy,  d.dy * 0.35, -d.dy * 0.5, 0] as number[],
}));
export const FLINT_DRIFT_TRANS = _FDRIFT.map(d => ({
  duration: d.dur,
  repeat: Infinity,
  ease: 'easeInOut' as const,
  repeatType: 'loop' as const,
}));

interface FlintIconProps {
  isHovered: boolean;
  isActive?: boolean;
  size?: number;
}

export function FlintIcon({ isHovered, isActive = false, size = 20 }: FlintIconProps) {
  const hoverState = isHovered ? 'hover' : 'idle';
  const sw       = isActive ? 1.1 : 0.85;
  const outerR   = 1.45;
  const centreR  = isActive ? 2.3 : 2.1;

  const lineMk = (delay: number) => ({
    idle: { pathLength: 1, transition: { duration: 0.15 } },
    hover: { pathLength: [0, 1] as number[], transition: { duration: 0.38, delay, ease: 'easeOut' as const } },
  });

  return (
    <motion.svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{
        filter: isHovered
          ? 'drop-shadow(0 0 5px rgba(4,97,186,0.5)) drop-shadow(0 0 3px rgba(255,255,255,0.85))'
          : isActive
            ? 'drop-shadow(0 0 3px rgba(4,97,186,0.3))'
            : 'drop-shadow(0 0 0px rgba(4,97,186,0))',
      }}
      transition={{ duration: isHovered ? 0.2 : 0.6 }}
    >
      {/* Spokes — draw outward on hover, staggered every 38 ms */}
      {FLINT_OUTER.map((node, i) => (
        <motion.path
          key={`spoke-${i}`}
          d={`M${_FCX},${_FCY}L${node.x.toFixed(2)},${node.y.toFixed(2)}`}
          stroke="currentColor"
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          initial="idle"
          animate={hoverState}
          variants={lineMk(i * 0.038)}
        />
      ))}

      {/* Outer nodes — drifting g wrapper, radius pulse on hover */}
      {FLINT_OUTER.map((node, i) => (
        <motion.g
          key={`outer-${i}`}
          animate={FLINT_DRIFT_ANIMS[i]}
          transition={FLINT_DRIFT_TRANS[i]}
        >
          <motion.circle
            cx={node.x} cy={node.y}
            fill={node.color}
            initial={{ r: outerR }}
            animate={{ r: isHovered ? [outerR, outerR + 0.55, outerR] : outerR }}
            transition={{ duration: 0.34, delay: i * 0.04 }}
          />
        </motion.g>
      ))}

      {/* Centre node — brand blue, pulses on hover */}
      <motion.circle
        cx={_FCX} cy={_FCY}
        r={centreR}
        fill="#0461BA"
        animate={{ r: isHovered ? [centreR, centreR + 0.9, centreR] : centreR }}
        transition={{ duration: 0.4, delay: 0.12 }}
      />

      {/* White corona ring — expands and fades after spokes finish */}
      <motion.circle
        cx={_FCX} cy={_FCY}
        fill="none"
        stroke="white"
        initial="idle"
        animate={hoverState}
        variants={{
          idle: { r: centreR, opacity: 0, strokeWidth: 1.5 },
          hover: {
            r: [centreR, centreR + 7],
            opacity: [0, 0.9, 0],
            strokeWidth: [2.5, 0.2],
            transition: { duration: 0.52, delay: 0.5 },
          },
        }}
      />

      {/* White sparkle dots at cardinal spoke midpoints (N, E, S, W) */}
      {([0, 2, 4, 6] as const).map((idx) => {
        const n = FLINT_OUTER[idx];
        return (
          <motion.circle
            key={`spark-${idx}`}
            cx={(_FCX + n.x) / 2}
            cy={(_FCY + n.y) / 2}
            fill="white"
            initial="idle"
            animate={hoverState}
            variants={{
              idle: { r: 0, opacity: 0 },
              hover: {
                r: [0, 0.85, 0],
                opacity: [0, 1, 0],
                transition: { duration: 0.3, delay: 0.52 + idx * 0.04 },
              },
            }}
          />
        );
      })}
    </motion.svg>
  );
}
