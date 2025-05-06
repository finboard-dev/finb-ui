import { Inter } from "next/font/google";
import Providers from "@/providers/Providers";

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
      <div className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </div>
  );
}
