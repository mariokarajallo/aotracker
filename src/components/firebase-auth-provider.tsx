"use client";

import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { FirebaseAuthContext } from "@/contexts/firebase-auth.context";

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const { isFirebaseReady } = useFirebaseAuth();
  return (
    <FirebaseAuthContext.Provider value={isFirebaseReady}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}
