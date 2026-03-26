"use server";

import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import type { CustomerFormValues } from "@/features/customers/schemas/customer.schema";

const COLLECTION = "customers";

export async function createCustomerAction(data: CustomerFormValues): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    name: data.name,
    whatsapp: data.whatsapp,
    ...(data.nationalId && { nationalId: data.nationalId }),
    ...(data.address && { address: data.address }),
    ...(data.notes && { notes: data.notes }),
    status: "active",
    createdAt: new Date(),
  });
  revalidatePath("/customers");
  return ref.id;
}

export async function updateCustomerAction(
  id: string,
  data: CustomerFormValues
): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({
    name: data.name,
    whatsapp: data.whatsapp,
    nationalId: data.nationalId ?? "",
    address: data.address ?? "",
    notes: data.notes ?? "",
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}

export async function deactivateCustomerAction(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({ status: "inactive" });
  revalidatePath("/customers");
}
