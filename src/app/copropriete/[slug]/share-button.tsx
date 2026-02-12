"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Check, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonProps {
  title: string;
  text: string;
}

const CHANNELS = [
  {
    name: "Twitter",
    icon: "𝕏",
    url: (title: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "LinkedIn",
    icon: "in",
    url: (_title: string, url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "WhatsApp",
    icon: "WA",
    url: (title: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
  },
];

export function ShareButton({ title, text }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to dropdown
      }
    }

    setOpen((prev) => !prev);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="min-w-[44px] min-h-[44px] gap-1.5 px-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800"
        onClick={handleShare}
        aria-expanded={open}
        title="Partager"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline text-xs">Partager</span>
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-xs font-medium text-slate-500">Partager via</span>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {CHANNELS.map((ch) => (
            <a
              key={ch.name}
              href={ch.url(title, window.location.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-xs font-bold text-slate-600">
                {ch.icon}
              </span>
              {ch.name}
            </a>
          ))}

          <div className="my-1 border-t border-slate-100" />

          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
          >
            {copied ? (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded bg-teal-50 text-teal-600">
                  <Check className="h-3.5 w-3.5" />
                </span>
                Lien copi&eacute; !
              </>
            ) : (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-600">
                  <Link2 className="h-3.5 w-3.5" />
                </span>
                Copier le lien
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
