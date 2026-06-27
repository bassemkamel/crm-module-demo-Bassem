export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-zinc-500">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600"
        aria-hidden
      />
      {label ?? "Loading…"}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-red-800">Something went wrong</p>
      <p className="mt-1 text-sm text-red-600">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-12 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}
