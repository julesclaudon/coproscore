"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Building2, Loader2 } from "lucide-react";

interface BanSuggestion {
  properties: {
    label: string;
    postcode: string;
    city: string;
    type: string;
  };
  geometry: {
    coordinates: [number, number];
  };
}

export interface AddressAutocompleteProps {
  defaultValue?: string;
  onSelect: (v: { label: string; lon: number; lat: number }) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function AddressAutocomplete({
  defaultValue = "",
  onSelect,
  onSubmit,
  placeholder = "Entrez une adresse, une ville...",
  autoFocus = false,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<BanSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback((q: string) => {
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`
        );
        const data = await res.json();
        setSuggestions(data.features ?? []);
        setOpen(true);
        setHighlightedIndex(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function selectSuggestion(s: BanSuggestion) {
    const label = s.properties.label;
    const [lon, lat] = s.geometry.coordinates;
    setQuery(label);
    setOpen(false);
    setSuggestions([]);
    onSelect({ label, lon, lat });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        if (query.trim().length >= 3) onSubmit?.(query.trim());
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          selectSuggestion(suggestions[highlightedIndex]);
        } else if (query.trim().length >= 3) {
          setOpen(false);
          onSubmit?.(query.trim());
        }
        break;
      case "Escape":
        setOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }

  function highlightMatch(text: string) {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.trim().toLowerCase());
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const match = text.slice(idx, idx + query.trim().length);
    const after = text.slice(idx + query.trim().length);
    return (
      <>
        {before}
        <mark className="bg-teal-100 text-teal-900">{match}</mark>
        {after}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 animate-spin text-teal-600" />
        ) : (
          <MapPin className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
        )}
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            fetchSuggestions(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          autoFocus={autoFocus}
          className="h-14 rounded-xl border-slate-200 bg-white pl-12 text-base shadow-sm placeholder:text-slate-400 focus-visible:ring-teal-600"
        />
      </div>

      {open && (
        <ul className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && suggestions.length === 0 ? (
            <li className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Recherche en cours...
            </li>
          ) : !loading && suggestions.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-400">
              Aucun résultat trouvé
            </li>
          ) : (
            suggestions.map((s, i) => {
              const Icon = s.properties.type === "municipality" ? Building2 : MapPin;
              return (
                <li key={i}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      i === highlightedIndex
                        ? "bg-teal-50 text-teal-900"
                        : "text-slate-700 hover:bg-teal-50"
                    }`}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    onClick={() => selectSuggestion(s)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>{highlightMatch(s.properties.label)}</span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
