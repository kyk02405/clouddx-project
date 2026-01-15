import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import QuickBar from "../components/QuickBar";
import Footer from "../components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "CovaEX - 암호화폐 거래 플랫폼",
  description: "실시간 비트코인 및 암호화폐 시세 확인 및 거래",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <QuickBar />
      </body>
    </html>
  );
}
