import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Customer } from "@/types/customer";

const COLLECTION = "customers";

export async function getCustomers(): Promise<Customer[]> {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as Customer[];
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const ref = doc(db, COLLECTION, id);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return null;
  return {
    id: snapshot.id,
    ...snapshot.data(),
    createdAt: snapshot.data().createdAt?.toDate(),
  } as Customer;
}

export async function createCustomer(
  data: Omit<Customer, "id" | "createdAt" | "status">
): Promise<string> {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    status: "active",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCustomer(
  id: string,
  data: Partial<Omit<Customer, "id" | "createdAt">>
): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deactivateCustomer(id: string): Promise<void> {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { status: "inactive" });
}
