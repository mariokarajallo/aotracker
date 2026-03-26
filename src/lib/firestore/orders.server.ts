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

export async function getOrderByIdServer(id: string): Promise<Order | null> {
  const snapshot = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snapshot.exists) return null;
  return mapOrder(snapshot.id, snapshot.data()!);
}

export async function getOrdersServer(): Promise<Order[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => mapOrder(doc.id, doc.data()));
}

export async function getOrdersByCustomerServer(customerId: string): Promise<Order[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where("customerId", "==", customerId)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map((doc) => mapOrder(doc.id, doc.data()));
}
