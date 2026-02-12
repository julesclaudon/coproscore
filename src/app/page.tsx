"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import {
  Search,
  BarChart3,
  Eye,
  Building2,
  ShieldCheck,
  TrendingUp,
  Zap,
  Database,
  Map,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Header } from "@/components/header";

/* ─── Count-up animation ─── */
const COUNT_DURATION = 3000;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 8);
}

const SOURCES = [
  {
    icon: Database,
    title: "RNIC",
    target: 619402,
    format: (v: number) => Math.round(v).toLocaleString("fr-FR"),
    unit: "copropriétés",
    desc: "Registre National d'Immatriculation des Copropriétés — données de gestion, structure et gouvernance.",
    updatedAt: "Mis à jour : août 2025",
  },
  {
    icon: TrendingUp,
    title: "DVF",
    target: 1025444,
    format: (v: number) => Math.round(v).toLocaleString("fr-FR"),
    unit: "transactions",
    desc: "Demandes de Valeurs Foncières — ventes d'appartements 2023–2025, prix au m² et évolutions.",
    updatedAt: "Mis à jour : juin 2025",
  },
  {
    icon: Zap,
    title: "DPE ADEME",
    target: 13.5,
    format: (v: number) => v.toFixed(1).replace(".", ",") + " M",
    unit: "diagnostics",
    desc: "Diagnostics de Performance Énergétique de l'ADEME — classes A à G par logement.",
    updatedAt: "Mis à jour : décembre 2025",
  },
  {
    icon: Map,
    title: "BAN",
    target: 99.99,
    format: (v: number) => v.toFixed(2).replace(".", ",") + " %",
    unit: "géolocalisés",
    desc: "Base Adresse Nationale — géocodage précis et recherche par adresse.",
    updatedAt: "Géocodage permanent",
  },
];

/* ─── Mini score bar for the example section ─── */
function MiniBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-slate-500">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`absolute inset-y-0 left-0 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-semibold text-slate-700">{value}/{max}</span>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const sourcesRef = useRef<HTMLDivElement>(null);
  const statRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = sourcesRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();

          function tick(now: number) {
            const elapsed = now - start;
            const t = Math.min(elapsed / COUNT_DURATION, 1);
            const eased = easeOut(t);

            SOURCES.forEach((src, i) => {
              const span = statRefs.current[i];
              if (span) span.textContent = src.format(src.target * eased);
            });

            if (t < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function handleSelect(v: { label: string; lon: number; lat: number }) {
    const params = new URLSearchParams({
      q: v.label,
      lat: v.lat.toString(),
      lon: v.lon.toString(),
    });
    router.push(`/recherche?${params.toString()}`);
  }

  function handleSubmit(query: string) {
    const params = new URLSearchParams({ q: query });
    router.push(`/recherche?${params.toString()}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "CoproScore",
            url: "https://coproscore.fr",
            description:
              "Score de santé des copropriétés françaises basé sur les données publiques",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "EUR",
              description: "Consultation gratuite des scores",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CoproScore",
            url: "https://coproscore.fr",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://coproscore.fr/recherche?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      {/* ─── Navigation ─── */}
      <Header variant="homepage" />

      {/* ─── Hero ─── */}
      <section className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-teal-50/30 to-white pt-16 pb-10 md:min-h-0 md:block md:pt-32 md:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />
          <div className="absolute top-32 -left-24 h-64 w-64 rounded-full bg-teal-50/60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-2 text-base font-medium text-teal-700 md:mb-6 md:px-4 md:py-1.5 md:text-sm">
              <ShieldCheck className="h-5 w-5 md:h-4 md:w-4" />
              619 402 copropriétés analysées
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:mb-5 lg:text-6xl">
              Analysez la{" "}
              <span className="text-teal-600">santé</span>{" "}
              de votre copropriété
            </h1>
            <p className="mx-auto mb-10 max-w-lg text-lg leading-relaxed text-slate-500 md:mb-10 md:text-lg">
              Un score de 0 à 100 calculé à partir du registre national, d'1 million
              de transactions immobilières et de 13,5 millions de diagnostics énergétiques.
            </p>

            {/* Search bar */}
            <div className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row sm:gap-2">
              <div className="flex-1">
                <AddressAutocomplete
                  onSelect={handleSelect}
                  onSubmit={handleSubmit}
                  placeholder="Entrez une adresse, une ville..."
                />
              </div>
              <Button
                type="button"
                className="h-14 rounded-xl bg-teal-700 px-6 text-base font-semibold text-white shadow-sm hover:bg-teal-800 sm:px-8"
                onClick={() => {
                  // The autocomplete handles submission internally via onSubmit
                  // This button is just visual — Enter key or suggestion click is the primary UX
                }}
              >
                <span className="flex items-center gap-2">
                  <Search className="h-5 w-5 md:h-4 md:w-4" />
                  Rechercher
                </span>
              </Button>
            </div>

            <p className="mt-5 text-base text-slate-400 md:mt-4 md:text-sm">
              Exemple :{" "}
              <Link
                href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris"
                className="text-teal-600 underline decoration-teal-300 underline-offset-2 hover:text-teal-700"
              >
                45 Boulevard Saint-Marcel, 75013 Paris
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ─── Comment ça marche ─── */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
            Comment ça marche
          </h2>
          <p className="mx-auto mb-14 max-w-lg text-center text-slate-500">
            Un diagnostic complet en quelques secondes, entièrement gratuit
            et basé sur les données publiques.{" "}
            <Link href="/methodologie" className="text-teal-600 underline decoration-teal-300 underline-offset-2 hover:text-teal-700">
              Découvrez notre méthodologie
            </Link>
          </p>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                num: "01",
                icon: Search,
                title: "Recherchez votre adresse",
                desc: "Tapez une adresse ou une ville. L’autocomplétion vous guide en temps réel.",
              },
              {
                num: "02",
                icon: BarChart3,
                title: "Consultez le score",
                desc: "Score global de 0 à 100 détaillé en 5 dimensions : technique, risques, gouvernance, énergie, marché.",
              },
              {
                num: "03",
                icon: Eye,
                title: "Explorez les détails",
                desc: "DPE, prix au m², copropriétés voisines, évolution du marché — toutes les données sur une fiche.",
              },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <span className="mb-3 inline-block text-4xl font-black text-teal-200">
                  {step.num}
                </span>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
                  <step.icon className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Exemple ─── */}
      <section className="border-t bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
              Exemple de fiche
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-center text-slate-500">
              Voici un aperçu du score détaillé disponible pour chaque copropriété.
            </p>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
                {/* Score circle */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-teal-200 bg-teal-50">
                    <span className="text-3xl font-bold text-teal-700">80</span>
                  </div>
                  <span className="mt-1 text-xs font-medium text-teal-600">/100</span>
                </div>

                {/* Info + bars */}
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-bold text-slate-900">
                    45 Boulevard Saint-Marcel
                  </h3>
                  <p className="mb-4 text-sm text-slate-500">
                    75013 Paris — 47 lots d'habitation
                  </p>
                  <div className="space-y-2.5">
                    <MiniBar label="Technique" value={13} max={25} color="bg-teal-500" />
                    <MiniBar label="Risques" value={30} max={30} color="bg-teal-600" />
                    <MiniBar label="Gouvernance" value={25} max={25} color="bg-teal-600" />
                    <MiniBar label="Énergie" value={14} max={20} color="bg-teal-500" />
                    <MiniBar label="Marché" value={14} max={20} color="bg-teal-500" />
                  </div>
                </div>
              </div>

              <div className="border-t bg-slate-50 px-6 py-3 sm:px-8">
                <Link
                  href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris"
                  className="group flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
                >
                  Voir la fiche complète
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Données ─── */}
      <section ref={sourcesRef} className="border-t bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
            Sources de données
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-slate-500">
            CoproScore croise quatre bases de données publiques ouvertes pour construire un score fiable.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SOURCES.map((src, i) => (
              <div
                key={src.title}
                className="rounded-xl border border-teal-100 bg-teal-50/50 p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-100">
                  <src.icon className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{src.title}</h3>
                <p className="mb-3 text-2xl font-bold tabular-nums text-teal-700">
                  <span ref={(el) => { statRefs.current[i] = el; }}>
                    {src.format(0)}
                  </span>{" "}
                  <span className="text-sm font-normal text-slate-500">{src.unit}</span>
                </p>
                <p className="text-xs leading-relaxed text-slate-500">{src.desc}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  {src.updatedAt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <Footer />
    </div>
  );
}
