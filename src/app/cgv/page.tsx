import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  robots: { index: false, follow: false },
};

export default function CgvPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-slate-50 to-white py-8 sm:py-12">
        <div className="mx-auto max-w-3xl px-4">
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-teal-700"
            >
              <Home className="h-3.5 w-3.5" />
              Accueil
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-600">CGV</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Conditions Générales de Vente
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Dernière mise à jour : février 2026
          </p>
        </div>
      </section>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-10">
          <div className="space-y-10">
            {/* Article 1 — Objet */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 1 — Objet
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les présentes Conditions Générales de
                  Vente (CGV) régissent les ventes de services
                  proposés par CoproScore, édité par Jules
                  Claudon — ComKeys, entrepreneur individuel, à
                  tout utilisateur du site{" "}
                  <strong>coproscore.fr</strong> (ci-après
                  « le Client »).
                </p>
                <p>Les services proposés sont :</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Rapport PDF unitaire</strong> — analyse
                    détaillée d'une copropriété
                    au format PDF, au prix de{" "}
                    <strong>4,90 € TTC</strong> l'unité.
                  </li>
                  <li>
                    <strong>Abonnement Pro</strong> — accès
                    illimité aux fonctionnalités avancées
                    (rapports PDF, export de données, comparateur
                    étendu, alertes), au prix de{" "}
                    <strong>29 €/mois TTC</strong>.
                  </li>
                </ul>
                <p>
                  Toute commande implique l'acceptation sans réserve
                  des présentes CGV.
                </p>
              </div>
            </section>

            {/* Article 2 — Prix */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 2 — Prix
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les prix sont indiqués en euros, toutes taxes comprises
                  (TTC). CoproScore se réserve le droit de modifier ses
                  tarifs à tout moment. Les services sont facturés
                  au prix en vigueur au moment de la validation de la commande.
                </p>
              </div>
            </section>

            {/* Article 3 — Paiement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 3 — Paiement
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le paiement s'effectue par carte bancaire de
                  manière sécurisée via la plateforme{" "}
                  <strong>Stripe</strong>. CoproScore ne stocke aucune
                  donnée bancaire.
                </p>
                <p>
                  Pour l'abonnement Pro, le prélèvement est
                  récurrent et intervient chaque mois à la date
                  anniversaire de la souscription.
                </p>
              </div>
            </section>

            {/* Article 4 — Livraison */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 4 — Livraison
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  La livraison des services est{" "}
                  <strong>immédiate</strong> :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Rapport PDF</strong> : téléchargement
                    disponible instantanément après paiement.
                  </li>
                  <li>
                    <strong>Abonnement Pro</strong> : accès immédiat
                    à l'ensemble des fonctionnalités Pro
                    dès la confirmation du paiement.
                  </li>
                </ul>
              </div>
            </section>

            {/* Article 5 — Droit de rétractation */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 5 — Droit de rétractation
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  <strong>Abonnement Pro</strong> : conformément aux
                  articles L221-18 et suivants du Code de la consommation, le
                  Client dispose d'un délai de{" "}
                  <strong>14 jours</strong> à compter de la souscription
                  pour exercer son droit de rétractation, sans avoir
                  à motiver sa décision. La demande doit
                  être adressée à{" "}
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
                  .
                </p>
                <p>
                  <strong>Rapport PDF (contenu numérique)</strong> :
                  conformément à l'article L221-28 du Code de
                  la consommation, le droit de rétractation ne peut
                  être exercé pour les contenus numériques
                  fournis immédiatement avec le{" "}
                  <strong>consentement exprès</strong> du Client et son
                  renoncement exprès au droit de rétractation.
                </p>
                <p>
                  Lors de l'achat d'un rapport PDF, le Client
                  reconnaît expressément consentir à
                  l'exécution immédiate du service et
                  renoncer à son droit de rétractation.
                </p>
              </div>
            </section>

            {/* Article 6 — Résiliation */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 6 — Résiliation de l'abonnement Pro
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le Client peut résilier son abonnement Pro{" "}
                  <strong>à tout moment</strong> depuis son espace
                  personnel ou en contactant{" "}
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
                  .
                </p>
                <p>
                  La résiliation prend effet à la fin de la
                  période de facturation en cours. Le Client conserve
                  l'accès aux fonctionnalités Pro
                  jusqu'à cette date.
                </p>
              </div>
            </section>

            {/* Article 7 — Responsabilité */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 7 — Responsabilité
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les données présentées sur CoproScore
                  proviennent de sources publiques (RNIC, DVF, ADEME).
                  CoproScore{" "}
                  <strong>ne garantit pas l'exactitude</strong>,
                  l'exhaustivité ni l'actualité de ces
                  données.
                </p>
                <p>
                  Les scores sont calculés algorithmiquement à
                  titre indicatif et ne constituent ni un diagnostic immobilier,
                  ni un conseil financier ou juridique.
                </p>
                <p>
                  CoproScore ne saurait être tenu responsable des
                  décisions prises par le Client sur la base des
                  informations fournies.
                </p>
              </div>
            </section>

            {/* Article 8 — Données personnelles */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 8 — Données personnelles
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le traitement des données personnelles est
                  détaillé dans notre{" "}
                  <Link
                    href="/confidentialite"
                    className="text-teal-700 hover:underline"
                  >
                    Politique de Confidentialité
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Article 9 — Droit applicable */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 9 — Droit applicable et litiges
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les présentes CGV sont soumises au droit
                  français. En cas de litige, les parties
                  s'engagent à rechercher une solution amiable avant
                  toute action judiciaire.
                </p>
                <p>
                  Conformément à l'article L612-1 du Code de
                  la consommation, le Client peut recourir gratuitement à
                  un médiateur de la consommation en cas de litige non
                  résolu.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Contact
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                Pour toute question relative aux présentes CGV :{" "}
                <a
                  href="mailto:contact@coproscore.fr"
                  className="text-teal-700 hover:underline"
                >
                  contact@coproscore.fr
                </a>
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
