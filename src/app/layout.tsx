import "./globals.css";

import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AulaPulse",
    template: "%s | AulaPulse",
  },
  description: "Plataforma interna de gestión y seguimiento académico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen text-[var(--color-text)]">
        {children}
      </body>
    </html>
  );
}