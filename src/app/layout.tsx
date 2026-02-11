import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DevBanner } from "@/components/dev-banner";

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
    default: "CoproScore — Score de santé des copropriétés en France",
    template: "%s | CoproScore",
  },
  description:
    "Score de santé de 0 à 100 pour 619 402 copropriétés en France. Analyse technique, risques, gouvernance, énergie et marché à partir des données ouvertes RNIC, DVF et DPE ADEME.",
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
        <DevBanner />
        {children}
      </body>
    </html>
  );
}
