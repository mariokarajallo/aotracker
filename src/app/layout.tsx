import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "aotracker",
  description: "Sistema de liquidación de mercaderías",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={esES}
      allowedRedirectOrigins={
        process.env.NEXT_PUBLIC_NGROK_URL
          ? [process.env.NEXT_PUBLIC_NGROK_URL]
          : []
      }
    >
      <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
        <body className="min-h-full flex flex-col">
          {children}
          <Toaster richColors position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
