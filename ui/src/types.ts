export type CategoryKey =
  | "Ones" | "Twos" | "Threes" | "Fours" | "Fives" | "Sixes"
  | "ThreeOfAKind" | "FourOfAKind" | "FullHouse"
  | "SmallStraight" | "BigStraight" | "Yahtzee" | "Chance";

export const ALL_CATEGORIES: CategoryKey[] = [
  "Ones", "Twos", "Threes", "Fours", "Fives", "Sixes",
  "ThreeOfAKind", "FourOfAKind", "FullHouse",
  "SmallStraight", "BigStraight", "Yahtzee", "Chance",
];

export interface CategoryMeta {
  key: string;
  label: string;
  description: string;
  section: "upper" | "lower";
}

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  Ones:          { key: "1", label: "Единицы", description: "Сумма всех 1", section: "upper" },
  Twos:          { key: "2", label: "Двойки", description: "Сумма всех 2", section: "upper" },
  Threes:        { key: "3", label: "Тройки", description: "Сумма всех 3", section: "upper" },
  Fours:         { key: "4", label: "Четвёрки", description: "Сумма всех 4", section: "upper" },
  Fives:         { key: "5", label: "Пятёрки", description: "Сумма всех 5", section: "upper" },
  Sixes:         { key: "6", label: "Шестёрки", description: "Сумма всех 6", section: "upper" },
  ThreeOfAKind:  { key: "x3", label: "Три одинаковых", description: "≥3 одинаковых → сумма", section: "lower" },
  FourOfAKind:   { key: "x4", label: "Четыре одинаковых", description: "≥4 одинаковых → сумма", section: "lower" },
  FullHouse:     { key: "fh", label: "Full House", description: "3+2 → 25 очков", section: "lower" },
  SmallStraight: { key: "sm", label: "Малый стрит", description: "4 подряд → 30 очков", section: "lower" },
  BigStraight:   { key: "bg", label: "Большой стрит", description: "5 подряд → 40 очков", section: "lower" },
  Yahtzee:       { key: "yz", label: "Яцы", description: "5 одинаковых → 50 очков", section: "lower" },
  Chance:        { key: "ot", label: "Шанс", description: "Сумма всех кубиков", section: "lower" },
};

export type ScoreCardData = Record<CategoryKey, number | null>;
export type PotentialScores = Partial<Record<CategoryKey, number>>;

export interface BoardData {
  playerCard: ScoreCardData;
  botCard: ScoreCardData;
  potentialScores: PotentialScores;
  dice: number[];
  throwsLeft: number;
  round: number;
  playerUpperSum: number;
  botUpperSum: number;
  playerTotal: number;
  botTotal: number;
}

export interface FinalData {
  playerCard: ScoreCardData;
  botCard: ScoreCardData;
  playerUpperSum: number;
  botUpperSum: number;
  playerTotal: number;
  botTotal: number;
}

export interface TurnResultData {
  category: CategoryKey;
  score: number;
}

export type ViewState =
  | { screen: "menu"; requestId: string }
  | { screen: "reroll"; requestId: string; data: BoardData }
  | { screen: "category"; requestId: string; data: BoardData; available: CategoryKey[] }
  | { screen: "bot_result"; requestId: string; data: BoardData; result: TurnResultData }
  | { screen: "final"; requestId: string; data: FinalData }
  | { screen: "wait"; requestId: string; prompt: string; prevScreen: ViewState };
