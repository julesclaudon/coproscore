"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import {
  isFavorite,
  addFavorite,
  removeFavorite,
  type FavoriteEntry,
} from "@/lib/favorites";

interface FavoriteToggleProps {
  slug: string;
  nom: string;
  adresse: string;
  commune: string;
  score: number | null;
  lots: number | null;
}

export function FavoriteToggle({
  slug,
  nom,
  adresse,
  commune,
  score,
  lots,
}: FavoriteToggleProps) {
  const [saved, setSaved] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setSaved(isFavorite(slug));
  }, [slug]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (saved) {
      removeFavorite(slug);
      setSaved(false);
    } else {
      const entry: Omit<FavoriteEntry, "addedAt"> = {
        slug,
        nom,
        adresse,
        commune,
        score,
        lots,
      };
      const result = addFavorite(entry);
      if (result.ok) {
        setSaved(true);
        setAnimate(true);
        setTimeout(() => setAnimate(false), 300);
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`shrink-0 rounded-md p-1.5 transition-all ${
        saved
          ? "text-amber-500 hover:text-amber-600"
          : "text-slate-300 hover:text-amber-400"
      } ${animate ? "scale-125" : ""}`}
      title={saved ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Star
        className={`h-4 w-4 ${saved ? "fill-amber-400" : ""}`}
      />
    </button>
  );
}
