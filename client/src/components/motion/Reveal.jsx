import { motion } from "framer-motion";

// Shared easing so every section animates with the same feel.
export const EASE = [0.22, 1, 0.36, 1];

// Variants are functions of `custom` so a per-element delay can be threaded
// through; a variant's own transition overrides the transition prop.
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: EASE, delay },
  }),
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.9, ease: EASE, delay },
  }),
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (delay = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.9, ease: EASE, delay },
  }),
};

/** Parent wrapper that releases its children one after another. */
export const stagger = (staggerChildren = 0.12, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

// Animates its children into view the first time they cross the viewport.
const Reveal = ({
  children,
  variants = fadeUp,
  delay = 0,
  amount = 0.25,
  once = true,
  className = "",
  ...rest
}) => (
  <motion.div
    className={className}
    variants={variants}
    custom={delay}
    initial="hidden"
    whileInView="visible"
    viewport={{ once, amount }}
    {...rest}
  >
    {children}
  </motion.div>
);

// Wrap a list of <StaggerItem> so they cascade in.
export const StaggerGroup = ({
  children,
  className = "",
  staggerChildren = 0.12,
  delayChildren = 0,
  amount = 0.2,
  once = true,
  ...rest
}) => (
  <motion.div
    className={className}
    variants={stagger(staggerChildren, delayChildren)}
    initial="hidden"
    whileInView="visible"
    viewport={{ once, amount }}
    {...rest}
  >
    {children}
  </motion.div>
);

/** A single child inside a StaggerGroup. */
export const StaggerItem = ({
  children,
  variants = fadeUp,
  className = "",
  ...rest
}) => (
  <motion.div className={className} variants={variants} {...rest}>
    {children}
  </motion.div>
);

export default Reveal;
