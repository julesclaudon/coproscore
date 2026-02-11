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
            Conditions G&eacute;n&eacute;rales de Vente
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Derni&egrave;re mise &agrave; jour : f&eacute;vrier 2026
          </p>
        </div>
      </section>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-10">
          <div className="space-y-10">
            {/* Article 1 — Objet */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 1 &mdash; Objet
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales de
                  Vente (CGV) r&eacute;gissent les ventes de services
                  propos&eacute;s par CoproScore, &eacute;dit&eacute; par Jules
                  Claudon &mdash; ComKeys, entrepreneur individuel, &agrave;
                  tout utilisateur du site{" "}
                  <strong>coproscore.fr</strong> (ci-apr&egrave;s
                  &laquo;&nbsp;le Client&nbsp;&raquo;).
                </p>
                <p>Les services propos&eacute;s sont :</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Rapport PDF unitaire</strong> &mdash; analyse
                    d&eacute;taill&eacute;e d&apos;une copropri&eacute;t&eacute;
                    au format PDF, au prix de{" "}
                    <strong>4,90&nbsp;&euro; TTC</strong> l&apos;unit&eacute;.
                  </li>
                  <li>
                    <strong>Abonnement Pro</strong> &mdash; acc&egrave;s
                    illimit&eacute; aux fonctionnalit&eacute;s avanc&eacute;es
                    (rapports PDF, export de donn&eacute;es, comparateur
                    &eacute;tendu, alertes), au prix de{" "}
                    <strong>29&nbsp;&euro;/mois TTC</strong>.
                  </li>
                </ul>
                <p>
                  Toute commande implique l&apos;acceptation sans r&eacute;serve
                  des pr&eacute;sentes CGV.
                </p>
              </div>
            </section>

            {/* Article 2 — Prix */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 2 &mdash; Prix
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les prix sont indiqu&eacute;s en euros, toutes taxes comprises
                  (TTC). CoproScore se r&eacute;serve le droit de modifier ses
                  tarifs &agrave; tout moment. Les services sont factur&eacute;s
                  au prix en vigueur au moment de la validation de la commande.
                </p>
              </div>
            </section>

            {/* Article 3 — Paiement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 3 &mdash; Paiement
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le paiement s&apos;effectue par carte bancaire de
                  mani&egrave;re s&eacute;curis&eacute;e via la plateforme{" "}
                  <strong>Stripe</strong>. CoproScore ne stocke aucune
                  donn&eacute;e bancaire.
                </p>
                <p>
                  Pour l&apos;abonnement Pro, le pr&eacute;l&egrave;vement est
                  r&eacute;current et intervient chaque mois &agrave; la date
                  anniversaire de la souscription.
                </p>
              </div>
            </section>

            {/* Article 4 — Livraison */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 4 &mdash; Livraison
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  La livraison des services est{" "}
                  <strong>imm&eacute;diate</strong> :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Rapport PDF</strong> : t&eacute;l&eacute;chargement
                    disponible instantan&eacute;ment apr&egrave;s paiement.
                  </li>
                  <li>
                    <strong>Abonnement Pro</strong> : acc&egrave;s imm&eacute;diat
                    &agrave; l&apos;ensemble des fonctionnalit&eacute;s Pro
                    d&egrave;s la confirmation du paiement.
                  </li>
                </ul>
              </div>
            </section>

            {/* Article 5 — Droit de rétractation */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 5 &mdash; Droit de r&eacute;tractation
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  <strong>Abonnement Pro</strong> : conform&eacute;ment aux
                  articles L221-18 et suivants du Code de la consommation, le
                  Client dispose d&apos;un d&eacute;lai de{" "}
                  <strong>14 jours</strong> &agrave; compter de la souscription
                  pour exercer son droit de r&eacute;tractation, sans avoir
                  &agrave; motiver sa d&eacute;cision. La demande doit
                  &ecirc;tre adress&eacute;e &agrave;{" "}
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
                  .
                </p>
                <p>
                  <strong>Rapport PDF (contenu num&eacute;rique)</strong> :
                  conform&eacute;ment &agrave; l&apos;article L221-28 du Code de
                  la consommation, le droit de r&eacute;tractation ne peut
                  &ecirc;tre exerc&eacute; pour les contenus num&eacute;riques
                  fournis imm&eacute;diatement avec le{" "}
                  <strong>consentement expr&egrave;s</strong> du Client et son
                  renoncement expr&egrave;s au droit de r&eacute;tractation.
                </p>
                <p>
                  Lors de l&apos;achat d&apos;un rapport PDF, le Client
                  reconna&icirc;t express&eacute;ment consentir &agrave;
                  l&apos;ex&eacute;cution imm&eacute;diate du service et
                  renoncer &agrave; son droit de r&eacute;tractation.
                </p>
              </div>
            </section>

            {/* Article 6 — Résiliation */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 6 &mdash; R&eacute;siliation de l&apos;abonnement Pro
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le Client peut r&eacute;silier son abonnement Pro{" "}
                  <strong>&agrave; tout moment</strong> depuis son espace
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
                  La r&eacute;siliation prend effet &agrave; la fin de la
                  p&eacute;riode de facturation en cours. Le Client conserve
                  l&apos;acc&egrave;s aux fonctionnalit&eacute;s Pro
                  jusqu&apos;&agrave; cette date.
                </p>
              </div>
            </section>

            {/* Article 7 — Responsabilité */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 7 &mdash; Responsabilit&eacute;
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les donn&eacute;es pr&eacute;sent&eacute;es sur CoproScore
                  proviennent de sources publiques (RNIC, DVF, ADEME).
                  CoproScore{" "}
                  <strong>ne garantit pas l&apos;exactitude</strong>,
                  l&apos;exhaustivit&eacute; ni l&apos;actualit&eacute; de ces
                  donn&eacute;es.
                </p>
                <p>
                  Les scores sont calcul&eacute;s algorithmiquement &agrave;
                  titre indicatif et ne constituent ni un diagnostic immobilier,
                  ni un conseil financier ou juridique.
                </p>
                <p>
                  CoproScore ne saurait &ecirc;tre tenu responsable des
                  d&eacute;cisions prises par le Client sur la base des
                  informations fournies.
                </p>
              </div>
            </section>

            {/* Article 8 — Données personnelles */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 8 &mdash; Donn&eacute;es personnelles
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le traitement des donn&eacute;es personnelles est
                  d&eacute;taill&eacute; dans notre{" "}
                  <Link
                    href="/confidentialite"
                    className="text-teal-700 hover:underline"
                  >
                    Politique de Confidentialit&eacute;
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Article 9 — Droit applicable */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Article 9 &mdash; Droit applicable et litiges
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les pr&eacute;sentes CGV sont soumises au droit
                  fran&ccedil;ais. En cas de litige, les parties
                  s&apos;engagent &agrave; rechercher une solution amiable avant
                  toute action judiciaire.
                </p>
                <p>
                  Conform&eacute;ment &agrave; l&apos;article L612-1 du Code de
                  la consommation, le Client peut recourir gratuitement &agrave;
                  un m&eacute;diateur de la consommation en cas de litige non
                  r&eacute;solu.
                </p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Contact
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                Pour toute question relative aux pr&eacute;sentes CGV :{" "}
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
