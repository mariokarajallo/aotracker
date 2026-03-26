"use client";

import { createContext, useContext } from "react";

export const FirebaseAuthContext = createContext(false);

export function useIsFirebaseReady() {
  return useContext(FirebaseAuthContext);
}
