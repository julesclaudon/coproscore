"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu,
  X,
  Map,
  BarChart3,
  CreditCard,
  Crown,
  Star,
  Clock,
  Search,
  BookOpen,
  Scale,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { FavoritesNavLink } from "@/components/favorites-nav-link";
import { HistoryNavLink } from "@/components/history-nav-link";

interface HeaderProps {
  variant?: "default" | "homepage";
  rightSlot?: React.ReactNode;
}

const navLinks = [
  { href: "/", label: "Rechercher", icon: Search },
  { href: "/carte", label: "Carte", icon: Map },
  { href: "/comparateur", label: "Comparateur", icon: BarChart3 },
  { href: "/tarifs", label: "Tarifs", icon: CreditCard },
  { href: "/pro", label: "Pro", icon: Crown },
  { href: "/favoris", label: "Favoris", icon: Star },
  { href: "/historique", label: "Historique", icon: Clock },
  { href: "/methodologie", label: "Méthodologie", icon: BookOpen },
  { href: "/mentions-legales", label: "Mentions légales", icon: Scale },
] as const;

const desktopLinks = [
  { href: "/carte", label: "Carte" },
  { href: "/comparateur", label: "Comparateur" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/pro", label: "Pro", badge: true },
] as const;

export function Header({ variant = "default", rightSlot }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape to close
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const panel = drawerRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    // Focus first element in drawer
    const panel = drawerRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>("a[href], button:not([disabled])");
      first?.focus();
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const isHomepage = variant === "homepage";
  const isLoading = status === "loading";
  const isLoggedIn = !!session?.user;

  return (
    <>
      <header
        className={
          isHomepage
            ? "absolute top-0 z-10 w-full bg-white/80 backdrop-blur-md"
            : "sticky top-0 z-30 border-b bg-white/90 backdrop-blur-sm"
        }
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="shrink-0 text-xl font-bold text-slate-900">
            Copro<span className="text-teal-600">Score</span>
          </Link>

          {/* Right slot (e.g. search bar on /recherche) */}
          {rightSlot && <div className="mx-3 min-w-0 flex-1">{rightSlot}</div>}

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-4 text-sm font-medium text-slate-600 md:flex">
            {desktopLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={
                  pathname === l.href
                    ? "text-teal-600 font-semibold underline underline-offset-4 decoration-2 decoration-teal-500"
                    : "transition-colors hover:text-teal-700"
                }
              >
                {"badge" in l && l.badge ? (
                  <span className="inline-flex items-center gap-1">
                    {l.label}
                    <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-teal-700">
                      PRO
                    </span>
                  </span>
                ) : (
                  l.label
                )}
              </Link>
            ))}
            <FavoritesNavLink />
            <HistoryNavLink />
            {!isLoading && (
              isLoggedIn ? (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <span className="text-xs text-slate-400 truncate max-w-[120px]">
                    {session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-1 text-slate-500 transition-colors hover:text-red-600"
                    title="Se déconnecter"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                  <Link
                    href="/connexion"
                    className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-700"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/inscription"
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-teal-800"
                  >
                    Inscription
                  </Link>
                </div>
              )
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="ml-2 flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile drawer — plain div, no Radix dependency */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div ref={drawerRef} className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-white shadow-lg" role="dialog" aria-modal="true" aria-label="Menu de navigation">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-xl font-bold text-slate-900"
              >
                Copro<span className="text-teal-600">Score</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:text-slate-600"
                aria-label="Fermer le menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Drawer nav */}
            <nav className="flex flex-1 flex-col overflow-y-auto py-2">
              {navLinks.map((l) => {
                const Icon = l.icon;
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[44px] items-center gap-3 px-5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-teal-700"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {l.label}
                  </Link>
                );
              })}

              {/* Auth section */}
              <div className="mt-auto border-t border-slate-100 pt-2">
                {!isLoading && (
                  isLoggedIn ? (
                    <>
                      <div className="px-5 py-2 text-xs text-slate-400 truncate">
                        {session.user?.email}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="flex min-h-[44px] w-full items-center gap-3 px-5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        Se déconnecter
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/connexion"
                        onClick={() => setOpen(false)}
                        className="flex min-h-[44px] items-center gap-3 px-5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-teal-700"
                      >
                        <LogIn className="h-4 w-4 shrink-0" />
                        Connexion
                      </Link>
                      <Link
                        href="/inscription"
                        onClick={() => setOpen(false)}
                        className="flex min-h-[44px] items-center gap-3 px-5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
                      >
                        <User className="h-4 w-4 shrink-0" />
                        Créer un compte
                      </Link>
                    </>
                  )
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
