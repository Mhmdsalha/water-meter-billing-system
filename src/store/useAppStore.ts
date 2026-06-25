"use client";

import { create } from "zustand";

interface AppState {
  currentCycleId: number | null;
  pendingSyncCount: number;
  isOnline: boolean;
  setCurrentCycleId: (cycleId: number | null) => void;
  setPendingSyncCount: (count: number) => void;
  setIsOnline: (isOnline: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentCycleId: null,
  pendingSyncCount: 0,
  isOnline: true,
  setCurrentCycleId: (currentCycleId) => set({ currentCycleId }),
  setPendingSyncCount: (pendingSyncCount) => set({ pendingSyncCount }),
  setIsOnline: (isOnline) => set({ isOnline })
}));
