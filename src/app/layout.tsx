import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import Providers from "@/providers/Providers";
import { Toaster } from "@/components/ui/sonner";

const montserrat = Quicksand({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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
    <html lang="en">
      <body className={montserrat.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
