import { AnimatePresence, motion } from "motion/react";
import { sendToHost } from "./bridge";
import { useGameStore } from "./store/gameStore";
import { MainMenu } from "./components/MainMenu";
import { RerollScreen, CategoryScreen, BotResultScreen } from "./components/GameScreens";
import { FinalScreen } from "./components/FinalScreen";

function Topbar() {
  const view = useGameStore(s => s.view);
  const isMaximized = useGameStore(s => s.isMaximized);

  const isInGame = view.screen !== "menu" && view.screen !== "final" && view.screen !== "wait";
  const round = isInGame && "data" in view && view.data
    ? view.data.round
    : null;

  const handleMinimize = () => {
    sendToHost({ type: "WINDOW_MINIMIZE" });
  };

  const handleMaximize = () => {
    sendToHost({ type: "WINDOW_MAXIMIZE" });
  };

  const handleClose = () => {
    sendToHost({ type: "WINDOW_CLOSE" });
  };

  return (
    <div className="topbar">
      <div className="topbar__left">
        <span className="topbar__title">Яцы</span>
        <div className="topbar__badge">
          {isInGame && round != null && (
            <>
              <span>Раунд {round}/13</span>
              <span style={{ margin: "0 4px", opacity: 0.3 }}>·</span>
            </>
          )}
          <div className="topbar__dot" />
          <span>Активна</span>
        </div>
      </div>
      
      <div className="topbar__controls">
        <button 
          className="topbar__btn" 
          onClick={handleMinimize} 
          title="Свернуть"
        >
          <svg width="10" height="1" viewBox="0 0 10 1" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="0" y1="0.5" x2="10" y2="0.5" />
          </svg>
        </button>
        <button 
          className="topbar__btn" 
          onClick={handleMaximize} 
          title={isMaximized ? "Восстановить" : "Развернуть"}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 1.5h5.5v5.5M1.5 3h5.5v5.5h-5.5z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1.5" y="1.5" width="7" height="7" />
            </svg>
          )}
        </button>
        <button 
          className="topbar__btn topbar__btn--close" 
          onClick={handleClose} 
          title="Закрыть"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M1 1L9 9M9 1L1 9" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function WaitBar({ prompt, onConfirm }: { prompt: string; onConfirm: () => void }) {
  return (
    <motion.div
      className="wait-bar"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.16,1,0.3,1] }}
    >
      <span className="wait-bar__text">{prompt || "Нажмите Enter для продолжения"}</span>
      <button className="btn btn--ghost" style={{ padding: "6px 16px", fontSize: 12 }} onClick={onConfirm}>
        Продолжить
      </button>
    </motion.div>
  );
}

function ScreenRouter() {
  const view = useGameStore(s => s.view);

  
  const baseView = view.screen === "wait" && view.prevScreen ? view.prevScreen : view;

  const renderScreen = () => {
    switch (baseView.screen) {
      case "menu":
        return (
          <motion.div key="menu" style={{ position: "absolute", inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <MainMenu requestId={baseView.requestId} />
          </motion.div>
        );

      case "reroll":
        return (
          <motion.div key="reroll" style={{ position: "absolute", inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <RerollScreen data={baseView.data} requestId={baseView.requestId} />
          </motion.div>
        );

      case "category":
        return (
          <motion.div key="category" style={{ position: "absolute", inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <CategoryScreen data={baseView.data} available={baseView.available} requestId={baseView.requestId} />
          </motion.div>
        );

      case "bot_result":
        return (
          <motion.div key="bot_result" style={{ position: "absolute", inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <BotResultScreen data={baseView.data} result={baseView.result} requestId={baseView.requestId} />
          </motion.div>
        );

      case "final":
        return (
          <motion.div key="final" style={{ position: "absolute", inset: 0 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <FinalScreen data={baseView.data} requestId={baseView.requestId} />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="main" style={{ position: "relative" }}>
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>

      {}
      <AnimatePresence>
        {view.screen === "wait" && (
          <WaitBar
            key="wait"
            prompt={view.prompt}
            onConfirm={() => {
              useGameStore.getState().setScreen(view.prevScreen);
              sendToHost({ type: "INPUT_CONFIRMED", requestId: view.requestId, data: null });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <Topbar />
      <ScreenRouter />
    </div>
  );
}
