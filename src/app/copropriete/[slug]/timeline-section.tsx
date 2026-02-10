"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileText,
  Zap,
  TrendingUp,
  AlertTriangle,
  Users,
  Lock,
  Calendar,
} from "lucide-react";
import type { TimelineEvent, TimelineEventType } from "@/lib/timeline";
import { formatEventDateDisplay } from "@/lib/timeline";

// ─── Config ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  TimelineEventType,
  { color: string; bg: string; border: string; icon: typeof Building2 }
> = {
  construction: {
    color: "text-slate-500",
    bg: "bg-slate-100",
    border: "border-slate-300",
    icon: Building2,
  },
  administratif: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-300",
    icon: FileText,
  },
  energie: {
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-300",
    icon: Zap,
  },
  transaction: {
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    icon: TrendingUp,
  },
  risque: {
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-300",
    icon: AlertTriangle,
  },
  gouvernance: {
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-300",
    icon: Users,
  },
};

const FREE_LIMIT = process.env.NEXT_PUBLIC_DEV_UNLOCK === "true" ? Infinity : 3;

// ─── Fade-in hook ───────────────────────────────────────────────────────────

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// ─── Event card ─────────────────────────────────────────────────────────────

function TimelineItem({
  event,
  index,
}: {
  event: TimelineEvent;
  index: number;
}) {
  const { ref, visible } = useFadeIn();
  const config = TYPE_CONFIG[event.type];
  const Icon = config.icon;
  const isLeft = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`relative flex items-start gap-4 transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      style={{ transitionDelay: `${Math.min(index * 80, 400)}ms` }}
    >
      {/* Date — hidden on mobile, shown left on even / right on odd (desktop) */}
      <div
        className={`hidden w-[140px] shrink-0 pt-1 text-right text-sm text-slate-400 lg:block ${
          isLeft ? "order-1" : "order-3 text-left"
        }`}
      >
        {formatEventDateDisplay(event.date)}
      </div>

      {/* Dot + line */}
      <div className="relative z-10 order-1 flex shrink-0 flex-col items-center lg:order-2">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${config.bg} ${config.border}`}
        >
          <Icon className={`h-4 w-4 ${config.color}`} />
        </div>
      </div>

      {/* Content */}
      <div
        className={`min-w-0 flex-1 rounded-lg border border-slate-100 bg-white px-4 py-3 shadow-sm ${
          isLeft ? "order-3" : "order-1 lg:text-right"
        }`}
      >
        {/* Mobile date */}
        <p className="mb-1 text-xs text-slate-400 lg:hidden">
          {formatEventDateDisplay(event.date)}
        </p>
        <p className="text-sm font-medium text-slate-900">{event.titre}</p>
        <p className="mt-0.5 text-sm text-slate-500">{event.description}</p>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function TimelineSection({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return null;

  const visibleEvents = events.slice(0, FREE_LIMIT);
  const hiddenCount = events.length - FREE_LIMIT;
  const hasHidden = hiddenCount > 0;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Calendar className="h-5 w-5 text-blue-500" />
        Chronologie de la copropri&eacute;t&eacute;
      </h2>

      {events.length <= 2 && (
        <p className="mb-4 text-sm text-slate-400">
          Peu de donn&eacute;es historiques disponibles pour cette copropri&eacute;t&eacute;.
        </p>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[17px] top-0 h-full w-px bg-slate-200 lg:left-1/2 lg:-translate-x-px" />

        <div className="space-y-6 pb-4">
          {visibleEvents.map((event, i) => (
            <TimelineItem key={`${event.date}-${event.type}-${i}`} event={event} index={i} />
          ))}
        </div>

        {/* Paywall overlay */}
        {hasHidden && (
          <div className="relative mt-2">
            {/* Blurred preview of next 2 events */}
            <div className="select-none blur-sm">
              {events.slice(FREE_LIMIT, FREE_LIMIT + 2).map((event, i) => (
                <div
                  key={`blur-${i}`}
                  className="mb-4 flex items-start gap-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    <div className="h-4 w-4 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 rounded-lg border border-slate-100 bg-white px-4 py-3">
                    <p className="text-sm font-medium text-slate-900">
                      {event.titre}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 to-white/90">
              <Link
                href="/tarifs"
                className="flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-teal-700 shadow-sm transition-colors hover:text-teal-900"
              >
                <Lock className="h-3.5 w-3.5" />
                Voir l&apos;historique complet &mdash; Rapport &agrave; 4,90&euro;
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
