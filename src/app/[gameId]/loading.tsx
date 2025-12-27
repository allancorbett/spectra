export default function GameLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      <p className="text-foreground/60">Loading game...</p>
    </div>
  );
}
