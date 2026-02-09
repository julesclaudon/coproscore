import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoproScore - La sant\u00e9 de votre copropri\u00e9t\u00e9",
  description:
    "Score de sant\u00e9 de 0 \u00e0 100 pour les copropri\u00e9t\u00e9s en France, bas\u00e9 sur les donn\u00e9es ouvertes du RNIC, DVF et ADEME. 619 402 copropri\u00e9t\u00e9s analys\u00e9es.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
