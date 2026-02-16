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
              Politique de confidentialité
            </span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Politique de Confidentialité
          </h1>
          <p className="mt-3 text-base text-slate-500">
            Dernière mise à jour : février 2026
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
                  Le responsable du traitement des données personnelles
                  est :
                </p>
                <p>
                  <strong>ComKeys</strong> — SIRET 940 509 474 00018
                </p>
                <p>60 rue François Ier, 75008 Paris</p>
                <p>Responsable : Jules Claudon</p>
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
                Données collectées
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Dans le cadre de l'utilisation du site coproscore.fr,
                  les données suivantes peuvent être
                  collectées :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Adresse email</strong> — lors de la
                    création de compte
                  </li>
                  <li>
                    <strong>Mot de passe</strong> — stocké sous
                    forme hashée (non lisible)
                  </li>
                  <li>
                    <strong>Historique de recherche</strong> —
                    copropriétés consultées
                  </li>
                  <li>
                    <strong>Favoris</strong> —
                    copropriétés enregistrées
                  </li>
                </ul>
                <p>
                  Aucune donnée personnelle n'est collectée
                  lors de la simple consultation des scores sans compte.
                </p>
              </div>
            </section>

            {/* Base légale */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Base légale du traitement
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le traitement des données personnelles repose sur les
                  bases légales suivantes :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Consentement</strong> — lors de
                    l'inscription et de la création de compte
                    (article 6.1.a du RGPD)
                  </li>
                  <li>
                    <strong>Exécution du contrat</strong> — pour
                    la fourniture des services liés à
                    l'abonnement Pro et aux rapports PDF (article 6.1.b
                    du RGPD)
                  </li>
                </ul>
              </div>
            </section>

            {/* Finalités */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Finalités du traitement
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>Les données collectées sont utilisées pour :</p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    Gérer votre compte utilisateur et
                    l'authentification
                  </li>
                  <li>
                    Fournir les services souscrits (rapports PDF, accès
                    Pro)
                  </li>
                  <li>Sauvegarder vos recherches et favoris</li>
                  <li>Envoyer les alertes email auxquelles vous êtes abonné(e)</li>
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
                  nécessaires au fonctionnement du site et à
                  l'authentification.
                </p>
                <p>
                  Aucun cookie de tracking, publicitaire ou analytique
                  n'est utilisé. Aucun bandeau de consentement
                  n'est donc nécessaire.
                </p>
              </div>
            </section>

            {/* Hébergement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Hébergement des données
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les données sont hébergées en{" "}
                  <strong>France</strong> par :
                </p>
                <p>
                  <strong>OVH SAS</strong> — 2 rue Kellermann, 59100
                  Roubaix, France
                </p>
                <p>
                  Aucun transfert de données personnelles en dehors de
                  l'Union Européenne n'est effectué.
                </p>
              </div>
            </section>

            {/* Durée de conservation */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Durée de conservation
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les données personnelles sont conservées
                  pendant la durée de vie de votre compte.
                </p>
                <p>
                  En cas de suppression de votre compte, vos données
                  sont conservées pendant une durée
                  maximale de <strong>3 ans</strong> après la
                  suppression, conformément aux obligations
                  légales, puis définitivement
                  supprimées.
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
                  Conformément au Règlement
                  Général sur la Protection des
                  Données (RGPD), vous disposez des droits
                  suivants :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>Droit d'accès</strong> — obtenir
                    une copie de vos données personnelles
                  </li>
                  <li>
                    <strong>Droit de rectification</strong> — corriger
                    des données inexactes ou incomplètes
                  </li>
                  <li>
                    <strong>Droit de suppression</strong> — demander
                    l'effacement de vos données
                  </li>
                  <li>
                    <strong>Droit à la portabilité</strong>{" "}
                    — recevoir vos données dans un format
                    structuré
                  </li>
                  <li>
                    <strong>Droit d'opposition</strong> —
                    vous opposer au traitement de vos données
                  </li>
                  <li>
                    <strong>Droit à la limitation</strong> —
                    demander la limitation du traitement
                  </li>
                </ul>
                <p>
                  Pour exercer ces droits, contactez-nous à :{" "}
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
                </p>
                <p>
                  Nous nous engageons à répondre à votre
                  demande dans un délai de 30 jours.
                </p>
              </div>
            </section>

            {/* CNIL */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Réclamation auprès de la CNIL
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Si vous estimez que le traitement de vos données ne
                  respecte pas la réglementation, vous pouvez introduire
                  une réclamation auprès de la{" "}
                  <strong>
                    Commission Nationale de l'Informatique et des
                    Libertés (CNIL)
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
                  — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07
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
                  Le responsable du traitement s'engage à respecter
                  le Règlement Général sur la Protection
                  des Données (RGPD) et à mettre en œuvre
                  les mesures techniques et organisationnelles
                  nécessaires pour assurer la sécurité et
                  la confidentialité des données personnelles.
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
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cgv"
                    className="text-teal-700 hover:underline"
                  >
                    Conditions Générales de Vente
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
