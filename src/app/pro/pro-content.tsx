"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import {
  Building2,
  Search,
  ShieldCheck,
  Scale,
  CheckCircle2,
  ArrowRight,
  Crown,
  FileDown,
  BarChart3,
  Database,
  Target,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ═══════════════════ Intersection Observer hook ═══════════════════ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

/* ═══════════════════ Animated counter ═══════════════════ */

function AnimatedCounter({ target, duration = 1600, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView(0.3);

  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(ease * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString("fr-FR")}{suffix}
    </span>
  );
}

/* ═══════════════════ Stagger fade-in wrapper ═══════════════════ */

function FadeInStagger({ children, index }: { children: ReactNode; index: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${index * 100}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════ Scale-in wrapper ═══════════════════ */

function ScaleIn({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.95)",
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════ Slide-in from left ═══════════════════ */

function SlideInLeft({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInView(0.2);
  return (
    <div
      ref={ref}
      className={`transition-all duration-800 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-40px)",
      }}
    >
      {children}
    </div>
  );
}

/* ═══════════════════ SVG wave separator ═══════════════════ */

function WaveSeparator({ flip = false, from = "fill-white", to = "bg-slate-50" }: { flip?: boolean; from?: string; to?: string }) {
  return (
    <div className={`relative -mb-px ${to}`}>
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        className={`block w-full ${flip ? "rotate-180" : ""}`}
        style={{ height: "clamp(28px, 4vw, 56px)" }}
      >
        <path
          d="M0,32 C360,56 720,0 1080,28 C1260,42 1380,48 1440,40 L1440,0 L0,0 Z"
          className={from}
        />
      </svg>
    </div>
  );
}

/* ═══════════════════ Data ═══════════════════ */

const AUDIENCES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Building2,
    title: "Agents immobiliers",
    description:
      "Intégrez un score de santé vérifié dans vos mandats et dossiers de vente. Rassurez vos acquéreurs avec des données objectives.",
  },
  {
    icon: Search,
    title: "Chasseurs immobiliers",
    description:
      "Analysez 10 à 20 copropriétés en quelques minutes pour vos clients. Comparez les scores et identifiez les meilleures opportunités.",
  },
  {
    icon: ShieldCheck,
    title: "Syndics de copropriété",
    description:
      "Benchmarkez votre parc, identifiez les copropriétés à risque et anticipez les travaux grâce aux scores détaillés.",
  },
  {
    icon: Scale,
    title: "Notaires / CGP",
    description:
      "Complétez votre devoir d'information avec des données objectives et un rapport PDF horodaté à joindre au dossier.",
  },
];

const ARGUMENTS: { icon: LucideIcon; numericValue: number; suffix: string; label: string; detail: string }[] = [
  {
    icon: Database,
    numericValue: 619402,
    suffix: "",
    label: "copropriétés analysées",
    detail: "Couverture nationale complète issue du RNIC",
  },
  {
    icon: BarChart3,
    numericValue: 4,
    suffix: " sources",
    label: "de données publiques croisées",
    detail: "RNIC, DVF, ADEME/DPE et Base Adresse Nationale",
  },
  {
    icon: Target,
    numericValue: 5,
    suffix: " dimensions",
    label: "de scoring objectif",
    detail: "Technique, Risques, Gouvernance, Énergie, Marché",
  },
  {
    icon: FileDown,
    numericValue: 0,
    suffix: "PDF pro",
    label: "rapports horodatés",
    detail: "Téléchargement immédiat, branding professionnel",
  },
];

const PRO_FEATURES = [
  "Rapports PDF illimités",
  "Comparateur multi-copros (2 à 5 côte à côte)",
  "Export CSV / Excel des données DVF",
  "Analyse IA : points forts, vigilances, recommandations",
  "Alertes email : changement de score, DPE, syndic",
  "Historique de recherches sauvegardé",
  "Support prioritaire",
];

const HERO_STATS = [
  { label: "619K copros", icon: Database },
  { label: "4 sources croisées", icon: BarChart3 },
  { label: "5 dimensions", icon: Target },
  { label: "PDF instantané", icon: FileDown },
];

/* ═══════════════════ Main component ═══════════════════ */

export function ProContent() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      {/* ─── Hero — animated dark premium ─── */}
      <section className="pro-hero relative overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Radial glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:py-28">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
            <Crown className="h-3.5 w-3.5" />
            Offre Professionnels
          </span>
          <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
            CoproScore pour les professionnels
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400">
            Rassurez vos clients, fiabilisez vos dossiers, gagnez du temps.
            Accédez à l'analyse complète de toutes les copropriétés de France.
          </p>

          {/* Hero stat badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {HERO_STATS.map((s) => {
              const Icon = s.icon;
              return (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-800/60 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm"
                >
                  <Icon className="h-3 w-3 text-teal-400" />
                  {s.label}
                </span>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tarifs"
              className="pro-cta-glow inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:scale-[1.03] hover:bg-teal-400 hover:shadow-teal-500/40 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              Découvrir l'offre Pro
            </Link>
            <Link
              href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-6 py-3.5 text-base font-medium text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:border-slate-600 hover:bg-slate-700 hover:text-white active:scale-[0.98]"
            >
              Voir un exemple de fiche
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Wave: dark → white */}
      <WaveSeparator from="fill-slate-900" to="bg-white" />

      {/* ─── Pour qui ? — white, staggered fade-in ─── */}
      <section className="bg-white pb-16 pt-10 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Pour qui ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
            CoproScore Pro s'adresse à tous les acteurs de l'immobilier qui ont
            besoin de données fiables sur les copropriétés.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <FadeInStagger key={a.title} index={i}>
                  <div className="group rounded-xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-50 transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-teal-50 group-hover:to-cyan-50">
                        <Icon className="h-5 w-5 text-slate-500 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {a.title}
                        </h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                          {a.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </FadeInStagger>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wave: white → slate-50 */}
      <WaveSeparator from="fill-white" to="bg-slate-50" />

      {/* ─── Pourquoi CoproScore ? — slate-50, animated counters ─── */}
      <section className="bg-slate-50 pb-16 pt-10 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Pourquoi CoproScore ?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
            Des données publiques croisées, un scoring objectif et transparent.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ARGUMENTS.map((a, i) => {
              const Icon = a.icon;
              return (
                <FadeInStagger key={a.label} index={i}>
                  <div className="group rounded-xl border border-slate-200 bg-white p-5 text-center transition-all duration-300 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/5">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-teal-100 group-hover:to-cyan-100">
                      <Icon className="h-5 w-5 text-teal-600" />
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {a.numericValue > 0 ? (
                        <AnimatedCounter
                          target={a.numericValue}
                          suffix={a.suffix}
                          duration={a.numericValue > 100 ? 2000 : 1200}
                        />
                      ) : (
                        a.suffix
                      )}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">
                      {a.label}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      {a.detail}
                    </p>
                  </div>
                </FadeInStagger>
              );
            })}
          </div>
        </div>
      </section>

      {/* Wave: slate-50 → white */}
      <WaveSeparator from="fill-slate-50" to="bg-white" />

      {/* ─── Pricing — white, scale-in ─── */}
      <section className="bg-white pb-16 pt-10 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-2xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Une offre simple et transparente
          </h2>

          <ScaleIn className="mt-10">
            <div className="overflow-hidden rounded-2xl border-2 border-teal-500 bg-white shadow-lg transition-shadow duration-500 hover:shadow-xl hover:shadow-teal-500/10">
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 text-center">
                <p className="flex items-center justify-center gap-2 text-lg font-bold text-white">
                  <Crown className="h-5 w-5" />
                  Accès Pro
                </p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-slate-900">29 €</span>
                  <span className="text-base text-slate-500">/mois TTC</span>
                </div>
                <p className="mt-1 text-center text-sm text-slate-400">
                  ou 290 €/an (2 mois offerts)
                </p>

                <ul className="mt-6 space-y-3">
                  {PRO_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                      <span className="text-sm text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/tarifs"
                  className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-teal-700 hover:shadow-md active:scale-[0.98]"
                >
                  <Crown className="h-4 w-4" />
                  S'abonner
                </Link>
                <p className="mt-3 text-center text-xs text-slate-400">
                  14 jours d'essai gratuit · Résiliation à tout moment
                </p>
              </div>
            </div>
          </ScaleIn>
        </div>
      </section>

      {/* Diagonal separator → teal */}
      <div className="relative bg-gradient-to-r from-teal-700 to-teal-600">
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute -top-px left-0 block w-full"
          style={{ height: "clamp(20px, 3vw, 40px)" }}
        >
          <path d="M0,40 L1440,0 L1440,40 Z" className="fill-white" />
        </svg>
      </div>

      {/* ─── ROI — teal, slide-in ─── */}
      <section className="bg-gradient-to-r from-teal-700 to-teal-600 py-14 sm:py-16">
        <SlideInLeft className="mx-auto max-w-3xl px-4 text-center">
          <Zap className="mx-auto mb-4 h-8 w-8 text-teal-200" />
          <p className="text-2xl font-bold text-white sm:text-3xl">
            29 €/mois, c'est moins de 1 € par jour.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-teal-100">
            Une seule vente facilitée rembourse 5 ans d'abonnement.
            Intégrez CoproScore dans votre workflow et gagnez un avantage
            concurrentiel durable.
          </p>
        </SlideInLeft>
      </section>

      {/* Diagonal separator → dark */}
      <div className="relative bg-slate-900">
        <svg
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
          className="absolute -top-px left-0 block w-full"
          style={{ height: "clamp(20px, 3vw, 40px)" }}
        >
          <path d="M0,0 L1440,40 L0,40 Z" className="fill-teal-600" />
        </svg>
      </div>

      {/* ─── CTA final — dark premium ─── */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Prêt à passer Pro ?
          </h2>
          <p className="mt-3 text-base text-slate-400">
            Rejoignez les professionnels qui utilisent CoproScore pour
            fiabiliser leurs dossiers et gagner du temps.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/tarifs"
              className="pro-cta-glow inline-flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:scale-[1.03] hover:bg-teal-400 hover:shadow-teal-500/40 active:scale-[0.98]"
            >
              <Crown className="h-4 w-4" />
              Voir les tarifs et s'abonner
            </Link>
            <Link
              href="mailto:contact@coproscore.fr"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-8 py-4 text-base font-medium text-slate-300 transition-all duration-200 hover:scale-[1.02] hover:border-slate-600 hover:bg-slate-700 hover:text-white active:scale-[0.98]"
            >
              Une question ? Contactez-nous
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Inline styles for CSS-only animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .pro-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          background-size: 200% 200%;
          animation: pro-hero-gradient 8s ease infinite;
        }
        @keyframes pro-hero-gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .pro-cta-glow {
          animation: pro-glow 3s ease-in-out infinite;
        }
        @keyframes pro-glow {
          0%, 100% { box-shadow: 0 10px 25px -5px rgba(20, 184, 166, 0.25); }
          50% { box-shadow: 0 10px 35px -5px rgba(20, 184, 166, 0.45); }
        }
      ` }} />
    </div>
  );
}
