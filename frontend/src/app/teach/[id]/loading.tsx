export default function TeachLoading() {
  return (
    <div className="flex h-svh items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
        <p className="text-sm text-white/50">Preparing session...</p>
      </div>
    </div>
  );
}
