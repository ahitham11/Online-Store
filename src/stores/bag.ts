import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { mmkvStorage } from '@/lib/storage';

export type BagLine = {
  key: string;
  productId: string;
  sku: string;
  nameAr: string;
  nameEn: string;
  shadeNameAr?: string | null;
  shadeNameEn?: string | null;
  shadeHex?: string | null;
  size?: string | null;
  soldAs?: 'piece' | 'box' | 'set' | 'bundle';
  unitPriceEgp: number;
  quantity: number;
  imageUri?: string | null;
};

type BagState = {
  lines: BagLine[];
  addLine: (line: BagLine) => void;
  removeLine: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
};

export const useBagStore = create<BagState>()(
  persist(
    (set) => ({
      lines: [],
      addLine: (line) =>
        set((state) => {
          const existing = state.lines.find((item) => item.key === line.key);
          if (!existing) return { lines: [...state.lines, line] };
          return {
            lines: state.lines.map((item) =>
              item.key === line.key
                ? { ...item, quantity: item.quantity + line.quantity }
                : item,
            ),
          };
        }),
      removeLine: (key) => set((state) => ({ lines: state.lines.filter((line) => line.key !== key) })),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((line) => line.key !== key)
              : state.lines.map((line) => (line.key === key ? { ...line, quantity } : line)),
        })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: 'velvety.bag.v1',
      storage: createJSONStorage(() => mmkvStorage as StateStorage),
      version: 1,
    },
  ),
);

export const selectBagCount = (state: BagState) =>
  state.lines.reduce((total, line) => total + line.quantity, 0);

export const selectBagSubtotal = (state: BagState) =>
  state.lines.reduce((total, line) => total + line.quantity * line.unitPriceEgp, 0);
