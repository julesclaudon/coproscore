"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Users,
  Crown,
  FileText,
  DollarSign,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface Stats {
  total_users: number;
  free_users: number;
  pro_users: number;
  total_pdf_purchases: number;
  revenus_pdf: number;
  revenus_pro: number;
  derniers_inscrits: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    emailVerified: string | null;
  }[];
  derniers_pdf: {
    id: number;
    email: string | null;
    slug: string;
    amount: number;
    createdAt: string;
  }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
          <Icon className="h-5 w-5 text-teal-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    PRO: "bg-teal-100 text-teal-700",
    FREE: "bg-slate-100 text-slate-600",
    ADMIN: "bg-purple-100 text-purple-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[role] ?? "bg-slate-100 text-slate-600"}`}
    >
      {role}
    </span>
  );
}

export default function AdminStatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) {
        router.replace("/");
        return;
      }
      if (res.ok) {
        setStats(await res.json());
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user || session.user.role !== "ADMIN") {
      router.replace("/");
      return;
    }
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [status, session, router, fetchStats]);

  if (status === "loading" || (!stats && loading)) {
    return (
      <>
        <Header />
        <main className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </main>
        <Footer />
      </>
    );
  }

  if (!stats) return null;

  const revenus_total = stats.revenus_pdf + stats.revenus_pro;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        {/* Title + Refresh */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Administration
            </h1>
            <p className="text-sm text-slate-500">
              Tableau de bord CoproScore
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Rafraîchir
          </button>
        </div>

        {/* Stat cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Total utilisateurs"
            value={stats.total_users}
            sub={`${stats.free_users} free / ${stats.pro_users} pro`}
          />
          <StatCard
            icon={Crown}
            label="Abonnés PRO"
            value={stats.pro_users}
            sub={`${stats.revenus_pro}€ récurrent`}
          />
          <StatCard
            icon={FileText}
            label="PDF vendus"
            value={stats.total_pdf_purchases}
            sub={`${stats.revenus_pdf.toFixed(2)}€ total`}
          />
          <StatCard
            icon={DollarSign}
            label="Revenus estimés"
            value={`${revenus_total.toFixed(2)}€`}
            sub="PDF + abonnements"
          />
        </div>

        {/* Derniers inscrits */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Derniers inscrits
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Rôle
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Email vérifié
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.derniers_inscrits.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {u.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {u.emailVerified
                        ? new Date(u.emailVerified).toLocaleDateString("fr-FR")
                        : "Non"}
                    </td>
                  </tr>
                ))}
                {stats.derniers_inscrits.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Aucun utilisateur
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Derniers PDF */}
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Derniers PDF achetés
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Copropriété
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.derniers_pdf.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {p.email ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`/copropriete/${p.slug}`}
                        className="text-teal-600 hover:underline"
                      >
                        {p.slug}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
                {stats.derniers_pdf.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-6 text-center text-slate-400"
                    >
                      Aucun achat PDF
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Auto-refresh indicator */}
        {lastRefresh && (
          <p className="text-center text-xs text-slate-400">
            Dernière mise à jour :{" "}
            {lastRefresh.toLocaleTimeString("fr-FR")} (auto-refresh 60s)
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
