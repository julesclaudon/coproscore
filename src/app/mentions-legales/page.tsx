import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: false },
};

export default function MentionsLegalesPage() {
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
            <span className="text-slate-600">Mentions légales</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Mentions légales
          </h1>
        </div>
      </section>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-10">
          <div className="space-y-10">
            {/* Éditeur */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Éditeur du site
              </h2>
              <div className="space-y-2 text-base leading-relaxed text-slate-600">
                <p>
                  Le site{" "}
                  <strong>coproscore.fr</strong> est édité par :
                </p>
                <p>
                  <strong>ComKeys</strong> — SIRET 940 509 474 00018
                </p>
                <p>60 rue François Ier, 75008 Paris</p>
                <p>Directeur de la publication : Jules Claudon</p>
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

            {/* Hébergement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Hébergement
              </h2>
              <div className="space-y-2 text-base leading-relaxed text-slate-600">
                <p>
                  <strong>OVH SAS</strong>
                </p>
                <p>2 rue Kellermann, 59100 Roubaix, France</p>
                <p>
                  <a
                    href="https://www.ovhcloud.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline"
                  >
                    www.ovhcloud.com
                  </a>
                </p>
              </div>
            </section>

            {/* Nature du site */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Nature du site
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  CoproScore est une plateforme d'information basée
                  sur des données publiques ouvertes :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>RNIC</strong> — Registre National
                    d'Immatriculation des Copropriétés
                  </li>
                  <li>
                    <strong>DVF</strong> — Demandes de Valeurs
                    Foncières
                  </li>
                  <li>
                    <strong>ADEME / DPE</strong> — Diagnostics de
                    Performance Énergétique
                  </li>
                </ul>
                <p>
                  Ces données sont mises à disposition sous{" "}
                  <strong>Licence Ouverte / Open Licence version 2.0</strong>{" "}
                  via{" "}
                  <a
                    href="https://data.gouv.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline"
                  >
                    data.gouv.fr
                  </a>{" "}
                  et{" "}
                  <a
                    href="https://data.ademe.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline"
                  >
                    data.ademe.fr
                  </a>
                  .
                </p>
              </div>
            </section>

            {/* Scores et avertissement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Scores et avertissement
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Les scores CoproScore sont calculés
                  algorithmiquement à titre purement indicatif. Ils{" "}
                  <strong>
                    ne constituent en aucun cas un diagnostic immobilier
                  </strong>
                  , un conseil financier ou juridique.
                </p>
                <p>
                  Les données utilisées sont déclaratives
                  et peuvent être incomplètes ou erronées.
                  CoproScore ne saurait être tenu responsable des
                  décisions prises sur la base de ces informations.
                </p>
                <p>
                  Pour tout projet immobilier, il est recommandé de
                  consulter un professionnel qualifié.
                </p>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Propriété intellectuelle
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le contenu du site (textes, design, code, algorithmes de
                  scoring) est protégé par le droit
                  d'auteur. Toute reproduction non autorisée est
                  interdite.
                </p>
                <p>
                  Les données brutes proviennent de sources publiques
                  sous Licence Ouverte.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Cookies
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  CoproScore n'utilise aucun cookie de tracking ni cookie
                  publicitaire.
                </p>
                <p>
                  Seuls des cookies techniques strictement nécessaires
                  au fonctionnement du site (session d'authentification)
                  sont utilisés.
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
                    href="/cgv"
                    className="text-teal-700 hover:underline"
                  >
                    Conditions Générales de Vente
                  </Link>
                </li>
                <li>
                  <Link
                    href="/confidentialite"
                    className="text-teal-700 hover:underline"
                  >
                    Politique de Confidentialité
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
