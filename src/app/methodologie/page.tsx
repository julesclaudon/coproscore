import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  ShieldCheck,
  Users,
  Zap,
  TrendingUp,
  Home,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Méthodologie du score — Comment ça marche",
  description:
    "Découvrez comment CoproScore calcule le score de santé des copropriétés : 5 dimensions, 4 sources de données publiques, méthodologie transparente.",
  openGraph: {
    title: "Méthodologie | CoproScore",
  },
};

/* ---------- Section IDs for table of contents ---------- */

const TOC = [
  { id: "introduction", label: "Introduction" },
  { id: "dimensions", label: "Les 5 dimensions" },
  { id: "technique", label: "Technique" },
  { id: "risques", label: "Risques" },
  { id: "gouvernance", label: "Gouvernance" },
  { id: "energie", label: "Énergie" },
  { id: "marche", label: "Marché" },
  { id: "confiance", label: "Indice de confiance" },
  { id: "sources", label: "Sources de données" },
  { id: "limites", label: "Limites" },
  { id: "contact", label: "Contact" },
];

/* ---------- Page ---------- */

export default function MethodologiePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white py-10 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-teal-700"
            >
              <Home className="h-3.5 w-3.5" />
              Accueil
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-600">Méthodologie</span>
          </nav>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Notre méthodologie
          </h1>
          <p className="mx-auto mb-6 max-w-xl text-lg leading-relaxed text-slate-500">
            Comment CoproScore évalue la santé de votre
            copropriété
          </p>
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            Dernière mise à jour : octobre 2025 (RNIC)
          </Badge>
        </div>
      </section>

      {/* Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-3 py-8 sm:px-4 sm:py-12">
          <div className="flex gap-12 lg:flex-row">
            {/* Table of contents — desktop sidebar */}
            <aside className="hidden w-56 shrink-0 lg:block">
              <nav className="sticky top-24">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sommaire
                </p>
                <ul className="space-y-1.5">
                  {TOC.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`block text-sm transition-colors hover:text-teal-700 ${
                          item.id === "technique" ||
                          item.id === "risques" ||
                          item.id === "gouvernance" ||
                          item.id === "energie" ||
                          item.id === "marche"
                            ? "pl-3 text-slate-400"
                            : "font-medium text-slate-600"
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* Article body */}
            <article className="min-w-0 max-w-3xl flex-1">
              {/* ─── Introduction ─── */}
              <section id="introduction" className="mb-16 scroll-mt-24">
                <h2 className="mb-6 text-2xl font-bold text-slate-900">
                  Introduction
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-slate-600">
                  <p>
                    CoproScore croise quatre bases de données publiques
                    ouvertes — le Registre National des Copropriétés
                    (RNIC), les Demandes de Valeurs Foncières (DVF), les
                    Diagnostics de Performance Énergétique de
                    l'ADEME et la Base Adresse Nationale (BAN) — pour
                    calculer un <strong>score de 0 à 100</strong> reflétant
                    l'état général de chacune des 619 402
                    copropriétés immatriculées en France.
                  </p>
                  <p>
                    Ce score synthétise cinq dimensions complémentaires
                    — technique, risques, gouvernance, énergie et
                    marché — pour donner une vision d'ensemble rapide
                    et comparable. Chaque dimension est notée
                    indépendamment avec sa propre pondération, puis le
                    total est normalisé sur 100.
                  </p>
                  <p>
                    Notre approche est <strong>100 % transparente</strong> et
                    repose exclusivement sur des{" "}
                    <strong>données ouvertes</strong>. Aucune donnée
                    privée (charges, impáyés, procès-verbaux
                    d'AG) n'est utilisée. Cette page détaille
                    chaque critère, son barème et la source des
                    données.
                  </p>
                </div>
              </section>

              {/* ─── Les 5 dimensions ─── */}
              <section id="dimensions" className="mb-8 scroll-mt-24">
                <h2 className="mb-2 text-2xl font-bold text-slate-900">
                  Les 5 dimensions du score
                </h2>
                <p className="mb-8 text-base text-slate-500">
                  Le score brut total est calculé sur{" "}
                  <strong className="text-slate-700">120 points</strong> (25 + 30
                  + 25 + 20 + 20), puis normalisé sur 100 :{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-teal-700">
                    score = round(brut / 120 × 100)
                  </code>
                </p>
              </section>

              {/* Dimension: Technique */}
              <DimensionCard
                id="technique"
                icon={Wrench}
                iconBg="bg-sky-50"
                iconColor="text-sky-500"
                title="Technique"
                weight="/25"
                measure="Qualité du bâti et des équipements"
                source="RNIC (Registre National d'Immatriculation des Copropriétés)"
              >
                <p className="mb-4 text-sm text-slate-600">
                  Le score technique reflète l'âge et les
                  équipements de l'immeuble. Les constructions
                  récentes bénéficient de normes plus
                  exigeantes (RT2012, RE2020).
                </p>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Barème — Période de construction
                </h4>
                <table className="mb-4 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-400">
                      <th className="pb-2 font-medium">Période</th>
                      <th className="pb-2 text-right font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Après 2000</td>
                      <td className="py-1.5 text-right font-semibold">25</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">1994–2000</td>
                      <td className="py-1.5 text-right font-semibold">22</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">1975–1993</td>
                      <td className="py-1.5 text-right font-semibold">18</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">1949–1974</td>
                      <td className="py-1.5 text-right font-semibold">13</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Avant 1949</td>
                      <td className="py-1.5 text-right font-semibold">10</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400">Non renseignée</td>
                      <td className="py-1.5 text-right font-semibold">15</td>
                    </tr>
                  </tbody>
                </table>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Bonus
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  <li>
                    <strong>Ascenseur</strong> : +2 pts si l'immeuble a un
                    ascenseur et plus de 3 étages
                  </li>
                  <li>
                    <strong>Gardien / employé</strong> : +3 pts
                  </li>
                </ul>
              </DimensionCard>

              {/* Dimension: Risques */}
              <DimensionCard
                id="risques"
                icon={ShieldCheck}
                iconBg="bg-violet-50"
                iconColor="text-violet-500"
                title="Risques"
                weight="/30"
                measure="Procédures et alertes en cours"
                source="RNIC"
              >
                <p className="mb-4 text-sm text-slate-600">
                  Chaque copropriété démarre avec 30 points.
                  Les procédures actives entraînent des
                  pénalités cumulatives. Le score ne peut pas
                  descendre en dessous de 0.
                </p>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Pénalités
                </h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-400">
                      <th className="pb-2 font-medium">Procédure</th>
                      <th className="pb-2 text-right font-medium">Pénalité</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Administration provisoire</td>
                      <td className="py-1.5 text-right font-semibold text-red-600">−20</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Péril imminent (L.511-19)</td>
                      <td className="py-1.5 text-right font-semibold text-red-600">−18</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Plan de péril / PDP</td>
                      <td className="py-1.5 text-right font-semibold text-red-600">−15</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Insalubrité</td>
                      <td className="py-1.5 text-right font-semibold text-red-600">−12</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Péril ordinaire (L.511-11)</td>
                      <td className="py-1.5 text-right font-semibold text-red-600">−10</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Équipements communs</td>
                      <td className="py-1.5 text-right font-semibold text-red-600">−8</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Mandat ad hoc</td>
                      <td className="py-1.5 text-right font-semibold text-red-600">−5</td>
                    </tr>
                  </tbody>
                </table>
              </DimensionCard>

              {/* Dimension: Gouvernance */}
              <DimensionCard
                id="gouvernance"
                icon={Users}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
                title="Gouvernance"
                weight="/25"
                measure="Qualité de la gestion"
                source="RNIC"
              >
                <p className="mb-4 text-sm text-slate-600">
                  Le type de syndic est le principal déterminant. Un syndic
                  professionnel indique généralement une gestion
                  plus structurée, tandis qu'un syndic
                  bénévole peut convenir aux petites
                  copropriétés.
                </p>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Barème — Type de syndic
                </h4>
                <table className="mb-4 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-400">
                      <th className="pb-2 font-medium">Type de syndic</th>
                      <th className="pb-2 text-right font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Professionnel</td>
                      <td className="py-1.5 text-right font-semibold">22</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Coopératif</td>
                      <td className="py-1.5 text-right font-semibold">20</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">Bénévole</td>
                      <td className="py-1.5 text-right font-semibold">15</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400">Non renseigné</td>
                      <td className="py-1.5 text-right font-semibold">8</td>
                    </tr>
                  </tbody>
                </table>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Bonus
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  <li>
                    <strong>Taille adaptée</strong> : +3 pts si syndic
                    professionnel et plus de 10 lots
                  </li>
                  <li>
                    <strong>Fonds travaux</strong> : +2 pts si cotisation au fonds
                    travaux renseignée et &gt; 0
                  </li>
                </ul>
              </DimensionCard>

              {/* Dimension: Énergie */}
              <DimensionCard
                id="energie"
                icon={Zap}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
                title="Énergie"
                weight="/20"
                measure="Performance énergétique"
                source="DPE ADEME (13,5 M diagnostics), complété par RNIC"
              >
                <p className="mb-4 text-sm text-slate-600">
                  Lorsqu'un DPE est disponible, la classe énergétique
                  détermine directement le score. Sinon, une estimation est
                  faite à partir de la période de construction.
                </p>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Barème — Classe DPE
                </h4>
                <table className="mb-4 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-400">
                      <th className="pb-2 font-medium">Classe</th>
                      <th className="pb-2 text-right font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    {[
                      ["A", "20", "#319834"],
                      ["B", "17", "#33cc31"],
                      ["C", "14", "#9aca3c"],
                      ["D", "11", "#fbfe06"],
                      ["E", "8", "#fbcc05"],
                      ["F", "4", "#fc9935"],
                      ["G", "2", "#fc0205"],
                    ].map(([cls, pts, color]) => (
                      <tr key={cls} className="border-b border-slate-100">
                        <td className="py-1.5">
                          <span
                            className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {cls}
                          </span>
                          Classe {cls}
                        </td>
                        <td className="py-1.5 text-right font-semibold">{pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Estimation sans DPE (fallback)
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  <li>
                    Après 2011 (RT2012+) : <strong>14 pts</strong> (estimé classe C)
                  </li>
                  <li>
                    1975–2010 : <strong>10 pts</strong>
                  </li>
                  <li>
                    Avant 1975 : <strong>6 pts</strong> (statistiquement
                    énergivore)
                  </li>
                  <li>
                    Période inconnue : <strong>10 pts</strong> (neutre)
                  </li>
                </ul>
              </DimensionCard>

              {/* Dimension: Marché */}
              <DimensionCard
                id="marche"
                icon={TrendingUp}
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
                title="Marché"
                weight="/20"
                measure="Dynamique immobilière du quartier"
                source="DVF (Demandes de Valeurs Foncières) — rayon 500m, 3 dernières années"
              >
                <p className="mb-4 text-sm text-slate-600">
                  Le score marché reflète la dynamique des prix
                  immobiliers autour de la copropriété.
                  L'évolution annuelle du prix au m² sur les 3
                  dernières années est le principal indicateur.
                  Un minimum de 3 transactions dans le rayon est requis.
                </p>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Barème — Évolution annuelle
                </h4>
                <table className="mb-4 w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-slate-400">
                      <th className="pb-2 font-medium">Évolution</th>
                      <th className="pb-2 text-right font-medium">Points</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-600">
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">≥ +10 %</td>
                      <td className="py-1.5 text-right font-semibold">20</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">+5 à +10 %</td>
                      <td className="py-1.5 text-right font-semibold">17</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">0 à +5 %</td>
                      <td className="py-1.5 text-right font-semibold">14</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">−5 à 0 %</td>
                      <td className="py-1.5 text-right font-semibold">11</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">−10 à −5 %</td>
                      <td className="py-1.5 text-right font-semibold">8</td>
                    </tr>
                    <tr className="border-b border-slate-100">
                      <td className="py-1.5">&lt; −10 %</td>
                      <td className="py-1.5 text-right font-semibold">4</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 text-slate-400">Données insuffisantes</td>
                      <td className="py-1.5 text-right font-semibold">10</td>
                    </tr>
                  </tbody>
                </table>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">
                  Ajustement
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  <li>Évolution &gt; +5 % : <strong>+2 pts</strong> bonus</li>
                  <li>Évolution &lt; −5 % : <strong>−2 pts</strong> malus</li>
                </ul>
              </DimensionCard>

              {/* ─── Indice de confiance ─── */}
              <section id="confiance" className="mb-16 scroll-mt-24">
                <h2 className="mb-6 text-2xl font-bold text-slate-900">
                  Indice de confiance
                </h2>
                <div className="space-y-4 text-base leading-relaxed text-slate-600">
                  <p>
                    Chaque fiche affiche un <strong>indice de confiance</strong> en
                    pourcentage. Il représente la proportion de champs
                    effectivement renseignés parmi ceux utilisés pour
                    le calcul du score, pondérée par leur importance.
                  </p>
                  <p>
                    Les données du RNIC sont déclaratives : leur
                    complétude varie fortement d'une copropriété
                    à l'autre. Un indice de confiance élevé
                    (&gt; 80 %) signifie que le score repose sur des
                    données solides. Un indice faible invite à la
                    prudence dans l'interprétation.
                  </p>
                </div>
                <div className="mt-6 overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-left text-xs text-slate-400">
                        <th className="px-4 py-2.5 font-medium">Champ</th>
                        <th className="px-4 py-2.5 text-right font-medium">Poids</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      {[
                        ["Type de syndic", "3"],
                        ["DPE (classe)", "3"],
                        ["Période de construction", "2"],
                        ["Plan de péril", "2"],
                        ["Données marché (DVF)", "2"],
                        ["Nombre de lots", "1"],
                      ].map(([field, weight]) => (
                        <tr key={field} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2">{field}</td>
                          <td className="px-4 py-2 text-right font-semibold">{weight}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  Moyenne nationale : environ 70 %
                </p>
              </section>

              {/* ─── Sources de données ─── */}
              <section id="sources" className="mb-16 scroll-mt-24">
                <h2 className="mb-6 text-2xl font-bold text-slate-900">
                  Sources de données
                </h2>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50 text-left text-xs text-slate-400">
                        <th className="whitespace-nowrap px-4 py-2.5 font-medium">Source</th>
                        <th className="whitespace-nowrap px-4 py-2.5 font-medium">Éditeur</th>
                        <th className="whitespace-nowrap px-4 py-2.5 font-medium">Licence</th>
                        <th className="whitespace-nowrap px-4 py-2.5 font-medium">Volume</th>
                        <th className="whitespace-nowrap px-4 py-2.5 font-medium">MAJ</th>
                        <th className="whitespace-nowrap px-4 py-2.5 font-medium">Lien</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      <tr className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900">RNIC</td>
                        <td className="px-4 py-2.5">ANAH / DGALN</td>
                        <td className="px-4 py-2.5">Licence Ouverte v2</td>
                        <td className="px-4 py-2.5">619 402 copros</td>
                        <td className="px-4 py-2.5">Trimestrielle</td>
                        <td className="px-4 py-2.5">
                          <a
                            href="https://data.gouv.fr/fr/datasets/registre-national-dimmatriculation-des-coproprietes/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                          >
                            data.gouv.fr <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900">DVF</td>
                        <td className="px-4 py-2.5">DGFiP</td>
                        <td className="px-4 py-2.5">Licence Ouverte v2</td>
                        <td className="px-4 py-2.5">1 025 444 ventes</td>
                        <td className="px-4 py-2.5">Semestrielle</td>
                        <td className="px-4 py-2.5">
                          <a
                            href="https://data.gouv.fr/fr/datasets/demandes-de-valeurs-foncieres/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                          >
                            data.gouv.fr <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100">
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900">DPE ADEME</td>
                        <td className="px-4 py-2.5">ADEME</td>
                        <td className="px-4 py-2.5">Licence Ouverte v2</td>
                        <td className="px-4 py-2.5">13,5 M diagnostics</td>
                        <td className="px-4 py-2.5">Continue</td>
                        <td className="px-4 py-2.5">
                          <a
                            href="https://data.ademe.fr/datasets/dpe-v2-logements-existants"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                          >
                            data.ademe.fr <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap px-4 py-2.5 font-medium text-slate-900">BAN</td>
                        <td className="px-4 py-2.5">IGN / Etalab</td>
                        <td className="px-4 py-2.5">Licence Ouverte v2</td>
                        <td className="px-4 py-2.5">99,99 % géolocalisés</td>
                        <td className="px-4 py-2.5">Continue</td>
                        <td className="px-4 py-2.5">
                          <a
                            href="https://adresse.data.gouv.fr/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-700 hover:underline"
                          >
                            adresse.data.gouv.fr <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* ─── Limites ─── */}
              <section id="limites" className="mb-16 scroll-mt-24">
                <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-slate-900">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                  Limites et transparence
                </h2>
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-6">
                  <ul className="space-y-3 text-sm leading-relaxed text-slate-700">
                    <li className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                      <span>
                        Le score est <strong>indicatif</strong> et ne constitue
                        pas un diagnostic officiel. Il ne peut se substituer
                        à l'avis d'un professionnel.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                      <span>
                        Les données RNIC sont <strong>déclaratives</strong>{" "}
                        et peuvent être incomplètes ou obsolètes.
                        Les syndics ne mettent pas tous à jour le registre
                        avec la même régularité.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                      <span>
                        Les données financières (charges,
                        impáyés, montant du fonds travaux) ne
                        figurent pas dans l'open data et ne sont donc pas
                        prises en compte.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                      <span>
                        Le DPE collectif n'est disponible que pour environ{" "}
                        <strong>11 %</strong> des copropriétés.
                        Pour les autres, le score énergie est estimé
                        à partir de la période de construction.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 shrink-0 text-amber-500">•</span>
                      <span>
                        Le score ne remplace pas un <strong>audit technique</strong>,
                        un <strong>DTG</strong> (diagnostic technique global) ou
                        un <strong>PPT</strong> (plan pluriannuel de travaux).
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* ─── Contact ─── */}
              <section id="contact" className="scroll-mt-24">
                <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-6 text-center">
                  <Mail className="mx-auto mb-3 h-6 w-6 text-teal-600" />
                  <p className="text-base text-slate-700">
                    Une question sur notre méthodologie ?
                  </p>
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="mt-1 inline-block text-base font-semibold text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
                </div>
              </section>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* ---------- DimensionCard sub-component ---------- */

function DimensionCard({
  id,
  icon: Icon,
  iconBg,
  iconColor,
  title,
  weight,
  measure,
  source,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  weight: string;
  measure: string;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-24">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3 sm:gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {title}{" "}
              <span className="text-sm font-normal text-slate-400">
                ({weight})
              </span>
            </h3>
            <p className="text-sm text-slate-500">{measure}</p>
          </div>
        </div>

        {/* Content (tables, lists, etc.) */}
        <div className="overflow-x-auto">{children}</div>

        {/* Source */}
        <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
          Source : {source}
        </p>
      </div>
    </section>
  );
}
