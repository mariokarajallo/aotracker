import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function parsePrivateKey(raw: string | undefined): string {
  if (!raw) throw new Error("ADMIN_PRIVATE_KEY is not set");
  let key = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
  key = key.replace(/\\n/g, "\n");
  return key;
}

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.ADMIN_CLIENT_EMAIL,
      privateKey: parsePrivateKey(process.env.ADMIN_PRIVATE_KEY),
    }),
  });
}

function makeLazyProxy<T extends object>(getService: () => T): T {
  return new Proxy({} as T, {
    get(_, prop: string | symbol) {
      const service = getService();
      const value = Reflect.get(service, prop);
      if (typeof value === "function") return value.bind(service);
      return value;
    },
  });
}

export const adminAuth: Auth = makeLazyProxy(() => getAuth(getAdminApp()));
export const adminDb: Firestore = makeLazyProxy(() =>
  getFirestore(getAdminApp())
);
