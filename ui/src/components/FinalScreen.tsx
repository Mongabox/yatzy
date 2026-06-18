import { motion } from "motion/react";
import { ScoreTable } from "./ScoreTable";
import { sendToHost } from "../bridge";
import type { FinalData } from "../types";


export function FinalScreen({ data, requestId }: { data: FinalData; requestId: string }) {
  const pTotal = data.playerTotal;
  const bTotal = data.botTotal;
  const playerWins = pTotal > bTotal;
  const tie = pTotal === bTotal;

  const pBonus = data.playerUpperSum >= 63;
  const bBonus = data.botUpperSum >= 63;

  return (
    <div className="final-screen">
      {}
      <motion.div
        className="final-winner-panel"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="final-winner-label">Результат</div>

        <div className={`final-winner-name ${
          tie ? "final-winner-name--tie" :
          playerWins ? "final-winner-name--player" :
          "final-winner-name--bot"
        }`}>
          {tie ? "Ничья" : playerWins ? "Победа" : "Поражение"}
        </div>

        {!tie && (
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.5 }}>
            {playerWins
              ? "Вы обыграли бота. Хорошая игра."
              : "Бот набрал больше очков в этот раз."}
          </p>
        )}

        <div className="final-scores">
          <div className="final-score-item">
            <span className="final-score-name">Вы</span>
            <span className={`final-score-value ${playerWins || tie ? "final-score-value--winner" : "final-score-value--loser"}`}>
              {pTotal}
            </span>
          </div>
          <div style={{ width: 1, background: "var(--border)", margin: "4px 0" }} />
          <div className="final-score-item">
            <span className="final-score-name">Бот</span>
            <span className={`final-score-value ${!playerWins || tie ? "final-score-value--winner" : "final-score-value--loser"}`}>
              {bTotal}
            </span>
          </div>
        </div>

        {(pBonus || bBonus) && (
          <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", gap: 4 }}>
            {pBonus && (
              <div className="final-bonus-note">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1l1.5 3H11L8.5 6.5 9.5 10 6 8 2.5 10l1-3.5L1 4h3.5z" fill="var(--green-text)"/>
                </svg>
                Вы получили бонус +35
              </div>
            )}
            {bBonus && (
              <div className="final-bonus-note" style={{ color: "var(--text-secondary)", background: "var(--bg-subtle)" }}>
                Бот получил бонус +35
              </div>
            )}
          </div>
        )}

        <button
          id="btn-play-again"
          className="btn btn--primary"
          onClick={() => sendToHost({ type: "FINAL_ACTION", requestId, data: "PlayAgain" })}
        >
          Играть снова
        </button>
        <button
          className="btn btn--ghost"
          style={{ marginTop: 8 }}
          onClick={() => sendToHost({ type: "FINAL_ACTION", requestId, data: "Exit" })}
        >
          Выйти
        </button>
      </motion.div>

      {}
      <motion.div
        className="final-table-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <ScoreTable
          data={{
            ...data,
            potentialScores: {},
          }}
        />
      </motion.div>
    </div>
  );
}
