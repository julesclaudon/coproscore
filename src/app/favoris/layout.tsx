import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes favoris",
  robots: { index: false, follow: false },
};

export default function FavorisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
