"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { useRouter } from "next/navigation";
import type { AccessLevel } from "@/lib/access";

interface AlertModalProps {
  slug: string;
  coproName: string;
  accessLevel: AccessLevel;
}

export function AlertModal({ slug, coproName, accessLevel }: AlertModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLimit, setIsLimit] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsLimit(false);

    try {
      const res = await fetch("/api/alertes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, slug }),
      });

      const data = await res.json();

      if (res.status === 403) {
        setIsLimit(true);
        setError(data.message);
      } else if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Erreur r\u00e9seau. R\u00e9essayez.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSuccess(false);
      setError(null);
      setIsLimit(false);
    }
  }

  function handleTriggerClick() {
    if (accessLevel === "visitor") {
      router.push("/connexion");
      return;
    }
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleTriggerClick} className="gap-1.5 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Alerte</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alerte changement de score</DialogTitle>
          <DialogDescription>
            Recevez un email si le score de {coproName} change.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-teal-600" />
            <p className="text-sm font-medium text-slate-700">
              Un email de confirmation vous a &eacute;t&eacute; envoy&eacute;.
            </p>
            <p className="text-xs text-slate-400">
              V&eacute;rifiez votre bo&icirc;te de r&eacute;ception (et vos spams).
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="alert-email" className="text-sm font-medium text-slate-700">
                Votre email
              </label>
              <input
                id="alert-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.fr"
                className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
                {isLimit && (
                  <Link
                    href="/tarifs"
                    className="ml-1 font-medium underline underline-offset-2 hover:text-red-900"
                  >
                    Voir les tarifs
                  </Link>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 text-white hover:bg-teal-800"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4" />
                  Activer l&apos;alerte
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
