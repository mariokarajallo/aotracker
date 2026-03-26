"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import type { Order, OrderItem, OrderStatus } from "@/types/order";

const COLLECTION = "orders";

export async function createOrderAction(
  data: Pick<Order, "customerId" | "customerName"> & { items: OrderItem[]; notes?: string }
): Promise<string> {
  const totalDelivered = data.items.reduce((acc, i) => acc + i.deliveredQty, 0);
  const totalDue = data.items.reduce((acc, i) => acc + i.subtotal, 0);

  const ref = await adminDb.collection(COLLECTION).add({
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
    createdAt: new Date(),
    settledAt: null,
  });
  revalidatePath("/orders");
  return ref.id;
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
    settledAt: new Date(),
  });
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath(`/orders/${id}/receipt`);
}
