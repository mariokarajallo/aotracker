"use client";

import { useState, useEffect } from "react";
import { getCustomerById } from "@/lib/firestore/customers";
import { useIsFirebaseReady } from "@/contexts/firebase-auth.context";
import type { Customer } from "@/types/customer";

export function useCustomer(id: string) {
  const isFirebaseReady = useIsFirebaseReady();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseReady) return;
    getCustomerById(id)
      .then(setCustomer)
      .catch(() => setError("No se pudo cargar la clienta"))
      .finally(() => setLoading(false));
  }, [id, isFirebaseReady]);

  return { customer, loading, error };
}
