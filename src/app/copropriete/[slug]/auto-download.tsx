"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function AutoDownload({ slug }: { slug: string }) {
  const triggered = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/copropriete/${slug}/rapport`);
        if (!res.ok) return;

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
        // Silent failure — user can still manually download
      }

      // Clean up query param
      router.replace(`/copropriete/${slug}`, { scroll: false });
    }, 1000);

    return () => clearTimeout(timer);
  }, [slug, router]);

  return null;
}
