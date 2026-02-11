"use client";

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
} from "lucide-react";
import { Header } from "@/components/header";

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

      {/* ─── Navigation ─── */}
      <Header variant="homepage" />

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/80 via-white to-white pt-24 pb-14 sm:pt-32 sm:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-0 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />
          <div className="absolute top-32 -left-24 h-64 w-64 rounded-full bg-teal-50/60 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-1.5 text-sm font-medium text-teal-700">
              <ShieldCheck className="h-4 w-4" />
              619 402 copropri&eacute;t&eacute;s analys&eacute;es
            </div>

            <h1 className="mb-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              &Eacute;valuez la sant&eacute; de votre{" "}
              <span className="text-teal-700">copropri&eacute;t&eacute;</span>
            </h1>
            <p className="mx-auto mb-8 max-w-lg text-base leading-relaxed text-slate-500 sm:mb-10 sm:text-lg">
              Un score de 0 &agrave; 100 calcul&eacute; &agrave; partir du registre national, d&apos;1 million
              de transactions immobili&egrave;res et de 13,5 millions de diagnostics &eacute;nerg&eacute;tiques.
            </p>

            {/* Search bar */}
            <div className="mx-auto flex max-w-xl flex-col gap-2 sm:flex-row">
              <div className="flex-1">
                <AddressAutocomplete
                  onSelect={handleSelect}
                  onSubmit={handleSubmit}
                  placeholder="Entrez une adresse, une ville..."
                />
              </div>
              <Button
                type="button"
                className="h-12 rounded-xl bg-teal-700 px-6 text-base font-semibold text-white shadow-sm hover:bg-teal-800 sm:h-14 sm:px-8"
                onClick={() => {
                  // The autocomplete handles submission internally via onSubmit
                  // This button is just visual — Enter key or suggestion click is the primary UX
                }}
              >
                <span className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Rechercher
                </span>
              </Button>
            </div>

            <p className="mt-4 text-sm text-slate-400">
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
            Comment &ccedil;a marche
          </h2>
          <p className="mx-auto mb-14 max-w-lg text-center text-slate-500">
            Un diagnostic complet en quelques secondes, enti&egrave;rement gratuit
            et bas&eacute; sur les donn&eacute;es publiques.{" "}
            <Link href="/methodologie" className="text-teal-600 underline decoration-teal-300 underline-offset-2 hover:text-teal-700">
              D&eacute;couvrez notre m&eacute;thodologie
            </Link>
          </p>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                num: "01",
                icon: Search,
                title: "Recherchez votre adresse",
                desc: "Tapez une adresse ou une ville. L\u2019autocompl\u00e9tion vous guide en temps r\u00e9el.",
              },
              {
                num: "02",
                icon: BarChart3,
                title: "Consultez le score",
                desc: "Score global de 0 \u00e0 100 d\u00e9taill\u00e9 en 5 dimensions : technique, risques, gouvernance, \u00e9nergie, march\u00e9.",
              },
              {
                num: "03",
                icon: Eye,
                title: "Explorez les d\u00e9tails",
                desc: "DPE, prix au m\u00b2, copropri\u00e9t\u00e9s voisines, \u00e9volution du march\u00e9 \u2014 toutes les donn\u00e9es sur une fiche.",
              },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <span className="mb-3 inline-block text-4xl font-black text-teal-100">
                  {step.num}
                </span>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50">
                  <step.icon className="h-6 w-6 text-teal-700" />
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
              Voici un aper&ccedil;u du score d&eacute;taill&eacute; disponible pour chaque copropri&eacute;t&eacute;.
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
                    75013 Paris &mdash; 47 lots d&apos;habitation
                  </p>
                  <div className="space-y-2.5">
                    <MiniBar label="Technique" value={13} max={25} color="bg-teal-500" />
                    <MiniBar label="Risques" value={30} max={30} color="bg-teal-600" />
                    <MiniBar label="Gouvernance" value={25} max={25} color="bg-teal-600" />
                    <MiniBar label="&Eacute;nergie" value={14} max={20} color="bg-teal-500" />
                    <MiniBar label="March&eacute;" value={14} max={20} color="bg-teal-500" />
                  </div>
                </div>
              </div>

              <div className="border-t bg-slate-50 px-6 py-3 sm:px-8">
                <Link
                  href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris"
                  className="group flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800"
                >
                  Voir la fiche compl&egrave;te
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Données ─── */}
      <section className="border-t bg-white py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
            Sources de donn&eacute;es
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-slate-500">
            CoproScore croise quatre bases de donn&eacute;es publiques ouvertes pour construire un score fiable.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Database,
                title: "RNIC",
                stat: "619 402",
                unit: "copropri\u00e9t\u00e9s",
                desc: "Registre National d\u2019Immatriculation des Copropri\u00e9t\u00e9s \u2014 donn\u00e9es de gestion, structure et gouvernance.",
              },
              {
                icon: TrendingUp,
                title: "DVF",
                stat: "1 025 444",
                unit: "transactions",
                desc: "Demandes de Valeurs Fonci\u00e8res \u2014 ventes d\u2019appartements 2023\u20132025, prix au m\u00b2 et \u00e9volutions.",
              },
              {
                icon: Zap,
                title: "DPE ADEME",
                stat: "13,5 M",
                unit: "diagnostics",
                desc: "Diagnostics de Performance \u00c9nerg\u00e9tique de l\u2019ADEME \u2014 classes A \u00e0 G par logement.",
              },
              {
                icon: Map,
                title: "BAN",
                stat: "99,99 %",
                unit: "g\u00e9olocalis\u00e9s",
                desc: "Base Adresse Nationale \u2014 g\u00e9ocodage pr\u00e9cis et recherche par adresse.",
              },
            ].map((src) => (
              <div
                key={src.title}
                className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50">
                  <src.icon className="h-5 w-5 text-teal-700" />
                </div>
                <h3 className="mb-1 text-sm font-bold text-slate-900">{src.title}</h3>
                <p className="mb-3 text-2xl font-bold text-teal-700">
                  {src.stat}{" "}
                  <span className="text-sm font-normal text-slate-500">{src.unit}</span>
                </p>
                <p className="text-xs leading-relaxed text-slate-500">{src.desc}</p>
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
