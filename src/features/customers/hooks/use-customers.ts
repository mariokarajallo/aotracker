"use client";

import { useState, useEffect } from "react";
import { getCustomers } from "@/lib/firestore/customers";
import { useIsFirebaseReady } from "@/contexts/firebase-auth.context";
import type { Customer } from "@/types/customer";

export function useCustomers(initialData?: Customer[]) {
  const isFirebaseReady = useIsFirebaseReady();
  const [customers, setCustomers] = useState<Customer[]>(initialData ?? []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) return;
    getCustomers()
      .then(setCustomers)
      .catch(() => setError("No se pudieron cargar las clientas"))
      .finally(() => setLoading(false));
  }, [isFirebaseReady]);

  return { customers, setCustomers, loading, error };
}
