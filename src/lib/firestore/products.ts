import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product } from "@/types/product";

const COLLECTION = "products";

function calculateMargin(costPrice: number, salePrice: number): number {
  return ((salePrice - costPrice) / costPrice) * 100;
}

export async function getProducts(): Promise<Product[]> {
  const q = query(collection(db, COLLECTION), orderBy("description", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
    updatedAt: snapshot.data().updatedAt?.toDate(),
  } as Product;
}

export async function getProductByCode(code: string): Promise<Product | null> {
  const q = query(collection(db, COLLECTION), where("code", "==", code));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  } as Product;
}

export async function createProduct(
  data: Omit<Product, "id" | "margin" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    margin: calculateMargin(data.costPrice, data.salePrice),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.costPrice !== undefined || data.salePrice !== undefined) {
    const current = await getProductById(id);
    const costPrice = data.costPrice ?? current?.costPrice ?? 0;
    const salePrice = data.salePrice ?? current?.salePrice ?? 0;
    updates.margin = calculateMargin(costPrice, salePrice);
  }
  await updateDoc(ref, updates);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
