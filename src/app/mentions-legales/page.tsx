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
              <div className="space-y-2 text-base leading-relaxed text-slate-600">
                <p>
                  Le site{" "}
                  <strong>coproscore.fr</strong> est &eacute;dit&eacute; par :
                </p>
                <p>
                  <strong>Jules Claudon</strong> &mdash; ComKeys, entrepreneur
                  individuel
                </p>
                <p>Adresse : [adresse &agrave; compl&eacute;ter]</p>
                <p>SIRET : [&agrave; compl&eacute;ter]</p>
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

            {/* Directeur de la publication */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Directeur de la publication
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                Jules Claudon
              </p>
            </section>

            {/* Hébergement */}
            <section>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                H&eacute;bergement
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
                  CoproScore est une plateforme d&apos;information bas&eacute;e
                  sur des donn&eacute;es publiques ouvertes :
                </p>
                <ul className="list-disc space-y-1 pl-6">
                  <li>
                    <strong>RNIC</strong> &mdash; Registre National
                    d&apos;Immatriculation des Copropri&eacute;t&eacute;s
                  </li>
                  <li>
                    <strong>DVF</strong> &mdash; Demandes de Valeurs
                    Fonci&egrave;res
                  </li>
                  <li>
                    <strong>ADEME / DPE</strong> &mdash; Diagnostics de
                    Performance &Eacute;nerg&eacute;tique
                  </li>
                </ul>
                <p>
                  Ces donn&eacute;es sont mises &agrave; disposition sous{" "}
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
                  Les scores CoproScore sont calcul&eacute;s
                  algorithmiquement &agrave; titre purement indicatif. Ils{" "}
                  <strong>
                    ne constituent en aucun cas un diagnostic immobilier
                  </strong>
                  , un conseil financier ou juridique.
                </p>
                <p>
                  Les donn&eacute;es utilis&eacute;es sont d&eacute;claratives
                  et peuvent &ecirc;tre incompl&egrave;tes ou erron&eacute;es.
                  CoproScore ne saurait &ecirc;tre tenu responsable des
                  d&eacute;cisions prises sur la base de ces informations.
                </p>
                <p>
                  Pour tout projet immobilier, il est recommand&eacute; de
                  consulter un professionnel qualifi&eacute;.
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
                  Le contenu du site (textes, design, code, algorithmes de
                  scoring) est prot&eacute;g&eacute; par le droit
                  d&apos;auteur. Toute reproduction non autoris&eacute;e est
                  interdite.
                </p>
                <p>
                  Les donn&eacute;es brutes proviennent de sources publiques
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
                  CoproScore n&apos;utilise aucun cookie de tracking ni cookie
                  publicitaire.
                </p>
                <p>
                  Seuls des cookies techniques strictement n&eacute;cessaires
                  au fonctionnement du site (session d&apos;authentification)
                  sont utilis&eacute;s.
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
                    Conditions G&eacute;n&eacute;rales de Vente
                  </Link>
                </li>
                <li>
                  <Link
                    href="/confidentialite"
                    className="text-teal-700 hover:underline"
                  >
                    Politique de Confidentialit&eacute;
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
