import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Die } from "./Die";
import { sendToHost } from "../bridge";

interface DiceRowProps {
  dice: number[];
  selectable?: boolean;
  throwsLeft?: number;
  requestId: string;
}

export function DiceRow({ dice, selectable = false, throwsLeft = 0, requestId }: DiceRowProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggle(idx: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleReroll() {
    if (selected.size === 0) {
      
      sendToHost({ type: "REROLL_CHOICE", requestId, data: [] });
    } else {
      sendToHost({ type: "REROLL_CHOICE", requestId, data: [...selected].sort((a, b) => a - b) });
    }
    setSelected(new Set());
  }

  function handleStop() {
    sendToHost({ type: "REROLL_CHOICE", requestId, data: [] });
    setSelected(new Set());
  }

  return (
    <div className="dice-section">
      <div className="dice-section__label">Кубики</div>

      <div className="dice-row">
        <AnimatePresence mode="popLayout">
          {dice.map((v, i) => (
            <motion.div
              key={`die-${i}-${v}`}
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16,1,0.3,1] }}
              layout
            >
              <Die
                value={v}
                index={i + 1}
                selectable={selectable}
                selected={selected.has(i + 1)}
                onToggle={() => toggle(i + 1)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {selectable && (
        <motion.div
          className="action-panel__row"
          style={{ marginTop: 14 }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <button
            className="btn btn--primary"
            onClick={handleReroll}
            disabled={selected.size === 0}
            style={{ opacity: selected.size === 0 ? 0.4 : 1 }}
          >
            Перебросить{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
          <button className="btn btn--ghost" onClick={handleStop}>
            Оставить все
          </button>
          {throwsLeft > 0 && (
            <span className="text-muted text-mono" style={{ fontSize: 11 }}>
              {throwsLeft} {throwsLeft === 1 ? "бросок" : "броска"} осталось
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
