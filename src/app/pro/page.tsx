import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Building2,
  Search,
  ShieldCheck,
  Scale,
  CheckCircle2,
  ArrowRight,
  Crown,
  FileDown,
  BarChart3,
  Database,
  Target,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "CoproScore Pro — L'outil des professionnels de l'immobilier",
  description:
    "Analysez les copropriétés en quelques clics. 619 402 copros, 5 dimensions de scoring, rapports PDF pro. Agents, chasseurs, syndics, notaires : gagnez du temps et fiabilisez vos dossiers.",
  openGraph: {
    title: "CoproScore Pro — L'outil des professionnels de l'immobilier",
    description:
      "Analysez les copropriétés en quelques clics. 619 402 copros, rapports PDF pro, comparateur, alertes.",
  },
};

const AUDIENCES = [
  {
    icon: Building2,
    title: "Agents immobiliers",
    description:
      "Intégrez un score de santé vérifié dans vos mandats et dossiers de vente. Rassurez vos acquéreurs avec des données objectives.",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
  {
    icon: Search,
    title: "Chasseurs immobiliers",
    description:
      "Analysez 10 à 20 copropriétés en quelques minutes pour vos clients. Comparez les scores et identifiez les meilleures opportunités.",
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  {
    icon: ShieldCheck,
    title: "Syndics de copropriété",
    description:
      "Benchmarkez votre parc, identifiez les copropriétés à risque et anticipez les travaux grâce aux scores détaillés.",
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
  },
  {
    icon: Scale,
    title: "Notaires / CGP",
    description:
      "Complétez votre devoir d'information avec des données objectives et un rapport PDF horodaté à joindre au dossier.",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
];

const ARGUMENTS = [
  {
    icon: Database,
    value: "619 402",
    label: "copropriétés analysées",
    detail: "Couverture nationale complète issue du RNIC",
  },
  {
    icon: BarChart3,
    value: "4 sources",
    label: "de données publiques croisées",
    detail: "RNIC, DVF, ADEME/DPE et Base Adresse Nationale",
  },
  {
    icon: Target,
    value: "5 dimensions",
    label: "de scoring objectif",
    detail: "Technique, Risques, Gouvernance, Énergie, Marché",
  },
  {
    icon: FileDown,
    value: "PDF pro",
    label: "rapports horodatés",
    detail: "Téléchargement immédiat, branding professionnel",
  },
];

const PRO_FEATURES = [
  "Rapports PDF illimités",
  "Comparateur multi-copros (2 à 5 côte à côte)",
  "Export CSV / Excel des données DVF",
  "Analyse IA : points forts, vigilances, recommandations",
  "Alertes email : changement de score, DPE, syndic",
  "Historique de recherches sauvegardé",
  "Support prioritaire",
];

export default function ProPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* ─── Hero — dark premium ─── */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
            <Crown className="h-3.5 w-3.5" />
            Offre Professionnels
          </span>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            CoproScore pour les professionnels
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Rassurez vos clients, fiabilisez vos dossiers, gagnez du temps.
            Accédez à l'analyse complète de toutes les copropriétés de France.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tarifs"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-colors hover:bg-teal-400"
            >
              <Crown className="h-4 w-4" />
              Découvrir l'offre Pro
            </Link>
            <Link
              href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-base font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            >
              Voir un exemple de fiche
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Pour qui ? — white ─── */}
      <section className="border-b bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Pour qui ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
            CoproScore Pro s'adresse à tous les acteurs de l'immobilier qui ont
            besoin de données fiables sur les copropriétés.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${a.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${a.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {a.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                        {a.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Pourquoi CoproScore ? — slate-50 ─── */}
      <section className="border-b bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Pourquoi CoproScore ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
            Des données publiques croisées, un scoring objectif et transparent.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ARGUMENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.label}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-center"
                >
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                    <Icon className="h-5 w-5 text-teal-600" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{a.value}</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-700">
                    {a.label}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {a.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Pricing — white ─── */}
      <section className="border-b bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Une offre simple et transparente
          </h2>

          <div className="mt-10 overflow-hidden rounded-2xl border-2 border-teal-500 bg-white shadow-lg">
            <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 text-center">
              <p className="flex items-center justify-center gap-2 text-lg font-bold text-white">
                <Crown className="h-5 w-5" />
                Accès Pro
              </p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-bold text-slate-900">29 €</span>
                <span className="text-base text-slate-500">/mois TTC</span>
              </div>
              <p className="mt-1 text-center text-sm text-slate-400">
                ou 290 €/an (2 mois offerts)
              </p>

              <ul className="mt-6 space-y-3">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/tarifs"
                className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
              >
                <Crown className="h-4 w-4" />
                S'abonner
              </Link>
              <p className="mt-3 text-center text-xs text-slate-400">
                14 jours d'essai gratuit · Résiliation à tout moment
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ROI — teal ─── */}
      <section className="bg-gradient-to-r from-teal-700 to-teal-600 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 text-teal-200" />
          <p className="text-2xl font-bold text-white sm:text-3xl">
            29 €/mois, c'est moins de 1 € par jour.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-teal-100">
            Une seule vente facilitée rembourse 5 ans d'abonnement.
            Intégrez CoproScore dans votre workflow et gagnez un avantage
            concurrentiel durable.
          </p>
        </div>
      </section>

      {/* ─── CTA final — dark premium ─── */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Prêt à passer Pro ?
          </h2>
          <p className="mt-3 text-base text-slate-400">
            Rejoignez les professionnels qui utilisent CoproScore pour
            fiabiliser leurs dossiers et gagner du temps.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tarifs"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-colors hover:bg-teal-400"
            >
              <Crown className="h-4 w-4" />
              Voir les tarifs et s'abonner
            </Link>
            <Link
              href="mailto:contact@coproscore.fr"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-8 py-4 text-base font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-white"
            >
              Une question ? Contactez-nous
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
