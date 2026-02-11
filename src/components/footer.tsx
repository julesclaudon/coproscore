import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold text-white">
              Copro<span className="text-teal-400">Score</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Score de sant&eacute; pour les 619 402 copropri&eacute;t&eacute;s
              en France, enti&egrave;rement bas&eacute; sur les donn&eacute;es
              publiques ouvertes.
            </p>
          </div>

          {/* Sources */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Sources de donn&eacute;es</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>RNIC &mdash; Registre National des Copropri&eacute;t&eacute;s</li>
              <li>DVF &mdash; Demandes de Valeurs Fonci&egrave;res</li>
              <li>ADEME &mdash; Diagnostics &Eacute;nerg&eacute;tiques</li>
              <li>BAN &mdash; Base Adresse Nationale</li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="transition-colors hover:text-teal-400">
                  Rechercher une copropri&eacute;t&eacute;
                </Link>
              </li>
              <li>
                <Link href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris" className="transition-colors hover:text-teal-400">
                  Exemple de fiche
                </Link>
              </li>
              <li>
                <Link href="/carte" className="transition-colors hover:text-teal-400">
                  Carte heatmap
                </Link>
              </li>
              <li>
                <Link href="/comparateur" className="transition-colors hover:text-teal-400">
                  Comparateur
                </Link>
              </li>
              <li>
                <Link href="/historique" className="transition-colors hover:text-teal-400">
                  Historique
                </Link>
              </li>
              <li>
                <Link href="/favoris" className="transition-colors hover:text-teal-400">
                  Favoris
                </Link>
              </li>
              <li>
                <Link href="/alertes" className="transition-colors hover:text-teal-400">
                  Mes alertes
                </Link>
              </li>
              <li>
                <Link href="/methodologie" className="transition-colors hover:text-teal-400">
                  M&eacute;thodologie
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="transition-colors hover:text-teal-400">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">L&eacute;gal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/mentions-legales" className="transition-colors hover:text-teal-400">
                  Mentions l&eacute;gales
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="transition-colors hover:text-teal-400">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="transition-colors hover:text-teal-400">
                  Confidentialit&eacute;
                </Link>
              </li>
              <li>Les scores sont calcul&eacute;s &agrave; titre indicatif</li>
              <li>Pas de conseil financier ou juridique</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} CoproScore. Tous droits r&eacute;serv&eacute;s.
          Donn&eacute;es publiques issues du RNIC, DVF et ADEME.
        </div>
      </div>
    </footer>
  );
}
