"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Home,
  ChevronRight,
  Check,
  Search,
  FileDown,
  Crown,
  ChevronDown,
  Loader2,
  Settings,
} from "lucide-react";

/* ---------- Tier data ---------- */

const TIERS = [
  {
    id: "gratuit",
    name: "Fiche Copro",
    audience: "Pour les curieux et copropri\u00e9taires",
    icon: Search,
    features: [
      "Score global 0\u2013100 avec jauge visuelle",
      "5 dimensions : Technique, Risques, Gouvernance, \u00c9nergie, March\u00e9",
      "Carte Leaflet avec localisation",
      "Prix moyen au m\u00b2 du secteur (DVF)",
      "Infos cl\u00e9s RNIC : syndic, lots, construction",
      "2 copropri\u00e9t\u00e9s voisines",
    ],
    cta: "Rechercher une copropri\u00e9t\u00e9",
    ctaHref: "/recherche",
    highlighted: false,
  },
  {
    id: "rapport",
    name: "Rapport Complet",
    audience: "Pour les acheteurs et investisseurs",
    icon: FileDown,
    includes: "Tout le contenu gratuit, plus :",
    features: [
      "30 derni\u00e8res transactions DVF d\u00e9taill\u00e9es (500m)",
      "Comparatif \u00e9largi : 15\u201320 copros voisines avec scores",
      "Analyse IA : points forts, vigilances, recommandations",
      "D\u00e9tail complet de chaque sous-score avec explication",
      "\u00c9volution prix/m\u00b2 sur 3 ans (graphique)",
      "PDF pro horodat\u00e9 avec branding CoproScore",
    ],
    cta: "T\u00e9l\u00e9charger le rapport \u2014 4,90\u00a0\u20ac",
    ctaHref: "/recherche",
    highlighted: true,
    badge: "Recommand\u00e9",
  },
  {
    id: "pro",
    name: "Acc\u00e8s Pro",
    audience: "Pour les professionnels de l\u2019immobilier",
    icon: Crown,
    includes: "Tout le rapport, plus :",
    features: [
      "Rapports PDF illimit\u00e9s",
      "Comparateur multi-copros (2\u20135 side-by-side)",
      "Export CSV / Excel des donn\u00e9es DVF",
      "Badge \u00ab Rapport v\u00e9rifi\u00e9 CoproScore \u00bb",
      "Historique de recherches sauvegard\u00e9",
      "Alertes email : changement de score, DPE, syndic",
      "Support prioritaire",
    ],
    cta: "S\u2019abonner \u2014 29\u00a0\u20ac/mois",
    ctaHref: "#",
    highlighted: false,
  },
];

/* ---------- FAQ data ---------- */

const FAQ = [
  {
    q: "Quelles donn\u00e9es utilisez-vous pour calculer le score\u00a0?",
    a: "CoproScore croise quatre bases de donn\u00e9es publiques ouvertes\u00a0: le Registre National des Copropri\u00e9t\u00e9s (RNIC, 619\u00a0402 copros), les Demandes de Valeurs Fonci\u00e8res (DVF, 1\u00a0M de transactions), les Diagnostics \u00c9nerg\u00e9tiques de l\u2019ADEME (13,5\u00a0M de DPE) et la Base Adresse Nationale (BAN). Aucune donn\u00e9e priv\u00e9e n\u2019est utilis\u00e9e.",
  },
  {
    q: "Le score est-il fiable\u00a0?",
    a: "Le score est un indicateur synth\u00e9tique bas\u00e9 sur des donn\u00e9es d\u00e9claratives. Il ne remplace pas un audit technique ou un DTG. Chaque fiche affiche un indice de confiance refl\u00e9tant la compl\u00e9tude des donn\u00e9es. Consultez notre page M\u00e9thodologie pour le d\u00e9tail des calculs.",
  },
  {
    q: "Puis-je annuler mon abonnement Pro\u00a0?",
    a: "Oui, \u00e0 tout moment depuis votre espace client. L\u2019annulation prend effet \u00e0 la fin de la p\u00e9riode en cours. L\u2019essai gratuit de 14 jours n\u2019est pas factur\u00e9 si vous annulez avant la fin.",
  },
  {
    q: "Le rapport PDF est-il utilisable pour une transaction\u00a0?",
    a: "Le rapport est un document d\u2019information. Il peut \u00eatre partag\u00e9 avec votre notaire, banquier ou agent immobilier comme support d\u2019aide \u00e0 la d\u00e9cision, mais il ne constitue pas un diagnostic officiel au sens r\u00e9glementaire.",
  },
  {
    q: "Les donn\u00e9es sont-elles \u00e0 jour\u00a0?",
    a: "Le RNIC est mis \u00e0 jour trimestriellement, le DVF semestriellement, et les DPE ADEME en continu. Nous int\u00e9grons chaque nouvelle version d\u00e8s sa publication. La date de derni\u00e8re mise \u00e0 jour est affich\u00e9e sur chaque fiche.",
  },
];

/* ---------- Page ---------- */

export default function TarifsPage() {
  return (
    <Suspense>
      <TarifsContent />
    </Suspense>
  );
}

function TarifsContent() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [proLoading, setProLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const isPro = session?.user?.role === "PRO" || session?.user?.role === "ADMIN";
  const proSuccess = searchParams.get("pro") === "success";

  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    if (proSuccess) setShowBanner(true);
  }, [proSuccess]);

  async function handleProCheckout() {
    if (status !== "authenticated") {
      window.location.href = "/connexion";
      return;
    }
    setProLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout-pro", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 409) {
        window.location.reload();
        return;
      }
      throw new Error(data.error || "Erreur");
    } catch {
      alert("Erreur lors de la redirection vers le paiement.");
      setProLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error(data.error || "Erreur");
    } catch {
      alert("Erreur lors de l\u2019acc\u00e8s au portail de facturation.");
      setPortalLoading(false);
    }
  }

  const proPrice = annual ? "290" : "29";
  const proPeriod = annual ? "/an" : "/mois";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <Header />

      {/* Success banner */}
      {showBanner && (
        <div className="border-b border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-800">
          Votre abonnement Pro est actif ! Vous avez désormais accès à toutes les fonctionnalités.
        </div>
      )}

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
            <span className="text-slate-600">Tarifs</span>
          </nav>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Des tarifs simples et transparents
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-500">
            Consultez gratuitement le score de n&apos;importe quelle copropri&eacute;t&eacute;.
            Besoin de plus de d&eacute;tails&nbsp;? T&eacute;l&eacute;chargez un rapport ou
            passez au Pro.
          </p>

          {/* Annual / Monthly toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-1.5 py-1.5 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                !annual
                  ? "bg-teal-600 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                annual
                  ? "bg-teal-600 text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Annuel
              <span className="ml-1.5 rounded-full bg-teal-100 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                Bient\u00f4t
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-3 py-10 sm:px-4 sm:py-16">
          <div className="grid items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              const isRapport = tier.id === "rapport";
              const isProTier = tier.id === "pro";

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border p-6 sm:p-8 ${
                    isRapport
                      ? "border-2 border-teal-500 bg-white shadow-lg shadow-teal-100/50 lg:-mt-4 lg:mb-4"
                      : isProTier
                        ? "border-slate-200 bg-slate-900 text-white"
                        : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Badge */}
                  {tier.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-teal-600 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                        {tier.badge}
                      </span>
                    </div>
                  )}

                  {/* Icon + name */}
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        isRapport ? "bg-teal-50" : isProTier ? "bg-teal-600" : "bg-slate-50"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isRapport ? "text-teal-600" : isProTier ? "text-white" : "text-slate-500"
                        }`}
                      />
                    </div>
                    <h2 className={`text-lg font-bold ${isProTier ? "text-white" : "text-slate-900"}`}>
                      {tier.name}
                    </h2>
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    {tier.id === "gratuit" && (
                      <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                        Gratuit
                      </p>
                    )}
                    {isRapport && (
                      <p className="text-3xl font-bold text-slate-900 sm:text-4xl">
                        4,90&nbsp;&euro;
                        <span className="text-base font-normal text-slate-400">
                          {" "}/ rapport
                        </span>
                      </p>
                    )}
                    {isProTier && (
                      <p className="text-3xl font-bold text-white sm:text-4xl">
                        {proPrice}&nbsp;&euro;
                        <span className="text-base font-normal text-slate-400">
                          {" "}{proPeriod}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Audience */}
                  <p className={`mb-6 text-sm ${isProTier ? "text-slate-400" : "text-slate-500"}`}>{tier.audience}</p>

                  {/* CTA */}
                  {tier.id === "gratuit" || isRapport ? (
                    <Link href={tier.ctaHref} className="block">
                      <Button
                        variant={isRapport ? "default" : "outline"}
                        className={`w-full py-5 text-sm font-semibold ${
                          isRapport ? "bg-teal-600 text-white hover:bg-teal-700" : ""
                        }`}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  ) : isProTier && isPro ? (
                    <Button
                      onClick={handlePortal}
                      disabled={portalLoading}
                      className="w-full bg-teal-500 py-5 text-sm font-semibold text-white hover:bg-teal-600"
                    >
                      {portalLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Chargement...
                        </>
                      ) : (
                        <>
                          <Settings className="mr-2 h-4 w-4" />
                          G\u00e9rer mon abonnement
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleProCheckout}
                      disabled={proLoading}
                      className="w-full bg-teal-500 py-5 text-sm font-semibold text-white hover:bg-teal-600"
                    >
                      {proLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Redirection...
                        </>
                      ) : (
                        tier.cta
                      )}
                    </Button>
                  )}

                  {/* Divider */}
                  <div className={`my-6 border-t ${isProTier ? "border-slate-700" : "border-slate-100"}`} />

                  {/* Includes mention */}
                  {tier.includes && (
                    <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${isProTier ? "text-slate-500" : "text-slate-400"}`}>
                      {tier.includes}
                    </p>
                  )}

                  {/* Feature list */}
                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className={`flex gap-2.5 text-sm ${isProTier ? "text-slate-300" : "text-slate-600"}`}>
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-teal-500"
                        />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Annual savings callout */}
          {annual && (
            <div className="mx-auto mt-8 max-w-md rounded-lg border border-slate-200 bg-slate-50/50 px-5 py-3 text-center text-sm text-slate-500">
              L&apos;abonnement annuel sera bient\u00f4t disponible.
            </div>
          )}

          {/* ─── FAQ ─── */}
          <section className="mx-auto mt-20 max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Questions fr&eacute;quentes
            </h2>

            <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
              {FAQ.map((item, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50 sm:px-6 sm:text-base"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
