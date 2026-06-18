import { create } from "zustand";
import type { ViewState } from "../types";

interface GameStore {
  view: ViewState;
  windowAnimationState: "visible" | "minimized" | "closed";
  isMaximized: boolean;
  setScreen: (v: ViewState) => void;
  setWindowAnimationState: (state: "visible" | "minimized" | "closed") => void;
  setIsMaximized: (maximized: boolean) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  view: { screen: "menu", requestId: "bootstrap" },
  windowAnimationState: "visible",
  isMaximized: false,

  setScreen: (v) => set({ view: v }),

  setWindowAnimationState: (state) => set({ windowAnimationState: state }),

  setIsMaximized: (maximized) => set({ isMaximized: maximized }),
}));
