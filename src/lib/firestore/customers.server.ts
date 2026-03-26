import { adminDb } from "@/lib/firebase-admin";
import type { Customer } from "@/types/customer";

const COLLECTION = "customers";

export async function getCustomerByIdServer(id: string): Promise<Customer | null> {
  const ref = adminDb.collection(COLLECTION).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const data = snapshot.data()!;
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
  } as Customer;
}

export async function getCustomersServer(): Promise<Customer[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Customer;
  });
}

export async function getActiveCustomersServer(): Promise<Customer[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
    } as Customer;
  });
}
