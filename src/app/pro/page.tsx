import type { Metadata } from "next";
import { ProContent } from "./pro-content";

export const metadata: Metadata = {
  title: "CoproScore Pro — L'outil des professionnels de l'immobilier",
  description:
    "Analysez les copropriétés en quelques clics. 619 402 copros, 5 dimensions de scoring, rapports PDF pro. Agents, chasseurs, syndics, notaires : gagnez du temps et fiabilisez vos dossiers.",
  openGraph: {
    title: "CoproScore Pro — L'outil des professionnels de l'immobilier",
    description:
      "Analysez les copropriétés en quelques clics. 619 402 copros, rapports PDF pro, comparateur, alertes.",
  },
};

export default function ProPage() {
  return <ProContent />;
}
