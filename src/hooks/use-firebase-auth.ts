"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useFirebaseAuth() {
  const { isSignedIn, isLoaded } = useAuth();
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    async function signIntoFirebase() {
      try {
        console.log("[Firebase] Fetching token...");
        const res = await fetch("/api/firebase-token");
        console.log("[Firebase] Token response status:", res.status);
        const body = await res.json();
        console.log("[Firebase] Token received:", !!body.token);
        await signInWithCustomToken(auth, body.token);
        console.log("[Firebase] Signed in successfully");
        setIsFirebaseReady(true);
      } catch (error) {
        console.error("[Firebase] Auth error:", error);
      }
    }

    signIntoFirebase();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsFirebaseReady(!!user);
    });

    return () => unsubscribe();
  }, [isSignedIn, isLoaded]);

  return { isFirebaseReady };
}
