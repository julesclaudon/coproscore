import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Home, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  robots: { index: false, follow: false },
};

export default function CgvPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Copro<span className="text-teal-600">Score</span>
          </Link>
          <span className="text-sm text-slate-300">/</span>
          <span className="text-sm text-slate-500">CGV</span>
        </div>
      </header>

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
        </div>
      </section>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-base leading-relaxed text-slate-600">
              Les conditions g&eacute;n&eacute;rales de vente seront
              publi&eacute;es lors de l&apos;activation du service de rapports
              payants.
            </p>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              La consultation des scores est <strong>gratuite</strong> et sans
              engagement.
            </p>
            <p className="mt-6 text-sm text-slate-400">
              Pour toute question :{" "}
              <a
                href="mailto:contact@coproscore.fr"
                className="text-teal-700 hover:underline"
              >
                contact@coproscore.fr
              </a>
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
