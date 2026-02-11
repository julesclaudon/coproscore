"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  Bell,
  Trash2,
  Search,
  Home,
  ChevronRight,
  Lock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertItem {
  id: number;
  coproId: number;
  active: boolean;
  createdAt: string;
  slug: string;
  nom: string;
  adresse: string;
  score: number | null;
}

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

export default function AlertesPage() {
  return (
    <Suspense>
      <AlertesContent />
    </Suspense>
  );
}

function AlertesContent() {
  const searchParams = useSearchParams();
  const confirmed = searchParams.get("confirmed");

  const [email, setEmail] = useState("");
  const [searchedEmail, setSearchedEmail] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Auto-dismiss confirmation banner
  const [showBanner, setShowBanner] = useState(confirmed === "ok");
  useEffect(() => {
    if (showBanner) {
      const t = setTimeout(() => setShowBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [showBanner]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setSearched(false);

    try {
      const res = await fetch(`/api/alertes?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setSearchedEmail(email);
      setSearched(true);
    } catch {
      setAlerts([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(alertId: number) {
    setDeleting(alertId);
    try {
      const res = await fetch(
        `/api/alertes/${alertId}?email=${encodeURIComponent(searchedEmail)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      }
    } finally {
      setDeleting(null);
    }
  }

  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isPro = role === "PRO" || role === "ADMIN";
  const isFree = !isPro;
  const visibleCount = isPro ? alerts.length : 3;
  const visible = alerts.slice(0, visibleCount);
  const blurred = isFree ? alerts.slice(visibleCount, visibleCount + 3) : [];

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
            <span className="text-slate-600">Mes alertes</span>
          </nav>

          {/* Confirmation banner */}
          {showBanner && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Alerte confirm&eacute;e avec succ&egrave;s !
            </div>
          )}

          {confirmed === "already" && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Cette alerte est d&eacute;j&agrave; confirm&eacute;e.
            </div>
          )}

          {confirmed === "invalid" && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              Lien de confirmation invalide ou expir&eacute;.
            </div>
          )}

          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Mes alertes
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Retrouvez et g&eacute;rez vos alertes de changement de score.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Entrez votre email"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <Button
              type="submit"
              disabled={loading}
              className="gap-1.5 bg-teal-700 text-white hover:bg-teal-800"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Rechercher
            </Button>
          </form>

          {/* Results */}
          {searched && alerts.length > 0 && (
            <div className="mt-6 space-y-0 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {visible.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-4 px-4 py-3.5"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreBg(alert.score)} ${scoreColor(alert.score)}`}
                  >
                    {alert.score ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/copropriete/${alert.slug}`}
                      className="truncate text-sm font-medium text-slate-900 hover:text-teal-700"
                    >
                      {alert.nom}
                    </Link>
                    <p className="truncate text-xs text-slate-400">
                      {alert.adresse}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      alert.active
                        ? "bg-teal-50 text-teal-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {alert.active ? "Active" : "En attente"}
                  </span>
                  <button
                    onClick={() => handleDelete(alert.id)}
                    disabled={deleting === alert.id}
                    className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Supprimer cette alerte"
                  >
                    {deleting === alert.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}

              {/* Blurred entries for free */}
              {blurred.length > 0 && (
                <div className="relative">
                  <div className="select-none blur-sm">
                    {blurred.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center gap-4 px-4 py-3.5"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreBg(alert.score)} ${scoreColor(alert.score)}`}
                        >
                          {alert.score ?? "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {alert.nom}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {alert.adresse}
                          </p>
                        </div>
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
          {searched && alerts.length === 0 && (
            <div className="mt-12 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Bell className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700">
                Aucune alerte trouv&eacute;e
              </p>
              <p className="mt-2 max-w-sm text-sm text-slate-400">
                Aucune alerte n&rsquo;est associ&eacute;e &agrave; cette adresse email.
                Cr&eacute;ez une alerte depuis la fiche d&rsquo;une copropri&eacute;t&eacute;.
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
