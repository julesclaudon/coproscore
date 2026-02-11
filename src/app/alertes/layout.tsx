import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes alertes",
  robots: { index: false, follow: false },
};

export default function AlertesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
