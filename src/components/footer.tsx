import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <Link href="/" className="text-lg font-bold text-slate-900">
              Copro<span className="text-emerald-500">Score</span>
            </Link>
            <p className="mt-2 text-sm text-slate-500">
              Score de sant&eacute; pour les copropri&eacute;t&eacute;s en France,
              bas&eacute; sur les donn&eacute;es publiques ouvertes.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Sources de donn&eacute;es</h4>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li>RNIC &mdash; Registre National des Copropri&eacute;t&eacute;s</li>
              <li>DVF &mdash; Demandes de Valeurs Fonci&egrave;res</li>
              <li>ADEME &mdash; Diagnostics de Performance &Eacute;nerg&eacute;tique</li>
              <li>BAN &mdash; Base Adresse Nationale</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-slate-900">Mentions l&eacute;gales</h4>
            <ul className="space-y-1.5 text-sm text-slate-500">
              <li>Les scores sont calcul&eacute;s &agrave; titre indicatif</li>
              <li>Donn&eacute;es issues de sources publiques ouvertes</li>
              <li>Pas de conseil financier ou juridique</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} CoproScore. Tous droits r&eacute;serv&eacute;s.
          Donn&eacute;es publiques issues du RNIC, DVF et ADEME.
        </div>
      </div>
    </footer>
  );
}
