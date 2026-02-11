"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  getHistory,
  clearHistory as clearHistoryStorage,
  type HistoryEntry,
} from "@/lib/history";
import {
  Clock,
  Trash2,
  Download,
  Lock,
  Search,
  Home,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function scoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 70) return "text-teal-600";
  if (score >= 40) return "text-amber-500";
  return "text-red-500";
}

function scoreBg(score: number | null): string {
  if (score === null) return "bg-slate-100";
  if (score >= 70) return "bg-teal-50";
  if (score >= 40) return "bg-amber-50";
  return "bg-red-50";
}

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

export default function HistoriquePage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
    setMounted(true);
  }, []);

  function handleClear() {
    clearHistoryStorage();
    setHistory([]);
  }

  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isPro = role === "PRO" || role === "ADMIN";
  const isFree = !isPro;
  const visibleCount = isPro ? history.length : 5;
  const visible = history.slice(0, visibleCount);
  const blurred = isFree ? history.slice(visibleCount, visibleCount + 5) : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Header */}
      <Header />

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
            <span className="text-slate-600">Historique</span>
          </nav>

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Historique de consultation
          </h1>
          {mounted && history.length > 0 && (
            <p className="mt-2 text-sm text-slate-500">
              {history.length} copropri&eacute;t&eacute;
              {history.length > 1 ? "s" : ""} consult&eacute;e
              {history.length > 1 ? "s" : ""}
            </p>
          )}

          {/* Actions */}
          {mounted && history.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={handleClear}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Vider l&apos;historique
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!isPro}
                className={`gap-1.5 ${isPro ? "text-slate-700" : "text-slate-400"}`}
              >
                {!isPro && <Lock className="h-3.5 w-3.5" />}
                {isPro && <Download className="h-3.5 w-3.5" />}
                Exporter CSV
              </Button>
            </div>
          )}

          {/* List */}
          {mounted && history.length > 0 && (
            <div className="mt-6 space-y-0 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {visible.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/copropriete/${entry.slug}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreBg(entry.score)} ${scoreColor(entry.score)}`}
                  >
                    {entry.score ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {entry.nom}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {entry.adresse}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {timeAgo(entry.visitedAt)}
                  </span>
                </Link>
              ))}

              {/* Blurred entries for free */}
              {blurred.length > 0 && (
                <div className="relative">
                  <div className="select-none blur-sm">
                    {blurred.map((entry) => (
                      <div
                        key={entry.slug}
                        className="flex items-center gap-4 px-4 py-3.5"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreBg(entry.score)} ${scoreColor(entry.score)}`}
                        >
                          {entry.score ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {entry.nom}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {entry.adresse}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs text-slate-400">
                          {timeAgo(entry.visitedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 to-white/90">
                    <Link
                      href="/tarifs"
                      className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-teal-700 shadow-sm transition-colors hover:text-teal-900"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      Passez Pro &mdash; 29&euro;/mois
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {mounted && history.length === 0 && (
            <div className="mt-12 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Clock className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700">
                Aucune copropri&eacute;t&eacute; consult&eacute;e
              </p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Vos consultations de fiches copropri&eacute;t&eacute;
                appara&icirc;tront ici automatiquement.
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
