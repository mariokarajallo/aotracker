import { adminDb } from "@/lib/firebase-admin";
import type { Product } from "@/types/product";

const COLLECTION = "products";

export async function getProductsServer(): Promise<Product[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .orderBy("description", "asc")
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Product;
  });
}

export async function getProductBrandsServer(): Promise<string[]> {
  const snapshot = await adminDb.collection(COLLECTION).select("brand").get();
  const brands = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const brand = doc.get("brand");
    if (brand && typeof brand === "string") brands.add(brand);
  });
  return Array.from(brands).sort();
}

export async function getProductByIdServer(id: string): Promise<Product | null> {
  const ref = adminDb.collection(COLLECTION).doc(id);
  const snapshot = await ref.get();
  if (!snapshot.exists) return null;
  const data = snapshot.data()!;
  return {
    id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate(),
    updatedAt: data.updatedAt?.toDate(),
  } as Product;
}
