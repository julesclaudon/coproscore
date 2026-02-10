"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/footer";
import { Home } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  function handleSelect(v: { label: string; lon: number; lat: number }) {
    const params = new URLSearchParams({
      q: v.label,
      lat: v.lat.toString(),
      lon: v.lon.toString(),
    });
    router.push(`/recherche?${params.toString()}`);
  }

  function handleSubmit(text: string) {
    router.push(`/recherche?q=${encodeURIComponent(text)}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
          <Link href="/" className="text-xl font-bold text-slate-900">
            Copro<span className="text-teal-600">Score</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <p className="text-8xl font-black text-teal-100 sm:text-9xl">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Page introuvable
        </h1>
        <p className="mt-2 max-w-md text-center text-slate-500">
          La copropri&eacute;t&eacute; ou la page que vous cherchez n&apos;existe
          pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>

        <div className="mt-8 w-full max-w-md">
          <AddressAutocomplete
            onSelect={handleSelect}
            onSubmit={handleSubmit}
            placeholder="Rechercher une adresse..."
            autoFocus
          />
        </div>

        <Link href="/" className="mt-6">
          <Button variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Retour &agrave; l&apos;accueil
          </Button>
        </Link>
      </main>

      <Footer />
    </div>
  );
}
