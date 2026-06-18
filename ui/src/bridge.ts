import { useGameStore } from "./store/gameStore";
import type { BoardData, CategoryKey, FinalData, TurnResultData } from "./types";

interface WebViewBridge {
  postMessage(message: OutboundMessage): void;
  addEventListener(type: "message", handler: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", handler: (event: MessageEvent) => void): void;
}

declare global {
  interface Window {
    chrome?: { webview?: WebViewBridge };
    __yatzy_dev?: Record<string, () => void>;
  }
}

type InboundMessage =
  | { type: "REQUEST_MENU"; requestId: string }
  | { type: "REQUEST_REROLL"; requestId: string; data: BoardData }
  | { type: "REQUEST_CATEGORY"; requestId: string; data: { board: BoardData; available: CategoryKey[] } }
  | { type: "REQUEST_PLAYER_CONTINUE"; requestId: string; data: { board: BoardData; result: TurnResultData } }
  | { type: "REQUEST_BOT_CONTINUE"; requestId: string; data: { board: BoardData; result: TurnResultData } }
  | { type: "REQUEST_FINAL"; requestId: string; data: FinalData };

export type OutboundMessage =
  | { type: "UI_READY" }
  | { type: "MENU_ACTION"; requestId: string; data: "Play" | "Exit" }
  | { type: "REROLL_CHOICE"; requestId: string; data: number[] }
  | { type: "CATEGORY_CHOICE"; requestId: string; data: CategoryKey }
  | { type: "INPUT_CONFIRMED"; requestId: string; data: null }
  | { type: "FINAL_ACTION"; requestId: string; data: "PlayAgain" | "Exit" }
  | { type: "WINDOW_MINIMIZE" }
  | { type: "WINDOW_MAXIMIZE" }
  | { type: "WINDOW_CLOSE" };

export function sendToHost(message: OutboundMessage): void {
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage(message);
  } else {
    console.log("[bridge → C#]", message);
  }
}

export function initBridge(): () => void {
  const handler = (event: MessageEvent<unknown>) => {
    const message = parseInboundMessage(event.data);
    if (!message) {
      console.warn("[bridge] invalid message", event.data);
      return;
    }

    const store = useGameStore.getState();
    switch (message.type) {
      case "REQUEST_MENU":
        store.setScreen({ screen: "menu", requestId: message.requestId });
        break;
      case "REQUEST_REROLL":
        store.setScreen({ screen: "reroll", requestId: message.requestId, data: message.data });
        break;
      case "REQUEST_CATEGORY":
        store.setScreen({
          screen: "category",
          requestId: message.requestId,
          data: message.data.board,
          available: message.data.available,
        });
        break;
      case "REQUEST_PLAYER_CONTINUE":
        store.setScreen({
          screen: "wait",
          requestId: message.requestId,
          prompt: `Записано: ${message.data.result.category} → ${message.data.result.score} очков`,
          prevScreen: {
            screen: "category",
            requestId: message.requestId,
            data: message.data.board,
            available: [],
          },
        });
        break;
      case "REQUEST_BOT_CONTINUE":
        store.setScreen({
          screen: "bot_result",
          requestId: message.requestId,
          data: message.data.board,
          result: message.data.result,
        });
        break;
      case "REQUEST_FINAL":
        store.setScreen({ screen: "final", requestId: message.requestId, data: message.data });
        break;
    }
  };

  if (window.chrome?.webview) {
    const webview = window.chrome.webview;
    webview.addEventListener("message", handler);
    sendToHost({ type: "UI_READY" });
    return () => webview.removeEventListener("message", handler);
  }

  window.addEventListener("message", handler);
  exposeDevMock();
  sendToHost({ type: "UI_READY" });
  return () => window.removeEventListener("message", handler);
}

function parseInboundMessage(data: unknown): InboundMessage | null {
  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    if (!parsed || typeof parsed !== "object" || !("type" in parsed) || !("requestId" in parsed))
      return null;
    return parsed as InboundMessage;
  } catch {
    return null;
  }
}

function exposeDevMock(): void {
  const emptyCard = Object.fromEntries([
    "Ones", "Twos", "Threes", "Fours", "Fives", "Sixes",
    "ThreeOfAKind", "FourOfAKind", "FullHouse", "SmallStraight",
    "BigStraight", "Yahtzee", "Chance",
  ].map(category => [category, null])) as BoardData["playerCard"];

  const board: BoardData = {
    playerCard: emptyCard,
    botCard: { ...emptyCard },
    potentialScores: { Threes: 9, Chance: 15 },
    dice: [3, 3, 3, 5, 1],
    throwsLeft: 1,
    round: 7,
    playerUpperSum: 0,
    botUpperSum: 0,
    playerTotal: 0,
    botTotal: 0,
  };

  const post = (message: InboundMessage) => window.postMessage(message, "*");
  window.__yatzy_dev = {
    showMenu: () => post({ type: "REQUEST_MENU", requestId: crypto.randomUUID() }),
    showReroll: () => post({ type: "REQUEST_REROLL", requestId: crypto.randomUUID(), data: board }),
    showCategory: () => post({
      type: "REQUEST_CATEGORY",
      requestId: crypto.randomUUID(),
      data: { board, available: ["Ones", "Threes", "Chance"] },
    }),
  };
}
