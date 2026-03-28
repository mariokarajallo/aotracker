"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache/tags";
import type { Order, OrderItem, OrderStatus, PaymentRecord } from "@/types/order";

const COLLECTION = "orders";
const COUNTER_REF = () => adminDb.collection("counters").doc("orders");

export async function createOrderAction(
  data: Pick<Order, "customerId" | "customerName"> & { items: OrderItem[]; notes?: string }
): Promise<string> {
  const totalDelivered = data.items.reduce((acc, i) => acc + i.deliveredQty, 0);
  const totalDue = data.items.reduce((acc, i) => acc + i.subtotal, 0);

  let orderId = "";

  await adminDb.runTransaction(async (tx) => {
    const counterSnap = await tx.get(COUNTER_REF());
    const orderNumber = (counterSnap.data()?.lastNumber ?? 0) + 1;

    const orderRef = adminDb.collection(COLLECTION).doc();
    orderId = orderRef.id;

    tx.set(COUNTER_REF(), { lastNumber: orderNumber }, { merge: true });
    tx.set(orderRef, {
      orderNumber,
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
      payments: [],
      createdAt: new Date(),
      settledAt: null,
    });
  });

  updateTag(TAGS.ORDERS);
  updateTag(TAGS.DASHBOARD);
  return orderId;
}

export async function updateOrderStatusAction(
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

  // Record first payment if clienta paid something at settlement
  const firstPayment: PaymentRecord[] =
    settlementData.amountPaid > 0
      ? [{ amount: settlementData.amountPaid, date: new Date().toISOString() }]
      : [];

  await adminDb.collection(COLLECTION).doc(id).update({
    status,
    items: settlementData.items,
    totalReturned,
    totalSold,
    totalDue,
    penalty: settlementData.penalty,
    grandTotal,
    amountPaid: settlementData.amountPaid,
    balance,
    payments: firstPayment,
    settledAt: new Date(),
  });

  updateTag(TAGS.ORDERS);
  updateTag(TAGS.DASHBOARD);
}

export async function recordPaymentAction(id: string, amount: number): Promise<void> {
  const snap = await adminDb.collection(COLLECTION).doc(id).get();
  if (!snap.exists) throw new Error("Nota no encontrada");
  const data = snap.data()!;
  const newAmountPaid = data.amountPaid + amount;
  const newBalance = Math.max(0, data.grandTotal - newAmountPaid);
  const newStatus: OrderStatus =
    newBalance === 0 ? "settled_zero_balance" : "settled_pending_balance";

  const payment: PaymentRecord = { amount, date: new Date().toISOString() };

  await adminDb.collection(COLLECTION).doc(id).update({
    amountPaid: newAmountPaid,
    balance: newBalance,
    status: newStatus,
    payments: FieldValue.arrayUnion(payment),
  });

  updateTag(TAGS.ORDERS);
  updateTag(TAGS.DASHBOARD);
}
