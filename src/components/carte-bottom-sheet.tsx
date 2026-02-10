"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

type SheetState = "collapsed" | "half" | "full";

const SNAP_POINTS: Record<SheetState, string> = {
  collapsed: "calc(100% - 56px)",
  half: "50%",
  full: "10%",
};

interface CarteBottomSheetProps {
  children: ReactNode;
}

export function CarteBottomSheet({ children }: CarteBottomSheetProps) {
  const [state, setState] = useState<SheetState>("collapsed");
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number>(0);
  const dragStartTranslate = useRef<number>(0);

  const getCurrentTranslate = useCallback(() => {
    switch (state) {
      case "collapsed":
        return 0;
      case "half":
        return 1;
      case "full":
        return 2;
    }
  }, [state]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      dragStartTranslate.current = getCurrentTranslate();
    },
    [getCurrentTranslate]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaY = dragStartY.current - e.changedTouches[0].clientY;
      const threshold = 50;

      if (deltaY > threshold) {
        // Swiped up
        if (state === "collapsed") setState("half");
        else if (state === "half") setState("full");
      } else if (deltaY < -threshold) {
        // Swiped down
        if (state === "full") setState("half");
        else if (state === "half") setState("collapsed");
      }
    },
    [state]
  );

  const handleToggle = useCallback(() => {
    setState((prev) => (prev === "collapsed" ? "half" : "collapsed"));
  }, []);

  return (
    <div
      ref={sheetRef}
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col rounded-t-2xl border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] md:hidden"
      style={{
        top: SNAP_POINTS[state],
        transition: "top 300ms ease-out",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag handle + collapsed header */}
      <button
        onClick={handleToggle}
        className="flex w-full flex-col items-center gap-1 px-4 py-2 touch-none"
      >
        <div className="h-1 w-10 rounded-full bg-slate-300" />
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <SlidersHorizontal className="h-4 w-4" />
          Filtres & recherche
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </div>
  );
}
