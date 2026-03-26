"use client";

import { useState, useEffect } from "react";
import { getOrders } from "@/lib/firestore/orders";
import { useIsFirebaseReady } from "@/contexts/firebase-auth.context";
import type { Order } from "@/types/order";

export function useOrders(initialData?: Order[]) {
  const isFirebaseReady = useIsFirebaseReady();
  const [orders, setOrders] = useState<Order[]>(initialData ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) return;
    getOrders()
      .then(setOrders)
      .catch(() => setError("No se pudieron cargar las notas"))
      .finally(() => setLoading(false));
  }, [isFirebaseReady]);

  return { orders, loading, error };
}
