"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { countFavorites } from "@/lib/favorites";

export function FavoritesNavLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(countFavorites());
  }, []);

  return (
    <Link
      href="/favoris"
      className="flex items-center gap-1.5 transition-colors hover:text-teal-700"
    >
      <Star className="h-4 w-4" />
      <span className="hidden sm:inline">Favoris</span>
      {count > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
