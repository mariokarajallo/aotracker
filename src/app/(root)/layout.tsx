import { NavSidebar } from "@/components/nav-sidebar";
import { FirebaseAuthProvider } from "@/components/firebase-auth-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
