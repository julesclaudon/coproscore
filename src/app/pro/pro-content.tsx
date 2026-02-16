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
  X as XIcon,
  Check,
  Quote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════
   Primitives
   ══════════════════════════════════════════════════════════════════ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedCounter({ target, duration = 1600, suffix = "" }: { target: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setCount(Math.round(ease * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [visible, target, duration]);
  return <span ref={ref}>{count.toLocaleString("fr-FR")}{suffix}</span>;
}

function FadeInStagger({ children, index }: { children: ReactNode; index: number }) {
  const { ref, visible } = useInView(0.08);
  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transitionDelay: `${index * 120}ms`,
      }}
    >
      {children}
    </div>
  );
}

function ScaleIn({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInView(0.12);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.93)" }}
    >
      {children}
    </div>
  );
}

function SlideInLeft({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { ref, visible } = useInView(0.2);
  return (
    <div
      ref={ref}
      className={`transition-all duration-[800ms] ease-out ${className}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-48px)" }}
    >
      {children}
    </div>
  );
}

/* Animated SVG donut ring */
function AnimatedRing({ color = "#14b8a6", size = 56, stroke = 3 }: { color?: string; size?: number; stroke?: number }) {
  const { ref, visible } = useInView(0.3);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg ref={ref as React.Ref<SVGSVGElement>} width={size} height={size} className="absolute inset-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={visible ? c * 0.15 : c}
        style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)", transform: "rotate(-90deg)", transformOrigin: "center" }}
        opacity={0.35}
      />
    </svg>
  );
}

/* Wave separator */
function Wave({ from, to }: { from: string; to: string }) {
  return (
    <div className={`relative -mb-px ${to}`}>
      <svg viewBox="0 0 1440 56" preserveAspectRatio="none" className="block w-full" style={{ height: "clamp(28px, 4vw, 56px)" }}>
        <path d="M0,32 C360,56 720,0 1080,28 C1260,42 1380,48 1440,40 L1440,0 L0,0 Z" className={from} />
      </svg>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Data
   ══════════════════════════════════════════════════════════════════ */

const AUDIENCES: { icon: LucideIcon; title: string; description: string; stat: string; gradient: string }[] = [
  { icon: Building2, title: "Agents immobiliers", description: "Intégrez un score de santé vérifié dans vos mandats et dossiers de vente. Rassurez vos acquéreurs avec des données objectives.", stat: "~500 mandats/an", gradient: "from-teal-500 to-cyan-400" },
  { icon: Search, title: "Chasseurs immobiliers", description: "Analysez 10 à 20 copropriétés en quelques minutes pour vos clients. Comparez les scores et identifiez les meilleures opportunités.", stat: "10-20 copros/semaine", gradient: "from-sky-500 to-blue-400" },
  { icon: ShieldCheck, title: "Syndics de copropriété", description: "Benchmarkez votre parc, identifiez les copropriétés à risque et anticipez les travaux grâce aux scores détaillés.", stat: "100+ copros gérées", gradient: "from-violet-500 to-purple-400" },
  { icon: Scale, title: "Notaires / CGP", description: "Complétez votre devoir d'information avec des données objectives et un rapport PDF horodaté à joindre au dossier.", stat: "1 rapport = 1 dossier", gradient: "from-amber-500 to-orange-400" },
];

const ARGUMENTS: { icon: LucideIcon; numericValue: number; suffix: string; label: string; detail: string; ringColor: string }[] = [
  { icon: Database, numericValue: 619402, suffix: "", label: "copropriétés analysées", detail: "Couverture nationale complète issue du RNIC", ringColor: "#14b8a6" },
  { icon: BarChart3, numericValue: 4, suffix: " sources", label: "de données croisées", detail: "RNIC, DVF, ADEME/DPE et Base Adresse Nationale", ringColor: "#0ea5e9" },
  { icon: Target, numericValue: 5, suffix: " dimensions", label: "de scoring objectif", detail: "Technique, Risques, Gouvernance, Énergie, Marché", ringColor: "#8b5cf6" },
  { icon: FileDown, numericValue: 0, suffix: "PDF pro", label: "rapports horodatés", detail: "Téléchargement immédiat, branding professionnel", ringColor: "#f59e0b" },
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

const COMPARISON = [
  { label: "Analyse d'une copropriété", without: "2h de recherches manuelles", with: "30 secondes, score + rapport" },
  { label: "Données fiables et croisées", without: "Données dispersées, incomplètes", with: "4 sources publiques croisées" },
  { label: "Rapport client professionnel", without: "Pas de livrable structuré", with: "PDF horodaté immédiat" },
];

const TESTIMONIALS: { initials: string; name: string; role: string; quote: string; bg: string }[] = [
  { initials: "SL", name: "Sophie L.", role: "Agent immobilier, Paris", quote: "CoproScore me permet de rassurer mes acquéreurs en 30 secondes. Le score de santé est devenu un argument de vente incontournable dans mes mandats.", bg: "bg-teal-500" },
  { initials: "MR", name: "Marc R.", role: "Chasseur immobilier, Lyon", quote: "J'analyse 15 copropriétés par semaine pour mes clients. Avant, ça me prenait une journée. Maintenant, c'est fait en une heure.", bg: "bg-sky-500" },
  { initials: "AD", name: "Anne D.", role: "Directrice de syndic, Bordeaux", quote: "Le benchmarking de notre parc nous a permis d'identifier 3 copropriétés en difficulté avant que la situation ne se dégrade.", bg: "bg-violet-500" },
];

const HERO_STATS = [
  { label: "619K copros", icon: Database },
  { label: "4 sources croisées", icon: BarChart3 },
  { label: "5 dimensions", icon: Target },
  { label: "PDF instantané", icon: FileDown },
];

/* ══════════════════════════════════════════════════════════════════
   Hero mockup card
   ══════════════════════════════════════════════════════════════════ */

function HeroMockup() {
  return (
    <div className="pro-mockup pointer-events-none hidden select-none lg:block" aria-hidden="true">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/40 backdrop-blur-md" style={{ width: 260 }}>
        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-300" />
          <div>
            <div className="h-2.5 w-28 rounded bg-white/20" />
            <div className="mt-1.5 h-2 w-20 rounded bg-white/10" />
          </div>
        </div>
        {/* Score */}
        <div className="mb-3 flex items-center justify-between rounded-lg bg-white/[0.06] px-3 py-2">
          <span className="text-xs font-medium text-white/40">Score global</span>
          <span className="text-lg font-bold text-teal-400">78/100</span>
        </div>
        {/* Bars */}
        <div className="space-y-2">
          {[
            { w: "75%", c: "bg-teal-400/60" },
            { w: "85%", c: "bg-sky-400/60" },
            { w: "60%", c: "bg-violet-400/60" },
            { w: "70%", c: "bg-amber-400/60" },
            { w: "80%", c: "bg-teal-400/60" },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-1.5 w-12 rounded bg-white/10" />
              <div className="h-1.5 flex-1 overflow-hidden rounded bg-white/[0.06]">
                <div className={`h-full rounded ${b.c}`} style={{ width: b.w }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main
   ══════════════════════════════════════════════════════════════════ */

export function ProContent() {
  return (
    <div className="flex min-h-screen flex-col bg-white" style={{ scrollBehavior: "smooth" }}>
      <Header />

      {/* ═══════ HERO ═══════ */}
      <section className="pro-hero relative overflow-hidden">
        {/* Dot grid */}
        <div className="pro-dots pointer-events-none absolute inset-0" />
        {/* Radial glows */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/[0.06] blur-[100px]" />
        <div className="pointer-events-none absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-cyan-400/[0.04] blur-[80px]" />

        <div className="relative mx-auto flex max-w-6xl items-center gap-12 px-4 py-20 sm:py-28 lg:gap-16">
          {/* Text */}
          <div className="min-w-0 flex-1 text-center lg:text-left">
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-teal-400/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400">
              <Crown className="h-3.5 w-3.5" />
              Offre Professionnels
            </span>

            <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-5xl lg:mx-0">
              CoproScore pour les{" "}
              <span className="pro-gradient-text">professionnels</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-400 lg:mx-0">
              Rassurez vos clients, fiabilisez vos dossiers, gagnez du temps.
              Accédez à l'analyse complète de toutes les copropriétés de France.
            </p>

            {/* Glass stat badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start">
              {HERO_STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <span key={s.label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-md">
                    <Icon className="h-3 w-3 text-teal-400" />
                    {s.label}
                  </span>
                );
              })}
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link href="/tarifs" className="pro-cta-glow inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all duration-200 hover:scale-[1.03] hover:bg-teal-400 hover:shadow-teal-500/40 active:scale-[0.98]">
                <Crown className="h-4 w-4" />
                Découvrir l'offre Pro
              </Link>
              <Link href="/copropriete/score-copropriete-45-bd-saint-marcel-75013-paris" className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-6 py-3.5 text-base font-medium text-slate-300 backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:border-slate-600 hover:bg-slate-700 hover:text-white active:scale-[0.98]">
                Voir un exemple de fiche
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Mockup */}
          <HeroMockup />
        </div>
      </section>

      <Wave from="fill-[#0f172a]" to="bg-white" />

      {/* ═══════ POUR QUI ═══════ */}
      <section className="bg-white pb-20 pt-12 sm:pb-28 sm:pt-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Pour qui ?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
            CoproScore Pro s'adresse à tous les acteurs de l'immobilier qui ont besoin de données fiables sur les copropriétés.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {AUDIENCES.map((a, i) => {
              const Icon = a.icon;
              return (
                <FadeInStagger key={a.title} index={i}>
                  <div className="pro-card group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 transition-all duration-400 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-900/5">
                    {/* Animated gradient border overlay on hover */}
                    <div className="pro-card-border pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-400 group-hover:opacity-100" />

                    <div className="relative flex items-start gap-5">
                      {/* Large gradient icon circle */}
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${a.gradient} shadow-lg transition-transform duration-400 group-hover:-translate-y-1 group-hover:rotate-3`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{a.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">{a.description}</p>
                        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          <Zap className="h-3 w-3 text-teal-500" />
                          {a.stat}
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

      <Wave from="fill-white" to="bg-slate-50" />

      {/* ═══════ POURQUOI COPROSCORE ═══════ */}
      <section className="bg-slate-50 pb-20 pt-12 sm:pb-28 sm:pt-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Pourquoi CoproScore ?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
            Des données publiques croisées, un scoring objectif et transparent.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ARGUMENTS.map((a, i) => {
              const Icon = a.icon;
              return (
                <FadeInStagger key={a.label} index={i}>
                  <div className="group rounded-2xl border border-slate-200 bg-white p-6 text-center transition-all duration-300 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5">
                    {/* Icon with animated ring */}
                    <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center">
                      <AnimatedRing color={a.ringColor} size={56} stroke={2.5} />
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 transition-colors duration-300 group-hover:bg-gradient-to-br group-hover:from-teal-50 group-hover:to-cyan-50">
                        <Icon className="h-5 w-5" style={{ color: a.ringColor }} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {a.numericValue > 0 ? (
                        <AnimatedCounter target={a.numericValue} suffix={a.suffix} duration={a.numericValue > 100 ? 2000 : 1200} />
                      ) : a.suffix}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">{a.label}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">{a.detail}</p>
                  </div>
                </FadeInStagger>
              );
            })}
          </div>
        </div>
      </section>

      <Wave from="fill-slate-50" to="bg-white" />

      {/* ═══════ PRICING ═══════ */}
      <section className="bg-white pb-20 pt-12 sm:pb-28 sm:pt-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">Une offre simple et transparente</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-500">
            Comparez votre workflow actuel avec CoproScore Pro.
          </p>

          <div className="mt-12 grid items-start gap-8 lg:grid-cols-[1fr_340px]">
            {/* Comparison table */}
            <ScaleIn>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="grid grid-cols-3 border-b bg-slate-50 text-xs font-semibold">
                  <div className="px-4 py-3 text-slate-500" />
                  <div className="flex items-center gap-1.5 border-l px-4 py-3 text-slate-500">
                    <XIcon className="h-3.5 w-3.5 text-red-400" /> Sans CoproScore
                  </div>
                  <div className="flex items-center gap-1.5 border-l px-4 py-3 text-teal-700">
                    <Check className="h-3.5 w-3.5 text-teal-500" /> Avec CoproScore
                  </div>
                </div>
                {COMPARISON.map((row, i) => (
                  <div key={i} className={`grid grid-cols-3 text-sm ${i < COMPARISON.length - 1 ? "border-b" : ""}`}>
                    <div className="px-4 py-3.5 font-medium text-slate-700">{row.label}</div>
                    <div className="border-l px-4 py-3.5 text-slate-400">{row.without}</div>
                    <div className="border-l px-4 py-3.5 font-medium text-teal-700">{row.with}</div>
                  </div>
                ))}
              </div>
            </ScaleIn>

            {/* Pricing card with shine */}
            <ScaleIn>
              <div className="pro-shine relative overflow-hidden rounded-2xl border-2 border-teal-500 bg-white shadow-xl shadow-teal-500/10">
                <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-4 text-center">
                  <p className="flex items-center justify-center gap-2 text-lg font-bold text-white">
                    <Crown className="h-5 w-5" /> Accès Pro
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-slate-900">29 €</span>
                    <span className="text-base text-slate-500">/mois TTC</span>
                  </div>
                  <p className="mt-1 text-center text-sm text-slate-400">ou 290 €/an (2 mois offerts)</p>
                  <ul className="mt-5 space-y-2.5">
                    {PRO_FEATURES.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                        <span className="text-sm text-slate-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/tarifs" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-teal-700 hover:shadow-md active:scale-[0.98]">
                    <Crown className="h-4 w-4" /> S'abonner
                  </Link>
                  <p className="mt-3 text-center text-xs text-slate-400">14 jours d'essai gratuit · Résiliation à tout moment</p>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      <Wave from="fill-white" to="bg-slate-900" />

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="bg-slate-900 pb-20 pt-12 sm:pb-28 sm:pt-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Ils utilisent CoproScore Pro</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base text-slate-400">
            Témoignages à titre illustratif
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <FadeInStagger key={t.name} index={i}>
                <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 backdrop-blur-sm">
                  <Quote className="mb-4 h-6 w-6 text-teal-500/40" />
                  <p className="text-sm italic leading-relaxed text-slate-300">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${t.bg}`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeInStagger>
            ))}
          </div>
        </div>
      </section>

      <Wave from="fill-slate-900" to="bg-teal-700" />

      {/* ═══════ CTA FINAL ═══════ */}
      <section className="bg-gradient-to-br from-teal-700 via-teal-600 to-teal-700 pb-20 pt-12 sm:pb-28 sm:pt-16">
        <ScaleIn className="mx-auto max-w-3xl px-4 text-center">
          <Crown className="mx-auto mb-5 h-10 w-10 text-teal-200" />
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Prêt à passer Pro ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-teal-100">
            29 €/mois, c'est moins de 1 € par jour.
            Une seule vente facilitée rembourse 5 ans d'abonnement.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-teal-200/70">
            Rejoignez les professionnels qui fiabilisent leurs dossiers et gagnent du temps avec CoproScore.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/tarifs" className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-teal-700 shadow-lg shadow-black/10 transition-all duration-200 hover:scale-[1.03] hover:bg-teal-50 hover:shadow-xl active:scale-[0.98]">
              <Crown className="h-4 w-4" /> Voir les tarifs et s'abonner
            </Link>
            <Link href="mailto:contact@coproscore.fr" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-base font-medium text-white backdrop-blur-sm transition-all duration-200 hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98]">
              Une question ? Contactez-nous
            </Link>
          </div>
        </ScaleIn>
      </section>

      <Footer />

      {/* ══════════════ CSS ══════════════ */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hero gradient animation */
        .pro-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
          background-size: 200% 200%;
          animation: pro-hero-bg 8s ease infinite;
        }
        @keyframes pro-hero-bg {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Animated dot grid */
        .pro-dots {
          background-image: radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px);
          background-size: 32px 32px;
          animation: pro-dots-pulse 4s ease-in-out infinite;
        }
        @keyframes pro-dots-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Gradient text on "professionnels" */
        .pro-gradient-text {
          background: linear-gradient(90deg, #2dd4bf, #67e8f9, #2dd4bf);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: pro-text-shimmer 3s linear infinite;
        }
        @keyframes pro-text-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }

        /* CTA glow pulse */
        .pro-cta-glow { animation: pro-glow 3s ease-in-out infinite; }
        @keyframes pro-glow {
          0%, 100% { box-shadow: 0 10px 25px -5px rgba(20,184,166,.25); }
          50% { box-shadow: 0 10px 40px -5px rgba(20,184,166,.5); }
        }

        /* Card gradient border */
        .pro-card-border {
          background: conic-gradient(from 0deg, #14b8a6, #06b6d4, #8b5cf6, #14b8a6);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: exclude;
          -webkit-mask-composite: xor;
          padding: 2px;
          border-radius: 1rem;
        }

        /* Pricing card shine sweep */
        .pro-shine::after {
          content: '';
          position: absolute;
          top: -50%; left: -50%;
          width: 200%; height: 200%;
          background: linear-gradient(
            105deg,
            transparent 40%,
            rgba(255,255,255,0.08) 45%,
            rgba(255,255,255,0.15) 50%,
            rgba(255,255,255,0.08) 55%,
            transparent 60%
          );
          animation: pro-shine-sweep 4s ease-in-out infinite;
        }
        @keyframes pro-shine-sweep {
          0% { transform: translateX(-30%) translateY(-30%) rotate(25deg); }
          100% { transform: translateX(30%) translateY(30%) rotate(25deg); }
        }

        /* Mockup perspective */
        .pro-mockup {
          transform: perspective(800px) rotateY(-8deg) rotateX(2deg);
          transition: transform 0.6s ease;
        }
        .pro-mockup:hover {
          transform: perspective(800px) rotateY(-3deg) rotateX(1deg);
        }
      `}} />
    </div>
  );
}
