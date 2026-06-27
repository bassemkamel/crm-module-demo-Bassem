"use client";

import type { PaginationMeta } from "@/lib/types";

const buttonClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50";

export function Pagination({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const { page, totalPages, total, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-zinc-500">
        {total === 0
          ? "Aucun résultat"
          : `Affichage de ${from}–${to} sur ${total}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Précédent
        </button>
        <span className="text-sm tabular-nums text-zinc-600">
          Page {page} sur {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
