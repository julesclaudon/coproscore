import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carte heatmap des copropri\u00e9t\u00e9s en France | CoproScore",
  description:
    "Explorez la carte interactive des scores de sant\u00e9 des 619 402 copropri\u00e9t\u00e9s fran\u00e7aises. Visualisez les quartiers en difficult\u00e9 et les zones bien entretenues gr\u00e2ce \u00e0 notre heatmap.",
  keywords: [
    "carte copropri\u00e9t\u00e9s France",
    "heatmap copropri\u00e9t\u00e9s",
    "score quartier",
    "carte interactive immobilier",
    "copropri\u00e9t\u00e9s en difficult\u00e9",
  ],
};

export default function CarteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
