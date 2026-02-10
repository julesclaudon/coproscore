export function DevBanner() {
  if (process.env.NEXT_PUBLIC_DEV_UNLOCK !== "true") return null;

  return (
    <div className="fixed bottom-3 left-3 z-[100] rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-medium text-amber-900 shadow-sm backdrop-blur-sm">
      DEV
    </div>
  );
}
