"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Suspense } from "react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!token) {
    return (
      <div className="mt-8 rounded-lg bg-red-50 px-4 py-5 text-center">
        <p className="text-sm text-red-700">
          Lien invalide ou expiré.
        </p>
        <Link
          href="/mot-de-passe-oublie"
          className="mt-3 inline-block text-sm font-medium text-teal-700 hover:text-teal-900"
        >
          Demander un nouveau lien
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      toast.success("Mot de passe modifié avec succès");
      router.push("/connexion");
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-700"
        >
          Nouveau mot de passe
        </label>
        <div className="relative mt-1.5">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-400">Minimum 8 caractères</p>
      </div>
      <div>
        <label
          htmlFor="confirm"
          className="text-sm font-medium text-slate-700"
        >
          Confirmer le mot de passe
        </label>
        <div className="relative mt-1.5">
          <input
            id="confirm"
            type={showConfirm ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={
              showConfirm
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full gap-2 bg-teal-700 text-white hover:bg-teal-800"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <KeyRound className="h-4 w-4" />
        )}
        Réinitialiser le mot de passe
      </Button>

      <p className="text-center text-sm text-slate-500">
        <Link
          href="/connexion"
          className="font-medium text-teal-700 hover:text-teal-900"
        >
          Retour à la connexion
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold text-slate-900">
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Choisissez un nouveau mot de passe pour votre compte
          </p>
          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
