import { motion, AnimatePresence } from "motion/react";
import { ScoreTable } from "./ScoreTable";
import { DiceRow } from "./DiceRow";
import { Die } from "./Die";
import { sendToHost } from "../bridge";
import { CATEGORY_META, type BoardData, type CategoryKey } from "../types";



function ThrowPips({ throwsLeft }: { throwsLeft: number }) {
  return (
    <div className="throws-left">
      {[3, 2, 1].map((n) => (
        <div
          key={n}
          className={`throw-pip ${n <= throwsLeft ? "throw-pip--active" : "throw-pip--inactive"}`}
        />
      ))}
    </div>
  );
}



export function RerollScreen({ data, requestId }: { data: BoardData; requestId: string }) {
  return (
    <div className="game-layout">
      <PlayArea data={data} mode="reroll" requestId={requestId} />
      <ScoreTable
        data={data}
      />
    </div>
  );
}



export function CategoryScreen({
  data,
  available,
  requestId,
}: {
  data: BoardData;
  available: CategoryKey[];
  requestId: string;
}) {
  return (
    <div className="game-layout">
      <PlayArea data={data} mode="category" available={available} requestId={requestId} />
      <ScoreTable
        data={data}
        availableForSelection={available}
        onSelectCategory={(cat) => sendToHost({ type: "CATEGORY_CHOICE", requestId, data: cat })}
      />
    </div>
  );
}



export function BotResultScreen({
  data,
  result,
  requestId,
}: {
  data: BoardData;
  result: { category: CategoryKey; score: number };
  requestId: string;
}) {
  return (
    <div className="game-layout">
      <PlayArea data={data} mode="bot_result" result={result} requestId={requestId} />
      <ScoreTable
        data={data}
      />
    </div>
  );
}



type PlayMode = "display" | "reroll" | "category" | "bot_result";

function PlayArea({
  data,
  mode,
  available,
  result,
  requestId,
}: {
  data: BoardData;
  mode: PlayMode;
  available?: CategoryKey[];
  result?: { category: CategoryKey; score: number };
  requestId?: string;
}) {
  return (
    <div className="play-area">
      {}
      <div className="round-header">
        <div className="round-info">
          <span className="round-badge">
            Раунд {data.round} / 13
          </span>
          {mode !== "bot_result" && (
            <ThrowPips throwsLeft={data.throwsLeft} />
          )}
        </div>
        {mode === "bot_result" && (
          <span className="text-muted text-mono" style={{ fontSize: 11 }}>
            Ход бота завершён
          </span>
        )}
      </div>

      {}
      {mode === "reroll" ? (
        <DiceRow dice={data.dice} selectable throwsLeft={data.throwsLeft} requestId={requestId!} />
      ) : (
        <div className="dice-section">
          <div className="dice-section__label">Кубики</div>
          <div className="dice-row">
            {data.dice.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: i * 0.05, ease: [0.16,1,0.3,1] }}
              >
                <Die value={v} index={i + 1} />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {}
      <AnimatePresence mode="wait">
        {mode === "category" && available && (
          <motion.div
            key="category"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="message-bar message-bar--info" style={{ marginBottom: 12 }}>
              Выберите категорию для записи результата — нажмите на строку справа или в списке ниже.
            </div>
            <CategoryInlineList available={available} scores={data.potentialScores} requestId={requestId!} />
          </motion.div>
        )}

        {mode === "bot_result" && result && (
          <motion.div
            key="bot"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BotResultCard result={result} />
            <button
              className="btn btn--primary"
              style={{ marginTop: 8 }}
              onClick={() => sendToHost({ type: "INPUT_CONFIRMED", requestId: requestId!, data: null })}
            >
              Следующий раунд
            </button>
          </motion.div>
        )}

        {mode === "display" && (
          <motion.div
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="message-bar">
              Броски завершены. Ожидание…
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



function CategoryInlineList({
  available,
  scores,
  requestId,
}: {
  available: CategoryKey[];
  scores: BoardData["potentialScores"];
  requestId: string;
}) {
  return (
    <div className="category-list">
      {available.map((cat, i) => {
        const { key, label, description } = CATEGORY_META[cat];
        const score = scores[cat] ?? 0;
        return (
          <motion.div
            key={cat}
            className={`category-item ${score === 0 ? "category-item--zero" : ""}`}
            onClick={() => sendToHost({ type: "CATEGORY_CHOICE", requestId, data: cat })}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
          >
            <span className="category-item__key">{key}</span>
            <div>
              <div className="category-item__label">{label}</div>
              <div className="category-item__desc">{description}</div>
            </div>
            <div className={`category-item__score ${score > 0 ? "category-item__score--positive" : "category-item__score--zero"}`}>
              {score > 0 ? `+${score}` : "0"}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}



function BotResultCard({ result }: { result: { category: CategoryKey; score: number } }) {
  const { key, label } = CATEGORY_META[result.category];
  return (
    <div className="bot-result-card">
      <div className="bot-result-icon">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="bot-result-text">
        <div className="bot-result-text__label">Бот записал</div>
        <div className="bot-result-text__category">
          [{key}] {label}
        </div>
      </div>
      <div className="bot-result-score">{result.score}</div>
    </div>
  );
}
