"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/lib/firestore/products";
import { useIsFirebaseReady } from "@/contexts/firebase-auth.context";
import type { Product } from "@/types/product";

export function useProducts(initialData?: Product[]) {
  const isFirebaseReady = useIsFirebaseReady();
  const [products, setProducts] = useState<Product[]>(initialData ?? []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;
    if (!isFirebaseReady) return;
    getProducts()
      .then(setProducts)
      .catch(() => setError("No se pudo cargar el catálogo"))
      .finally(() => setLoading(false));
  }, [isFirebaseReady, initialData]);

  return { products, setProducts, loading, error };
}
