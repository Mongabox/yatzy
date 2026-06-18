import { motion } from "motion/react";
import { CATEGORY_META, type BoardData, type CategoryKey, type ScoreCardData } from "../types";

interface ScoreTableProps {
  data: Pick<
    BoardData,
    "playerCard" | "botCard" | "potentialScores" |
    "playerUpperSum" | "botUpperSum" | "playerTotal" | "botTotal"
  >;
  availableForSelection?: CategoryKey[];
  onSelectCategory?: (cat: CategoryKey) => void;
}


export function ScoreTable({
  data,
  availableForSelection,
  onSelectCategory,
}: ScoreTableProps) {
  const {
    playerCard,
    botCard,
    potentialScores,
    playerUpperSum: pUpper,
    botUpperSum: bUpper,
    playerTotal: pTotal,
    botTotal: bTotal,
  } = data;

  return (
    <div className="score-sidebar">
      {}
      <div className="score-column-headers">
        <div className="score-column-header" style={{ gridColumn: "1/3", textAlign: "left" }}>
          Комбинация
        </div>
        <div className="score-column-header">Вы</div>
        <div className="score-column-header">Бот</div>
      </div>

      {}
      <div className="score-section-header">
        <span className="score-section-label">Верхняя секция</span>
      </div>

      {}
      <div className="score-bonus-bar">
        <div className="score-bonus-track">
          <div
            className="score-bonus-fill"
            style={{ width: `${Math.min(100, (pUpper / 63) * 100)}%` }}
          />
        </div>
        <span className="score-bonus-label">{pUpper}/63</span>
      </div>

      {(["Ones","Twos","Threes","Fours","Fives","Sixes"] as CategoryKey[]).map((cat, i) => (
        <ScoreRow
          key={cat}
          cat={cat}
          playerCard={playerCard}
          botCard={botCard}
          potential={potentialScores[cat]}
          isSelectable={availableForSelection?.includes(cat)}
          onSelect={() => onSelectCategory?.(cat)}
          index={i}
        />
      ))}

      <div className="score-divider" />

      {}
      <div className="score-section-header">
        <span className="score-section-label">Нижняя секция</span>
      </div>

      {(["ThreeOfAKind","FourOfAKind","FullHouse","SmallStraight","BigStraight","Yahtzee","Chance"] as CategoryKey[]).map((cat, i) => (
        <ScoreRow
          key={cat}
          cat={cat}
          playerCard={playerCard}
          botCard={botCard}
          potential={potentialScores[cat]}
          isSelectable={availableForSelection?.includes(cat)}
          onSelect={() => onSelectCategory?.(cat)}
          index={i + 6}
        />
      ))}

      <div className="score-totals">
        <div className="score-total-row">
          <span className="score-total-label">Бонус +35</span>
          <span className="score-total-value" style={{ color: pUpper >= 63 ? "var(--green-text)" : "var(--text-muted)", fontSize: 11 }}>
            {pUpper >= 63 ? "+35" : `${pUpper}/63`}
          </span>
          <span className="score-total-value" style={{ color: bUpper >= 63 ? "var(--green-text)" : "var(--text-muted)", fontSize: 11 }}>
            {bUpper >= 63 ? "+35" : "–"}
          </span>
        </div>
        <div className="score-total-row" style={{ marginTop: 4 }}>
          <span className="score-total-label" style={{ fontWeight: 600, color: "var(--text-primary)" }}>
            Итого
          </span>
          <span className={`score-total-value ${pTotal >= bTotal ? "score-total-value--winning" : "score-total-value--losing"}`}>
            {pTotal}
          </span>
          <span className={`score-total-value ${bTotal > pTotal ? "score-total-value--winning" : "score-total-value--losing"}`}>
            {bTotal}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ScoreRowProps {
  cat: CategoryKey;
  playerCard: ScoreCardData;
  botCard: ScoreCardData;
  potential?: number;
  isSelectable?: boolean;
  onSelect?: () => void;
  index: number;
}

function ScoreRow({ cat, playerCard, botCard, potential, isSelectable, onSelect, index }: ScoreRowProps) {
  const { key, label } = CATEGORY_META[cat];
  const pVal = playerCard[cat];
  const bVal = botCard[cat];

  const pFilled = pVal !== null && pVal !== undefined;
  const bFilled = bVal !== null && bVal !== undefined;
  const showPotential = !pFilled && potential !== undefined && potential > 0;

  return (
    <motion.div
      className={`score-row ${isSelectable ? "score-row--available" : ""}`}
      onClick={isSelectable ? onSelect : undefined}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03, ease: [0.16,1,0.3,1] }}
      whileHover={isSelectable ? { backgroundColor: "var(--green-bg)" } : {}}
    >
      <span className="score-row__key">{key}</span>
      <span className="score-row__label">{label}</span>
      <span className={[
        "score-row__cell",
        pFilled ? "score-row__cell--filled" :
        showPotential ? "score-row__cell--potential" :
        "score-row__cell--empty",
      ].join(" ")}>
        {pFilled ? pVal : showPotential ? potential : "–"}
      </span>
      <span className={[
        "score-row__cell",
        bFilled ? "score-row__cell--filled" : "score-row__cell--empty",
      ].join(" ")}>
        {bFilled ? bVal : "–"}
      </span>
    </motion.div>
  );
}
