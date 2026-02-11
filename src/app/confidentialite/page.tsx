import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  robots: { index: false, follow: false },
};

export default function ConfidentialitePage() {
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
            <span className="text-slate-600">
              Politique de confidentialit&eacute;
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Politique de Confidentialit&eacute;
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Derni&egrave;re mise &agrave; jour : f&eacute;vrier 2026
          </p>
        </div>
      </section>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-10">
          <div className="space-y-10">
            {/* Responsable du traitement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Responsable du traitement
              </h2>
              <div className="space-y-2 text-base leading-relaxed text-slate-600">
                <p>
                  Le responsable du traitement des donn&eacute;es personnelles
                  est :
                </p>
                <p>
                  <strong>Jules Claudon</strong> &mdash; ComKeys, entrepreneur
                  individuel
                </p>
                <p>
                  Email :{" "}
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
                </p>
              </div>
            </section>

            {/* Données collectées */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Donn&eacute;es collect&eacute;es
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Dans le cadre de l&apos;utilisation du site coproscore.fr,
                  les donn&eacute;es suivantes peuvent &ecirc;tre
                  collect&eacute;es :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Adresse email</strong> &mdash; lors de la
                    cr&eacute;ation de compte
                  </li>
                  <li>
                    <strong>Mot de passe</strong> &mdash; stock&eacute; sous
                    forme hash&eacute;e (non lisible)
                  </li>
                  <li>
                    <strong>Historique de recherche</strong> &mdash;
                    copropri&eacute;t&eacute;s consult&eacute;es
                  </li>
                  <li>
                    <strong>Favoris</strong> &mdash;
                    copropri&eacute;t&eacute;s enregistr&eacute;es
                  </li>
                </ul>
                <p>
                  Aucune donn&eacute;e personnelle n&apos;est collect&eacute;e
                  lors de la simple consultation des scores sans compte.
                </p>
              </div>
            </section>

            {/* Base légale */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Base l&eacute;gale du traitement
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le traitement des donn&eacute;es personnelles repose sur les
                  bases l&eacute;gales suivantes :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Consentement</strong> &mdash; lors de
                    l&apos;inscription et de la cr&eacute;ation de compte
                    (article 6.1.a du RGPD)
                  </li>
                  <li>
                    <strong>Ex&eacute;cution du contrat</strong> &mdash; pour
                    la fourniture des services li&eacute;s &agrave;
                    l&apos;abonnement Pro et aux rapports PDF (article 6.1.b
                    du RGPD)
                  </li>
                </ul>
              </div>
            </section>

            {/* Finalités */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Finalit&eacute;s du traitement
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>Les donn&eacute;es collect&eacute;es sont utilis&eacute;es pour :</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    G&eacute;rer votre compte utilisateur et
                    l&apos;authentification
                  </li>
                  <li>
                    Fournir les services souscrits (rapports PDF, acc&egrave;s
                    Pro)
                  </li>
                  <li>Sauvegarder vos recherches et favoris</li>
                  <li>Envoyer les alertes email auxquelles vous &ecirc;tes abonn&eacute;(e)</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Cookies
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  CoproScore utilise uniquement des{" "}
                  <strong>cookies techniques de session</strong>, strictement
                  n&eacute;cessaires au fonctionnement du site et &agrave;
                  l&apos;authentification.
                </p>
                <p>
                  Aucun cookie de tracking, publicitaire ou analytique
                  n&apos;est utilis&eacute;. Aucun bandeau de consentement
                  n&apos;est donc n&eacute;cessaire.
                </p>
              </div>
            </section>

            {/* Hébergement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                H&eacute;bergement des donn&eacute;es
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les donn&eacute;es sont h&eacute;berg&eacute;es en{" "}
                  <strong>France</strong> par :
                </p>
                <p>
                  <strong>OVH SAS</strong> &mdash; 2 rue Kellermann, 59100
                  Roubaix, France
                </p>
                <p>
                  Aucun transfert de donn&eacute;es personnelles en dehors de
                  l&apos;Union Europ&eacute;enne n&apos;est effectu&eacute;.
                </p>
              </div>
            </section>

            {/* Durée de conservation */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Dur&eacute;e de conservation
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les donn&eacute;es personnelles sont conserv&eacute;es
                  pendant la dur&eacute;e de vie de votre compte.
                </p>
                <p>
                  En cas de suppression de votre compte, vos donn&eacute;es
                  sont conserv&eacute;es pendant une dur&eacute;e
                  maximale de <strong>3 ans</strong> apr&egrave;s la
                  suppression, conform&eacute;ment aux obligations
                  l&eacute;gales, puis d&eacute;finitivement
                  supprim&eacute;es.
                </p>
              </div>
            </section>

            {/* Droits */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Vos droits
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Conform&eacute;ment au R&egrave;glement
                  G&eacute;n&eacute;ral sur la Protection des
                  Donn&eacute;es (RGPD), vous disposez des droits
                  suivants :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Droit d&apos;acc&egrave;s</strong> &mdash; obtenir
                    une copie de vos donn&eacute;es personnelles
                  </li>
                  <li>
                    <strong>Droit de rectification</strong> &mdash; corriger
                    des donn&eacute;es inexactes ou incompl&egrave;tes
                  </li>
                  <li>
                    <strong>Droit de suppression</strong> &mdash; demander
                    l&apos;effacement de vos donn&eacute;es
                  </li>
                  <li>
                    <strong>Droit &agrave; la portabilit&eacute;</strong>{" "}
                    &mdash; recevoir vos donn&eacute;es dans un format
                    structur&eacute;
                  </li>
                  <li>
                    <strong>Droit d&apos;opposition</strong> &mdash;
                    vous opposer au traitement de vos donn&eacute;es
                  </li>
                  <li>
                    <strong>Droit &agrave; la limitation</strong> &mdash;
                    demander la limitation du traitement
                  </li>
                </ul>
                <p>
                  Pour exercer ces droits, contactez-nous &agrave; :{" "}
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
                </p>
                <p>
                  Nous nous engageons &agrave; r&eacute;pondre &agrave; votre
                  demande dans un d&eacute;lai de 30 jours.
                </p>
              </div>
            </section>

            {/* CNIL */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                R&eacute;clamation aupr&egrave;s de la CNIL
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Si vous estimez que le traitement de vos donn&eacute;es ne
                  respecte pas la r&eacute;glementation, vous pouvez introduire
                  une r&eacute;clamation aupr&egrave;s de la{" "}
                  <strong>
                    Commission Nationale de l&apos;Informatique et des
                    Libert&eacute;s (CNIL)
                  </strong>{" "}
                  :
                </p>
                <p>
                  <a
                    href="https://www.cnil.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline"
                  >
                    www.cnil.fr
                  </a>{" "}
                  &mdash; 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
                </p>
              </div>
            </section>

            {/* Engagement RGPD */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Engagement RGPD
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le responsable du traitement s&apos;engage &agrave; respecter
                  le R&egrave;glement G&eacute;n&eacute;ral sur la Protection
                  des Donn&eacute;es (RGPD) et &agrave; mettre en &oelig;uvre
                  les mesures techniques et organisationnelles
                  n&eacute;cessaires pour assurer la s&eacute;curit&eacute; et
                  la confidentialit&eacute; des donn&eacute;es personnelles.
                </p>
              </div>
            </section>

            {/* Liens */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Liens utiles
              </h2>
              <ul className="space-y-2 text-base text-slate-600">
                <li>
                  <Link
                    href="/mentions-legales"
                    className="text-teal-700 hover:underline"
                  >
                    Mentions l&eacute;gales
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cgv"
                    className="text-teal-700 hover:underline"
                  >
                    Conditions G&eacute;n&eacute;rales de Vente
                  </Link>
                </li>
              </ul>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
