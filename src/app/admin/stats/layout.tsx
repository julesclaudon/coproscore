import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Statistiques",
  robots: { index: false, follow: false },
};

export default function AdminStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
