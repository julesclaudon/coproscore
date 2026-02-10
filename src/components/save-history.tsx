"use client";

import { useEffect } from "react";
import { addToHistory } from "@/lib/history";

export function SaveHistory({
  slug,
  nom,
  adresse,
  score,
}: {
  slug: string;
  nom: string;
  adresse: string;
  score: number | null;
}) {
  useEffect(() => {
    addToHistory({ slug, nom, adresse, score });
  }, [slug, nom, adresse, score]);

  return null;
}
