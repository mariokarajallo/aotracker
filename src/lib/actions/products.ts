"use server";

import { adminDb } from "@/lib/firebase-admin";
import { updateTag } from "next/cache";
import { TAGS } from "@/lib/cache/tags";
import type { ProductFormValues } from "@/features/catalog/schemas/product.schema";

const COLLECTION = "products";

function calculateMargin(costPrice: number, salePrice: number): number {
  return ((salePrice - costPrice) / costPrice) * 100;
}

export async function createProductAction(data: ProductFormValues): Promise<string> {
  const ref = await adminDb.collection(COLLECTION).add({
    code: data.code,
    description: data.description,
    ...(data.brand ? { brand: data.brand } : {}),
    ...(data.size ? { size: data.size } : {}),
    costPrice: data.costPrice,
    salePrice: data.salePrice,
    margin: calculateMargin(data.costPrice, data.salePrice),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  updateTag(TAGS.PRODUCTS);
  return ref.id;
}

export async function updateProductAction(id: string, data: ProductFormValues): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).update({
    code: data.code,
    description: data.description,
    brand: data.brand ?? "",
    ...(data.size ? { size: data.size } : { size: "" }),
    costPrice: data.costPrice,
    salePrice: data.salePrice,
    margin: calculateMargin(data.costPrice, data.salePrice),
    updatedAt: new Date(),
  });
  updateTag(TAGS.PRODUCTS);
}

export async function deleteProductAction(id: string): Promise<void> {
  await adminDb.collection(COLLECTION).doc(id).delete();
  updateTag(TAGS.PRODUCTS);
}
