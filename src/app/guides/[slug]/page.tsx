import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Home, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { articles, getArticleBySlug } from "../articles";

/* ---------- Static params ---------- */

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

/* ---------- Metadata ---------- */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  return {
    title: `${article.title} — CoproScore`,
    description: article.description,
    alternates: {
      canonical: `https://coproscore.fr/guides/${slug}`,
    },
  };
}

/* ---------- Page ---------- */

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Organization",
      name: "CoproScore",
      url: "https://coproscore.fr",
    },
    publisher: {
      "@type": "Organization",
      name: "CoproScore",
      url: "https://coproscore.fr",
    },
    mainEntityOfPage: `https://coproscore.fr/guides/${slug}`,
  };

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://coproscore.fr" },
      { "@type": "ListItem", position: 2, name: "Guides", item: "https://coproscore.fr/guides" },
      { "@type": "ListItem", position: 3, name: article.title },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbfc]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b bg-white">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
            <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-400">
              <Link href="/" className="flex items-center gap-1 transition-colors hover:text-teal-700">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Accueil</span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href="/guides" className="transition-colors hover:text-teal-700">
                Guides
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="truncate text-slate-600">{article.title}</span>
            </nav>

            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl lg:text-3xl">
              {article.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Publié le {new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_200px]">
            {/* Article */}
            <article className="prose prose-slate max-w-none prose-headings:scroll-mt-20 prose-headings:text-slate-900 prose-h2:mt-10 prose-h2:text-lg prose-h2:font-bold prose-h3:text-base prose-h3:font-semibold prose-p:leading-relaxed prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline prose-li:marker:text-teal-500">
              {article.content}
            </article>

            {/* TOC sidebar — desktop */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Sommaire
                </p>
                <nav className="space-y-2">
                  {article.toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block text-sm text-slate-500 transition-colors hover:text-teal-700"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-6 text-center sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">
              Vérifiez le score de votre copropriété
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Recherchez parmi 619 402 copropriétés en France et accédez à l'analyse
              complète : score, DPE, prix au m², historique.
            </p>
            <Link href="/" className="mt-5 inline-block">
              <Button className="gap-2 bg-teal-600 px-6 py-3 text-white hover:bg-teal-700">
                <Search className="h-4 w-4" />
                Rechercher ma copropriété
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
