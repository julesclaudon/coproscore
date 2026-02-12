"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { AccessLevel } from "@/lib/access";

interface DownloadButtonProps {
  slug: string;
  className?: string;
  children: React.ReactNode;
  accessLevel: AccessLevel;
  hasPurchased?: boolean;
}

export function DownloadButton({ slug, className, children, accessLevel, hasPurchased }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canDownload = accessLevel === "pro" || hasPurchased;

  async function handleDownload() {
    if (accessLevel === "visitor") {
      router.push("/connexion");
      return;
    }

    if (accessLevel === "free" && !hasPurchased) {
      // Redirect to Stripe Checkout for PDF purchase
      setLoading(true);
      try {
        const res = await fetch("/api/stripe/checkout-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          window.location.href = data.url;
          return;
        }
        if (res.status === 409) {
          // Already purchased, reload
          window.location.reload();
          return;
        }
        throw new Error(data.error || "Erreur");
      } catch {
        toast.error("Erreur lors de la redirection vers le paiement.");
        setLoading(false);
      }
      return;
    }

    // Pro or purchased: actual download
    setLoading(true);
    try {
      const res = await fetch(`/api/copropriete/${slug}/rapport`);
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rapport-coproscore-${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Erreur lors de la génération du rapport. Réessayez dans quelques instants.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownload} disabled={loading} className={className}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {canDownload ? "Génération en cours..." : "Redirection..."}
        </>
      ) : hasPurchased && accessLevel === "free" ? (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4 text-green-400" />
          Télécharger votre rapport
        </>
      ) : !canDownload ? (
        <>
          <Lock className="mr-2 h-4 w-4" />
          {children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
