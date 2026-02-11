import Link from "next/link";
import { Lock } from "lucide-react";
import type { AccessLevel } from "@/lib/access";

interface PaywallOverlayProps {
  level: AccessLevel;
  children: React.ReactNode;
  ctaFreeText?: string;
  ctaFreeHref?: string;
  ctaProText?: string;
  ctaProHref?: string;
}

export function PaywallOverlay({
  level,
  children,
  ctaFreeText = "Créez un compte gratuit pour débloquer",
  ctaFreeHref = "/inscription",
  ctaProText = "Passez Pro — 29\u00a0€/mois",
  ctaProHref = "/tarifs",
}: PaywallOverlayProps) {
  const ctaText = level === "visitor" ? ctaFreeText : ctaProText;
  const ctaHref = level === "visitor" ? ctaFreeHref : ctaProHref;

  return (
    <div className="relative">
      <div className="select-none blur-sm" aria-hidden="true">
        {children}
      </div>
      <Link
        href={ctaHref}
        className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-white/40 to-white/90 text-sm font-medium text-teal-700 transition-colors hover:text-teal-900"
      >
        <Lock className="h-3.5 w-3.5" />
        {ctaText}
      </Link>
    </div>
  );
}
