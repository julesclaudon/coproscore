import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Home, ChevronRight, ArrowRight, BookOpen } from "lucide-react";
import { articles } from "./articles";

export const metadata: Metadata = {
  title: "Guides copropriété — CoproScore",
  description:
    "Guides pratiques pour comprendre les scores de copropriété, le DPE, les types de syndic et les risques à vérifier avant un achat immobilier.",
  alternates: {
    canonical: "https://coproscore.fr/guides",
  },
};

export default function GuidesIndexPage() {
  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://coproscore.fr" },
      { "@type": "ListItem", position: 2, name: "Guides" },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      <Header />

      <main className="flex-1">
        <section className="border-b bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
            <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
              <Link href="/" className="flex items-center gap-1 transition-colors hover:text-teal-700">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Accueil</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-slate-600">Guides</span>
            </nav>

            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Guides copropriété
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Tout comprendre sur les scores de copropriété, le DPE, la gouvernance
              et les risques à vérifier avant un achat immobilier.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-4">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/guides/${article.slug}`}
                className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 transition-colors hover:border-teal-300 hover:bg-teal-50/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-slate-900 group-hover:text-teal-700">
                    {article.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    {article.description}
                  </p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
