"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  isFavorite,
  addFavorite,
  removeFavorite,
  type FavoriteEntry,
} from "@/lib/favorites";
import type { AccessLevel } from "@/lib/access";

interface FavoriteButtonProps {
  slug: string;
  nom: string;
  adresse: string;
  commune: string;
  score: number | null;
  lots: number | null;
  accessLevel: AccessLevel;
}

export function FavoriteButton({
  slug,
  nom,
  adresse,
  commune,
  score,
  lots,
  accessLevel,
}: FavoriteButtonProps) {
  const [saved, setSaved] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSaved(isFavorite(slug));
  }, [slug]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function handleClick() {
    if (accessLevel === "visitor") {
      router.push("/connexion");
      return;
    }

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
      const result = addFavorite(entry, accessLevel === "pro");
      if (result.limitReached) {
        setToast("limit");
        return;
      }
      if (result.ok) {
        setSaved(true);
        setAnimate(true);
        setTimeout(() => setAnimate(false), 300);
      }
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={`min-w-[44px] min-h-[44px] gap-1.5 transition-transform ${
          saved
            ? "border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100"
            : "border-teal-200 text-teal-700 hover:bg-teal-50"
        } ${animate ? "scale-125" : ""}`}
      >
        <Star
          className={`h-4 w-4 ${saved ? "fill-amber-400" : ""}`}
        />
        <span className="hidden sm:inline">
          {saved ? "Sauvegardé" : "Sauvegarder"}
        </span>
      </Button>

      {/* Toast */}
      {toast === "limit" && (
        <div className="absolute top-full right-0 z-50 mt-2 w-72 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm shadow-lg">
          <p className="text-amber-800">
            Limite de 5 favoris atteinte.
          </p>
          <Link
            href="/tarifs"
            className="mt-1 inline-block text-xs font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900"
          >
            Passez Pro pour sauvegarder jusqu'à 50 copropriétés.
          </Link>
        </div>
      )}
    </div>
  );
}
