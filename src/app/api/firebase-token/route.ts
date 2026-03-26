import { auth } from "@clerk/nextjs/server";
import { adminAuth } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const firebaseToken = await adminAuth.createCustomToken(userId);
  return NextResponse.json({ token: firebaseToken });
}
