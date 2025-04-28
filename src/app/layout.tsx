import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import StoreProvider from "@/lib/store/StoreProvider";
import QueryProvider from "@/lib/react-query";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FinB Chat Interface",
  description: "A chat interface based on FinB AI using Next.js and shadcn",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <StoreProvider>
        <html lang="en">
          {/* <Toaster position="top-right" /> */}
          <body className={`${inter.className} antialiased`}>{children}</body>
        </html>
      </StoreProvider>
    </QueryProvider>
  );
}
