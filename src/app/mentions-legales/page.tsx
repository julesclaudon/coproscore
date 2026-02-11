import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Mentions légales",
  robots: { index: false, follow: false },
};

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-yellow-50 px-2 py-0.5 text-yellow-800">
      {children}
    </span>
  );
}

export default function MentionsLegalesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
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
            <span className="text-slate-600">Mentions l&eacute;gales</span>
          </nav>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Mentions l&eacute;gales
          </h1>
        </div>
      </section>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-10">
          <div className="space-y-10">
            {/* Éditeur */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                &Eacute;diteur du site
              </h2>
              <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                &Agrave; compl&eacute;ter avant mise en production
              </div>
              <div className="space-y-2 text-base leading-relaxed text-slate-600">
                <p>
                  CoproScore est &eacute;dit&eacute; par{" "}
                  <Placeholder>[NOM SOCI&Eacute;T&Eacute; / NOM PERSONNE]</Placeholder>
                </p>
                <p>
                  Adresse : <Placeholder>[Adresse]</Placeholder>
                </p>
                <p>Email : contact@coproscore.fr</p>
                <p>
                  Directeur de publication :{" "}
                  <Placeholder>[Nom]</Placeholder>
                </p>
              </div>
            </section>

            {/* Hébergement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                H&eacute;bergement
              </h2>
              <div className="space-y-2 text-base leading-relaxed text-slate-600">
                <p>
                  <strong>Vercel Inc.</strong>
                </p>
                <p>340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                <p>
                  <a
                    href="https://vercel.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-700 hover:underline"
                  >
                    https://vercel.com
                  </a>
                </p>
              </div>
            </section>

            {/* Données personnelles */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Donn&eacute;es personnelles
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  CoproScore ne collecte aucune donn&eacute;e personnelle lors de
                  la consultation des scores.
                </p>
                <p>
                  Les donn&eacute;es affich&eacute;es sont exclusivement des
                  donn&eacute;es publiques issues de{" "}
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
                  , mises &agrave; disposition sous{" "}
                  <strong>Licence Ouverte / Open Licence version 2.0</strong>.
                </p>
                <p>
                  En cas d&apos;exercice de vos droits (acc&egrave;s,
                  rectification, suppression), contactez :{" "}
                  <a
                    href="mailto:contact@coproscore.fr"
                    className="text-teal-700 hover:underline"
                  >
                    contact@coproscore.fr
                  </a>
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
                  CoproScore n&apos;utilise aucun cookie de tracking ni cookie
                  publicitaire.
                </p>
                <p>
                  Seuls des cookies techniques strictement n&eacute;cessaires au
                  fonctionnement du site peuvent &ecirc;tre utilis&eacute;s.
                </p>
              </div>
            </section>

            {/* Propriété intellectuelle */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Propri&eacute;t&eacute; intellectuelle
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  Le contenu du site (textes, design, code) est prot&eacute;g&eacute;
                  par le droit d&apos;auteur.
                </p>
                <p>
                  Les donn&eacute;es brutes proviennent de sources publiques sous
                  Licence Ouverte.
                </p>
                <p>
                  Le score CoproScore est un indicateur calcul&eacute; et ne
                  constitue pas un diagnostic officiel.
                </p>
              </div>
            </section>

            {/* Responsabilité */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Responsabilit&eacute;
              </h2>
              <div className="space-y-3 text-base leading-relaxed text-slate-600">
                <p>
                  CoproScore fournit des informations &agrave; titre indicatif
                  uniquement.
                </p>
                <p>
                  Les scores sont calcul&eacute;s &agrave; partir de donn&eacute;es
                  d&eacute;claratives qui peuvent &ecirc;tre incompl&egrave;tes ou
                  erron&eacute;es.
                </p>
                <p>
                  CoproScore ne saurait &ecirc;tre tenu responsable des
                  d&eacute;cisions prises sur la base de ces informations.
                </p>
                <p>
                  Pour tout projet immobilier, il est recommand&eacute; de
                  consulter un professionnel.
                </p>
              </div>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
