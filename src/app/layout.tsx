import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReceiptProvider } from "@/contexts/ReceiptContext";
import Image from "next/image";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Receiptly - Receipt Scanner",
  description: "Scan and process your receipts with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center p-8  gap-8  font-[family-name:var(--font-geist-sans)]">
            <div className="w-full max-w-2xl">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Receiptly</h1>
                <Image
                  className="dark:invert"
                  src="/next.svg"
                  alt="Next.js logo"
                  width={80}
                  height={20}
                  priority
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Scan and process your receipts with ease
              </p>
            </div>
            </header>
        <ReceiptProvider>
          {children}
        </ReceiptProvider>
      </body>
      
    </html>
  );
}