import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function parsePrivateKey(raw: string | undefined): string {
  if (!raw) throw new Error("FIREBASE_PRIVATE_KEY is not set");
  // Strip surrounding JSON quotes if present (e.g. pasted from service account JSON)
  let key = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
  // Replace literal \n sequences with real newlines
  key = key.replace(/\\n/g, "\n");
  return key;
}

const adminApp =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        }),
      })
    : getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
