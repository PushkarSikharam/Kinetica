import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zoro Food Tracker | Intelligent Calorie Tracker",
  description: "A free, premium-feel calorie tracker built for clarity.",
};

import { GlobalChatbot } from "@/components/GlobalChatbot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased text-zinc-900 selection:bg-blue-100`}>
        {children}
        <GlobalChatbot />
      </body>
    </html>
  );
}
