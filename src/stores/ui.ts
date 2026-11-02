import { create } from 'zustand';

type UiState = {
  drawerOpen: boolean;
  openingVisible: boolean;
  openingForceFull: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  replayOpening: () => void;
  finishOpening: () => void;
};

/**
 * Chrome state is intentionally not persisted: a drawer should never reopen
 * by itself on the next launch.
 */
export const useUiStore = create<UiState>((set) => ({
  drawerOpen: false,
  openingVisible: true,
  openingForceFull: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
  toggleDrawer: () => set((state) => ({ drawerOpen: !state.drawerOpen })),
  replayOpening: () => set({ openingVisible: true, openingForceFull: true }),
  finishOpening: () => set({ openingVisible: false, openingForceFull: false }),
}));
