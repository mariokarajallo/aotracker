import { create } from "zustand";
import type { OrderItem } from "@/types/order";

interface ScanningStore {
  items: OrderItem[];
  penalty: number;
  addReturn: (item: OrderItem) => void;
  updateReturnQty: (productId: string, qty: number) => void;
  setPenalty: (penalty: number) => void;
  reset: () => void;
  // computed
  totalDue: () => number;
  grandTotal: () => number;
}

export const useScanningStore = create<ScanningStore>((set, get) => ({
  items: [],
  penalty: 0,

  addReturn: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === item.productId
              ? {
                  ...i,
                  returnedQty: i.returnedQty + 1,
                  soldQty: i.deliveredQty - (i.returnedQty + 1),
                  subtotal: (i.deliveredQty - (i.returnedQty + 1)) * i.salePrice,
                }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  updateReturnQty: (productId, qty) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId
          ? {
              ...i,
              returnedQty: qty,
              soldQty: i.deliveredQty - qty,
              subtotal: (i.deliveredQty - qty) * i.salePrice,
            }
          : i
      ),
    })),

  setPenalty: (penalty) => set({ penalty }),

  reset: () => set({ items: [], penalty: 0 }),

  totalDue: () => get().items.reduce((acc, i) => acc + i.subtotal, 0),

  grandTotal: () => get().totalDue() + get().penalty,
}));
