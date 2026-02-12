import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carte interactive des copropriétés en France",
  description:
    "Explorez la carte interactive des scores de santé des 619 402 copropriétés françaises. Filtrez par score, syndic, période de construction et nombre de lots.",
  keywords: [
    "carte copropriétés France",
    "carte interactive copropriétés",
    "score quartier",
    "carte interactive immobilier",
    "copropriétés en difficulté",
  ],
};

export default function CarteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
