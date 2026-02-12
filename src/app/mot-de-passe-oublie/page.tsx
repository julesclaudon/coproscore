"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold text-slate-900">
            Mot de passe oublié
          </h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>

          {submitted ? (
            <div className="mt-8 rounded-lg bg-teal-50 px-4 py-5 text-center">
              <Mail className="mx-auto h-8 w-8 text-teal-600" />
              <p className="mt-3 text-sm text-teal-800">
                Si un compte existe avec cet email, un lien de réinitialisation
                a été envoyé.
              </p>
              <p className="mt-2 text-xs text-teal-600">
                Vérifiez votre boîte de réception et vos spams.
              </p>
              <Link
                href="/connexion"
                className="mt-4 inline-block text-sm font-medium text-teal-700 hover:text-teal-900"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
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
                  <Mail className="h-4 w-4" />
                )}
                Envoyer le lien
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
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
