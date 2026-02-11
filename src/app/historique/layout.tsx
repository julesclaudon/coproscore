import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historique de consultation",
  robots: { index: false, follow: false },
};

export default function HistoriqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
