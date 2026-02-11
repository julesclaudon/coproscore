"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Lock } from "lucide-react";
import type { AccessLevel } from "@/lib/access";

interface DownloadButtonProps {
  slug: string;
  className?: string;
  children: React.ReactNode;
  accessLevel: AccessLevel;
}

export function DownloadButton({ slug, className, children, accessLevel }: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDownload() {
    if (accessLevel === "visitor") {
      router.push("/connexion");
      return;
    }

    if (accessLevel === "free") {
      router.push("/tarifs");
      return;
    }

    // Pro: actual download
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
      alert("Erreur lors de la g\u00e9n\u00e9ration du rapport. R\u00e9essayez dans quelques instants.");
    } finally {
      setLoading(false);
    }
  }

  const isPro = accessLevel === "pro";

  return (
    <Button onClick={handleDownload} disabled={loading} className={className}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          G&eacute;n&eacute;ration en cours...
        </>
      ) : !isPro ? (
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
