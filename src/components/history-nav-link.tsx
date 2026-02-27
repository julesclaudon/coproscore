"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { getHistoryCount } from "@/lib/history";

export function HistoryNavLink() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(getHistoryCount(userId));
  }, [userId]);

  return (
    <Link
      href="/historique"
      className="flex items-center gap-1.5 transition-colors hover:text-teal-700"
    >
      <Clock className="h-4 w-4" />
      <span className="hidden sm:inline">Historique</span>
      {count > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
