import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/NavBar";
import FuturisticBackground from "@/components/FuturisticBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SalonFlow",
  description: "Smart Salon Queue & Booking Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body style={{ fontFamily: inter.style.fontFamily }}>
        <FuturisticBackground />
        <div className="app-shell">
          {children}
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
