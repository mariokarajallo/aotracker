import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { TAGS } from "@/lib/cache/tags";
import type { Product } from "@/types/product";

const COLLECTION = "products";

// ─── Raw (uncached) ──────────────────────────────────────────────────────────

async function _getProductsRaw(): Promise<Product[]> {
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

async function _getProductBrandsRaw(): Promise<string[]> {
  const snapshot = await adminDb.collection(COLLECTION).select("brand").get();
  const brands = new Set<string>();
  snapshot.docs.forEach((doc) => {
    const brand = doc.get("brand");
    if (brand && typeof brand === "string") brands.add(brand);
  });
  return Array.from(brands).sort();
}

// ─── Cached ──────────────────────────────────────────────────────────────────

export const getProductsServer = unstable_cache(
  _getProductsRaw,
  [TAGS.PRODUCTS],
  { tags: [TAGS.PRODUCTS] }
);

export const getProductBrandsServer = unstable_cache(
  _getProductBrandsRaw,
  [`${TAGS.PRODUCTS}-brands`],
  { tags: [TAGS.PRODUCTS] }
);

// ─── Uncached (detail pages — always fresh) ──────────────────────────────────

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
