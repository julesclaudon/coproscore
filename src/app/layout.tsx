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
  metadataBase: new URL("https://coproscore.fr"),
  title: {
    default: "CoproScore — Le score de santé de votre copropriété",
    template: "%s | CoproScore",
  },
  description:
    "Score de santé de 0 à 100 pour les copropriétés en France, basé sur les données ouvertes du RNIC, DVF et ADEME. 619 402 copropriétés analysées.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    siteName: "CoproScore",
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "CoproScore — Le score de santé de votre copropriété",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
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
