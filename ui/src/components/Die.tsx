import { lazy, Suspense } from "react";
import { motion } from "motion/react";

const ThreeDie = lazy(() =>
  import("./ThreeDie").then(module => ({ default: module.ThreeDie })));

interface DiceProps {
  value: number;       
  index: number;       
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}

export function Die({ value, index, selectable, selected, onToggle }: DiceProps) {
  return (
    <motion.div
      layout
      className={[
        "die",
        selectable ? "die--selectable" : "",
        selected   ? "die--selected"   : "",
      ].join(" ")}
      onClick={selectable ? onToggle : undefined}
      whileTap={selectable ? { scale: 0.93 } : {}}
      animate={{
        rotate: selected ? [0, -4, 4, 0] : 0,
      }}
      transition={{ duration: 0.25 }}
      initial={false}
    >
      {selected && (
        <div className="die__check">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <Suspense fallback={<div style={{ width: 56, height: 56 }} />}>
        <ThreeDie value={value} selected={selected} />
      </Suspense>
      <span className="die__index">{index}</span>
    </motion.div>
  );
}
