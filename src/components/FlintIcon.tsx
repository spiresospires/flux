// FlintIcon / FlintLockup — the Flint brand marks.
//
// Replaced 2026-09-15 with the design team's iconography refresh. The previous
// implementation was a bespoke animated bloom (a centre point, eight drifting
// nodes, a corona ring and sparkles) built before this artwork existed. None of
// that geometry survives in the new mark, so the animation could not be carried
// across — per product decision, navigation is now static and a new animation
// built for the new shape plays on the Chat screen only.
//
// Colour comes entirely from `currentColor` (product decision, 2026-09-15:
// "for now follow nav state"), so Flint inherits whatever its surroundings use
// — brand blue when a nav item is active, grey when not, and dark mode for
// free. Pinning it to the Flint navy (#1C1D8D) later is a `color` on one
// wrapper, not a change in here.
import { motion, type Variants } from 'framer-motion';
import {
  FLINT_HEX_PATHS,
  FLINT_LOCKUP_MARK_SLOT,
  FLINT_LOCKUP_VIEWBOX,
  FLINT_MARK_CENTRE,
  FLINT_MARK_SQUARE_VIEWBOX,
  FLINT_MARK_VIEWBOX_HEIGHT,
  FLINT_MARK_VIEWBOX_WIDTH,
  FLINT_RAY_PATHS,
  FLINT_WORDMARK_PATHS,
} from './flintArt';

/** Rays scale from the middle of the mark, so they read as radiating outward
 *  rather than each swelling where it sits. `view-box` resolves against the
 *  nearest SVG viewport — the square icon viewBox for the standalone mark, the
 *  nested viewport for the lockup — so the same origin is correct in both. */
const RAY_ORIGIN: React.CSSProperties = {
  transformOrigin: `${FLINT_MARK_CENTRE.x}px ${FLINT_MARK_CENTRE.y}px`,
  transformBox: 'view-box',
};

// The hexagon's two subpaths MUST share one <path> element. They are the outer
// and inner edge of the same stroke, wound in opposite directions, and it is
// the nonzero fill rule across both that punches the middle out. Split into two
// elements they fill independently and the mark renders as a solid blob.
function HexPaths() {
  return <path d={FLINT_HEX_PATHS.join(' ')} fill="currentColor" />;
}

/**
 * The Flint mark on its own, static — for navigation and any inline use.
 * Sized like the Lucide icons it sits beside: square box, `size` on a side,
 * with the mark centred rather than stretched to fill it.
 */
export function FlintIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={FLINT_MARK_SQUARE_VIEWBOX}
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <HexPaths />
      {FLINT_RAY_PATHS.map((d) => (
        <path key={d} d={d} fill="currentColor" />
      ))}
    </svg>
  );
}

// Ignite on mount, then a gentle re-spark on hover. The rays are staggered in
// clockwise order (see flintArt) so the mark catches light around its face
// instead of flashing all at once.
//
// Reduced motion needs no handling here: App.tsx wraps the tree in
// <MotionConfig reducedMotion="user">, which drops the transforms and leaves
// the opacity fade.
const rayVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 24 } },
  hover: { scale: 1.14, transition: { type: 'spring', stiffness: 500, damping: 12 } },
};

const markVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.14 } },
  hover: { transition: { staggerChildren: 0.03 } },
};

const hexVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * The full lockup — mark plus the "Flint" wordmark — for the Chat screen.
 *
 * Composed rather than dropped in as a single supplied file: the source lockup
 * merges the mark into one path, which cannot be animated ray by ray. The mark
 * is placed in a nested `<svg>` at the exact slot it occupies in the original
 * (verified against every subpath), so this renders identically to the supplied
 * artwork while leaving each ray addressable.
 *
 * `height` drives the size; width follows the lockup's own proportions.
 */
export function FlintLockup({ height = 88, className }: { height?: number; className?: string }) {
  const [, , vbWidth, vbHeight] = FLINT_LOCKUP_VIEWBOX.split(' ').map(Number);

  return (
    <motion.svg
      width={(height * vbWidth) / vbHeight}
      height={height}
      viewBox={FLINT_LOCKUP_VIEWBOX}
      fill="none"
      className={className}
      role="img"
      aria-label="Flint"
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <motion.g variants={hexVariants} fill="currentColor">
        {FLINT_WORDMARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </motion.g>

      {/* Nested viewport: re-establishes the mark's own coordinate system, so
          the ray transform-origin above is expressed in mark units here too. */}
      <svg
        x={FLINT_LOCKUP_MARK_SLOT.x}
        y={FLINT_LOCKUP_MARK_SLOT.y}
        width={FLINT_LOCKUP_MARK_SLOT.width}
        height={FLINT_LOCKUP_MARK_SLOT.height}
        viewBox={`0 0 ${FLINT_MARK_VIEWBOX_WIDTH} ${FLINT_MARK_VIEWBOX_HEIGHT}`}
        overflow="visible"
      >
        <motion.g variants={hexVariants}>
          <HexPaths />
        </motion.g>
        <motion.g variants={markVariants}>
          {FLINT_RAY_PATHS.map((d) => (
            <motion.path key={d} d={d} fill="currentColor" variants={rayVariants} style={RAY_ORIGIN} />
          ))}
        </motion.g>
      </svg>
    </motion.svg>
  );
}
