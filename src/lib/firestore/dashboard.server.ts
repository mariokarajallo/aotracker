import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { TAGS } from "@/lib/cache/tags";
import type { Order } from "@/types/order";

const COLLECTION = "orders";

function mapOrder(id: string, data: FirebaseFirestore.DocumentData): Order {
  return {
    id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    settledAt: data.settledAt?.toDate(),
  } as Order;
}

function startOf(date: Date, unit: "day" | "week" | "month"): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (unit === "week") {
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  } else if (unit === "month") {
    d.setDate(1);
  }
  return d;
}

export interface IncomeSummary {
  total: number;
  count: number;
}

export interface PendingBalance {
  orderId: string;
  customerName: string;
  customerId: string;
  balance: number;
  settledAt: string | null; // ISO string — safe for cache serialisation
}

export interface InTheStreet {
  orderId: string;
  customerName: string;
  customerId: string;
  totalDelivered: number;
  totalDue: number;
  createdAt: string | null; // ISO string — safe for cache serialisation
}

export interface TopProduct {
  code: string;
  description: string;
  size?: string;
  totalSold: number;
}

export interface DashboardData {
  today: IncomeSummary;
  week: IncomeSummary;
  month: IncomeSummary;
  pendingBalances: PendingBalance[];
  inTheStreet: InTheStreet[];
  topProducts: TopProduct[];
}

async function _getDashboardDataRaw(): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOf(now, "day");
  const weekStart = startOf(now, "week");
  const monthStart = startOf(now, "month");

  const [settledSnap, pendingSnap, streetSnap] = await Promise.all([
    adminDb
      .collection(COLLECTION)
      .where("settledAt", ">=", monthStart)
      .where("status", "in", ["settled_zero_balance", "settled_pending_balance"])
      .get(),
    adminDb
      .collection(COLLECTION)
      .where("status", "==", "settled_pending_balance")
      .orderBy("settledAt", "desc")
      .get(),
    adminDb
      .collection(COLLECTION)
      .where("status", "==", "pending_settlement")
      .orderBy("createdAt", "desc")
      .get(),
  ]);

  const settledOrders = settledSnap.docs.map((d) => mapOrder(d.id, d.data()));

  function summarize(orders: Order[], from: Date): IncomeSummary {
    const filtered = orders.filter((o) => o.settledAt && o.settledAt >= from);
    return {
      total: filtered.reduce((acc, o) => acc + o.amountPaid, 0),
      count: filtered.length,
    };
  }

  const pendingBalances: PendingBalance[] = pendingSnap.docs.map((d) => {
    const data = d.data();
    return {
      orderId: d.id,
      customerName: data.customerName,
      customerId: data.customerId,
      balance: data.balance,
      settledAt: data.settledAt?.toDate().toISOString() ?? null,
    };
  });

  const inTheStreet: InTheStreet[] = streetSnap.docs.map((d) => {
    const data = d.data();
    return {
      orderId: d.id,
      customerName: data.customerName,
      customerId: data.customerId,
      totalDelivered: data.totalDelivered,
      totalDue: data.totalDue,
      createdAt: data.createdAt?.toDate().toISOString() ?? null,
    };
  });

  const productMap = new Map<string, TopProduct>();
  for (const order of settledOrders) {
    for (const item of order.items) {
      if (item.soldQty === 0) continue;
      const existing = productMap.get(item.code);
      if (existing) {
        existing.totalSold += item.soldQty;
      } else {
        productMap.set(item.code, {
          code: item.code,
          description: item.description,
          ...(item.size ? { size: item.size } : {}),
          totalSold: item.soldQty,
        });
      }
    }
  }

  return {
    today: summarize(settledOrders, todayStart),
    week: summarize(settledOrders, weekStart),
    month: summarize(settledOrders, monthStart),
    pendingBalances,
    inTheStreet,
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5),
  };
}

// Revalidate every 60 s as safety net; actions call revalidateTag on mutations.
export const getDashboardData = unstable_cache(
  _getDashboardDataRaw,
  [TAGS.DASHBOARD],
  { tags: [TAGS.DASHBOARD], revalidate: 60 }
);
