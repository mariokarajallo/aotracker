import { create } from "zustand";
import type { OrderItem } from "@/types/order";

interface ScanningStore {
  items: OrderItem[];
  penalty: number;
  amountPaid: number;
  initializeFromOrder: (items: OrderItem[]) => void;
  addReturn: (productId: string) => void;
  updateReturnQty: (productId: string, qty: number) => void;
  setPenalty: (penalty: number) => void;
  setAmountPaid: (amount: number) => void;
  reset: () => void;
  // computed
  totalDue: () => number;
  grandTotal: () => number;
  balance: () => number;
}

export const useScanningStore = create<ScanningStore>((set, get) => ({
  items: [],
  penalty: 0,
  amountPaid: 0,

  initializeFromOrder: (items) =>
    set({
      items: items.map((i) => ({
        ...i,
        returnedQty: 0,
        soldQty: i.deliveredQty,
        subtotal: i.deliveredQty * i.salePrice,
      })),
      penalty: 0,
      amountPaid: 0,
    }),

  addReturn: (productId) =>
    set((state) => ({
      items: state.items.map((i) => {
        if (i.productId !== productId) return i;
        const returnedQty = Math.min(i.returnedQty + 1, i.deliveredQty);
        const soldQty = i.deliveredQty - returnedQty;
        return { ...i, returnedQty, soldQty, subtotal: soldQty * i.salePrice };
      }),
    })),

  updateReturnQty: (productId, qty) =>
    set((state) => ({
      items: state.items.map((i) => {
        if (i.productId !== productId) return i;
        const returnedQty = Math.min(Math.max(0, qty), i.deliveredQty);
        const soldQty = i.deliveredQty - returnedQty;
        return { ...i, returnedQty, soldQty, subtotal: soldQty * i.salePrice };
      }),
    })),

  setPenalty: (penalty) => set({ penalty }),

  setAmountPaid: (amountPaid) => set({ amountPaid }),

  reset: () => set({ items: [], penalty: 0, amountPaid: 0 }),

  totalDue: () => get().items.reduce((acc, i) => acc + i.subtotal, 0),

  grandTotal: () => get().totalDue() + get().penalty,

  balance: () => Math.max(0, get().grandTotal() - get().amountPaid),
}));
