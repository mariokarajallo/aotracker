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

// ─── Raw (uncached) ──────────────────────────────────────────────────────────

async function _getOrdersRaw(): Promise<Order[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => mapOrder(doc.id, doc.data()));
}

// ─── Cached ──────────────────────────────────────────────────────────────────

export const getOrdersServer = unstable_cache(
  _getOrdersRaw,
  [TAGS.ORDERS],
  { tags: [TAGS.ORDERS] }
);

// ─── Uncached (detail pages — always fresh) ──────────────────────────────────

export async function getOrderByIdServer(id: string): Promise<Order | null> {
  const snapshot = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snapshot.exists) return null;
  return mapOrder(snapshot.id, snapshot.data()!);
}

export async function getOrdersByCustomerServer(customerId: string): Promise<Order[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where("customerId", "==", customerId)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => mapOrder(doc.id, doc.data()));
}
