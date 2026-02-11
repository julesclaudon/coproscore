import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparateur de copropriétés",
  description:
    "Comparez jusqu'à 4 copropriétés côte à côte : scores, DPE, prix au m², gouvernance. Identifiez les forces et faiblesses de chaque copropriété.",
};

export default function ComparateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
