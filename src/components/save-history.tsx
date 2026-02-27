"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    addToHistory({ slug, nom, adresse, score }, userId);
  }, [slug, nom, adresse, score, userId]);

  return null;
}
