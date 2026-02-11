import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs — Offres Free, Pro et Admin",
  description:
    "Découvrez les offres CoproScore : consultation gratuite des scores, rapports PDF détaillés et accès Pro pour les professionnels de l'immobilier.",
};

export default function TarifsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
