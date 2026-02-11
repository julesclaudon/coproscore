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
      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-b from-white/40 to-white/90">
        <Link
          href={ctaHref}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700"
        >
          <Lock className="h-3.5 w-3.5 text-teal-200" />
          {ctaText}
        </Link>
      </div>
    </div>
  );
}
