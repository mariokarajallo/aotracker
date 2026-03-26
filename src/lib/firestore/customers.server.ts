import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { TAGS } from "@/lib/cache/tags";
import type { Customer } from "@/types/customer";

const COLLECTION = "customers";

// ─── Raw (uncached) ──────────────────────────────────────────────────────────

async function _getCustomersRaw(): Promise<Customer[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: data.createdAt?.toDate() } as Customer;
  });
}

async function _getActiveCustomersRaw(): Promise<Customer[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, ...data, createdAt: data.createdAt?.toDate() } as Customer;
  });
}

// ─── Cached ──────────────────────────────────────────────────────────────────
// unstable_cache serialises via JSON → Date fields become ISO strings at cache
// read time. Client components re-fetch via Firebase SDK so this is transparent.

export const getCustomersServer = unstable_cache(
  _getCustomersRaw,
  [TAGS.CUSTOMERS],
  { tags: [TAGS.CUSTOMERS] }
);

export const getActiveCustomersServer = unstable_cache(
  _getActiveCustomersRaw,
  [`${TAGS.CUSTOMERS}-active`],
  { tags: [TAGS.CUSTOMERS] }
);

// ─── Uncached (detail pages — always fresh) ──────────────────────────────────

export async function getCustomerByIdServer(id: string): Promise<Customer | null> {
  const ref = adminDb.collection(COLLECTION).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const data = snapshot.data()!;
  return { id: snapshot.id, ...data, createdAt: data.createdAt?.toDate() } as Customer;
}
