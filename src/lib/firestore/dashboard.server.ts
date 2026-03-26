import { adminDb } from "@/lib/firebase-admin";
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
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday
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
  settledAt: Date | null;
}

export interface InTheStreet {
  orderId: string;
  customerName: string;
  customerId: string;
  totalDelivered: number;
  totalDue: number;
  createdAt: Date | null;
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

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOf(now, "day");
  const weekStart = startOf(now, "week");
  const monthStart = startOf(now, "month");

  // Fetch all settled orders from start of month (for income metrics + top products)
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

  // Income summaries
  function summarize(orders: Order[], from: Date): IncomeSummary {
    const filtered = orders.filter(
      (o) => o.settledAt && o.settledAt >= from
    );
    return {
      total: filtered.reduce((acc, o) => acc + o.amountPaid, 0),
      count: filtered.length,
    };
  }

  const today = summarize(settledOrders, todayStart);
  const week = summarize(settledOrders, weekStart);
  const month = summarize(settledOrders, monthStart);

  // Pending balances
  const pendingBalances: PendingBalance[] = pendingSnap.docs.map((d) => {
    const data = d.data();
    return {
      orderId: d.id,
      customerName: data.customerName,
      customerId: data.customerId,
      balance: data.balance,
      settledAt: data.settledAt?.toDate() ?? null,
    };
  });

  // In the street
  const inTheStreet: InTheStreet[] = streetSnap.docs.map((d) => {
    const data = d.data();
    return {
      orderId: d.id,
      customerName: data.customerName,
      customerId: data.customerId,
      totalDelivered: data.totalDelivered,
      totalDue: data.totalDue,
      createdAt: data.createdAt?.toDate() ?? null,
    };
  });

  // Top products this month
  const productMap = new Map<string, TopProduct>();
  for (const order of settledOrders) {
    for (const item of order.items) {
      if (item.soldQty === 0) continue;
      const key = item.code;
      const existing = productMap.get(key);
      if (existing) {
        existing.totalSold += item.soldQty;
      } else {
        productMap.set(key, {
          code: item.code,
          description: item.description,
          ...(item.size ? { size: item.size } : {}),
          totalSold: item.soldQty,
        });
      }
    }
  }
  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  return { today, week, month, pendingBalances, inTheStreet, topProducts };
}
