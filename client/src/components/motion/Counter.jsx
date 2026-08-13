import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

// Counts from 0 up to `value` the first time it scrolls into view.
const Counter = ({
  value,
  duration = 1.6,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

export default Counter;
