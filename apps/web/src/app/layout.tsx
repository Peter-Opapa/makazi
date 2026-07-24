import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Schibsted_Grotesk, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ClerkTokenBridge } from "@/components/providers/clerk-token-bridge";
import "./globals.css";

const fontDisplay = Schibsted_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

const fontBody = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Makazi — Rent, sorted.",
  description: "Property management for Kenyan landlords, caretakers and tenants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body">
        <ClerkProvider>
          <ClerkTokenBridge />
          {children}
          <Toaster position="bottom-center" />
        </ClerkProvider>
      </body>
    </html>
  );
}
