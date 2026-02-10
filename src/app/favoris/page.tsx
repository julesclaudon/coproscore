"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { HistoryNavLink } from "@/components/history-nav-link";
import { FavoritesNavLink } from "@/components/favorites-nav-link";
import {
  getFavorites,
  removeFavorite,
  clearFavorites,
  MAX_FREE,
  type FavoriteEntry,
} from "@/lib/favorites";
import { scoreColor, scoreBg } from "@/lib/format";
import {
  Star,
  Trash2,
  Search,
  Home,
  ChevronRight,
  Lock,
  Building2,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "\u00e0 l\u2019instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  return `il y a ${days} jours`;
}

export default function FavorisPage() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setFavorites(getFavorites());
    setMounted(true);
  }, []);

  function handleRemove(slug: string) {
    removeFavorite(slug);
    setFavorites((prev) => prev.filter((f) => f.slug !== slug));
  }

  function handleClear() {
    clearFavorites();
    setFavorites([]);
  }

  const devUnlocked = process.env.NEXT_PUBLIC_DEV_UNLOCK === "true";
  const isFree = !devUnlocked;
  const limitReached = isFree && favorites.length >= MAX_FREE;

  // Build comparateur URL with all favorite slugs (max 5)
  const compareUrl =
    favorites.length > 0
      ? `/comparateur?ids=${favorites
          .slice(0, 5)
          .map((f) => f.slug)
          .join(",")}`
      : "/comparateur";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="shrink-0 text-xl font-bold text-slate-900">
            Copro<span className="text-teal-600">Score</span>
          </Link>
          <nav className="ml-auto flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/" className="transition-colors hover:text-teal-700">
              Rechercher
            </Link>
            <Link href="/carte" className="transition-colors hover:text-teal-700">
              Carte
            </Link>
            <Link href="/comparateur" className="transition-colors hover:text-teal-700">
              Comparateur
            </Link>
            <span className="flex items-center gap-1.5 text-teal-700">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Favoris</span>
            </span>
            <Link href="/tarifs" className="transition-colors hover:text-teal-700">
              Tarifs
            </Link>
            <HistoryNavLink />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-teal-700"
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-600">Favoris</span>
          </nav>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Mes favoris
          </h1>
          {mounted && favorites.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              {favorites.length} copropri&eacute;t&eacute;
              {favorites.length > 1 ? "s" : ""} sauvegard&eacute;e
              {favorites.length > 1 ? "s" : ""}
            </p>
          )}

          {/* Pro banner if limit reached */}
          {mounted && limitReached && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock className="h-4 w-4 shrink-0" />
              <span>
                Vous utilisez {favorites.length}/{MAX_FREE} favoris.{" "}
                <Link
                  href="/tarifs"
                  className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900"
                >
                  Passez Pro pour en sauvegarder jusqu&apos;&agrave; 50.
                </Link>
              </span>
            </div>
          )}

          {/* Actions */}
          {mounted && favorites.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={compareUrl}>
                <Button
                  size="sm"
                  className="gap-1.5 bg-teal-700 text-white hover:bg-teal-800"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  Comparer les favoris
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Vider les favoris
              </Button>
            </div>
          )}

          {/* List */}
          {mounted && favorites.length > 0 && (
            <div className="mt-6 space-y-0 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {favorites.map((fav) => (
                <div
                  key={fav.slug}
                  className="flex items-center gap-4 px-4 py-3.5"
                >
                  <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreBg(fav.score)} ${scoreColor(fav.score)}`}
                  >
                    {fav.score ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/copropriete/${fav.slug}`}
                      className="truncate text-sm font-medium text-slate-900 hover:text-teal-700"
                    >
                      {fav.nom}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="truncate">
                        {fav.adresse}{fav.commune ? `, ${fav.commune}` : ""}
                      </span>
                      {fav.lots != null && (
                        <span className="flex shrink-0 items-center gap-0.5">
                          <Building2 className="h-3 w-3" />
                          {fav.lots} lots
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="hidden shrink-0 text-xs text-slate-400 sm:block">
                    {timeAgo(fav.addedAt)}
                  </span>
                  <button
                    onClick={() => handleRemove(fav.slug)}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Retirer des favoris"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {mounted && favorites.length === 0 && (
            <div className="mt-12 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <Star className="h-7 w-7 text-amber-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700">
                Aucun favori
              </p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Ajoutez des copropri&eacute;t&eacute;s en cliquant sur &star; depuis leur fiche.
              </p>
              <Link href="/" className="mt-6">
                <Button className="gap-2 bg-teal-700 text-white hover:bg-teal-800">
                  <Search className="h-4 w-4" />
                  Rechercher une copropri&eacute;t&eacute;
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
