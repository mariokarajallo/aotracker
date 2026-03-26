import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderItem, OrderStatus } from "@/types/order";

const COLLECTION = "orders";

export async function getOrders(): Promise<Order[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    settledAt: doc.data().settledAt?.toDate(),
  })) as Order[];
}

export async function getOrdersByCustomer(customerId: string): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTION),
    where("customerId", "==", customerId),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    settledAt: doc.data().settledAt?.toDate(),
  })) as Order[];
}

export async function getPendingOrderByCustomer(customerId: string): Promise<Order | null> {
  const q = query(
    collection(db, COLLECTION),
    where("customerId", "==", customerId),
    where("status", "==", "pending_settlement")
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    settledAt: doc.data().settledAt?.toDate(),
  } as Order;
}

export async function getOrderById(id: string): Promise<Order | null> {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    settledAt: snapshot.data().settledAt?.toDate(),
  } as Order;
}

export async function createOrder(
  data: Pick<Order, "customerId" | "customerName"> & { items: OrderItem[]; notes?: string }
): Promise<string> {
  const totalDelivered = data.items.reduce((acc, i) => acc + i.deliveredQty, 0);
  const totalDue = data.items.reduce((acc, i) => acc + i.subtotal, 0);

  const ref = await addDoc(collection(db, COLLECTION), {
    customerId: data.customerId,
    customerName: data.customerName,
    ...(data.notes ? { notes: data.notes } : {}),
    items: data.items,
    status: "pending_settlement" as OrderStatus,
    totalDelivered,
    totalReturned: 0,
    totalSold: totalDelivered,
    totalDue,
    penalty: 0,
    grandTotal: totalDue,
    amountPaid: 0,
    balance: totalDue,
    createdAt: serverTimestamp(),
    settledAt: null,
  });
  return ref.id;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  settlementData: {
    items: OrderItem[];
    penalty: number;
    amountPaid: number;
  }
): Promise<void> {
  const totalReturned = settlementData.items.reduce((acc, i) => acc + i.returnedQty, 0);
  const totalSold = settlementData.items.reduce((acc, i) => acc + i.soldQty, 0);
  const totalDue = settlementData.items.reduce((acc, i) => acc + i.subtotal, 0);
  const grandTotal = totalDue + settlementData.penalty;
  const balance = grandTotal - settlementData.amountPaid;

  await updateDoc(doc(db, COLLECTION, id), {
    status,
    items: settlementData.items,
    totalReturned,
    totalSold,
    totalDue,
    penalty: settlementData.penalty,
    grandTotal,
    amountPaid: settlementData.amountPaid,
    balance,
    settledAt: serverTimestamp(),
  });
}
