import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { NavSidebar } from "@/components/nav-sidebar";
import { FirebaseAuthProvider } from "@/components/firebase-auth-provider";

const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (allowedEmails.length > 0) {
    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (!primaryEmail || !allowedEmails.includes(primaryEmail)) {
      redirect("/unauthorized");
    }
  }

  return (
    <FirebaseAuthProvider>
      <div className="flex flex-col md:flex-row min-h-screen">
        <NavSidebar />
        <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
          {children}
        </div>
      </div>
    </FirebaseAuthProvider>
  );
}
