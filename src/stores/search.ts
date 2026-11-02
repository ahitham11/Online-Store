import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/storage';

const MAX_RECENT = 8;

type SearchState = {
  recent: string[];
  addRecent: (term: string) => void;
  clearRecent: () => void;
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      recent: [],
      addRecent: (term) =>
        set((state) => {
          const clean = term.trim();
          if (!clean) return state;
          const next = [clean, ...state.recent.filter((item) => item !== clean)].slice(0, MAX_RECENT);
          return { recent: next };
        }),
      clearRecent: () => set({ recent: [] }),
    }),
    {
      name: 'velvety.search.v1',
      storage: createJSONStorage(() => mmkvStorage as StateStorage),
      version: 1,
    },
  ),
);
