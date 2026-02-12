import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t-2 border-t-teal-500 bg-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="text-lg font-bold text-white">
              Copro<span className="text-teal-400">Score</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Score de santé pour les 619 402 copropriétés
              en France, entièrement basé sur les données
              publiques ouvertes.
            </p>
          </div>

          {/* Sources */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Sources de données</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>RNIC — Registre National des Copropriétés</li>
              <li>DVF — Demandes de Valeurs Foncières</li>
              <li>ADEME — Diagnostics Énergétiques</li>
              <li>BAN — Base Adresse Nationale</li>
            </ul>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/" className="transition-colors hover:text-teal-400 hover:underline">
                  Rechercher une copropriété
                </Link>
              </li>
              <li>
                <Link href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris" className="transition-colors hover:text-teal-400 hover:underline">
                  Exemple de fiche
                </Link>
              </li>
              <li>
                <Link href="/carte" className="transition-colors hover:text-teal-400 hover:underline">
                  Carte heatmap
                </Link>
              </li>
              <li>
                <Link href="/comparateur" className="transition-colors hover:text-teal-400 hover:underline">
                  Comparateur
                </Link>
              </li>
              <li>
                <Link href="/historique" className="transition-colors hover:text-teal-400 hover:underline">
                  Historique
                </Link>
              </li>
              <li>
                <Link href="/favoris" className="transition-colors hover:text-teal-400 hover:underline">
                  Favoris
                </Link>
              </li>
              <li>
                <Link href="/alertes" className="transition-colors hover:text-teal-400 hover:underline">
                  Mes alertes
                </Link>
              </li>
              <li>
                <Link href="/methodologie" className="transition-colors hover:text-teal-400 hover:underline">
                  Méthodologie
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="transition-colors hover:text-teal-400 hover:underline">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Légal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/mentions-legales" className="transition-colors hover:text-teal-400 hover:underline">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="transition-colors hover:text-teal-400 hover:underline">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="transition-colors hover:text-teal-400 hover:underline">
                  Confidentialité
                </Link>
              </li>
              <li>Les scores sont calculés à titre indicatif</li>
              <li>Pas de conseil financier ou juridique</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} CoproScore. Tous droits réservés.
          Données publiques issues du RNIC, DVF et ADEME.
        </div>
      </div>
    </footer>
  );
}
