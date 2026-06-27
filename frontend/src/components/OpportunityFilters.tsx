"use client";

import { CLIENT_TYPE_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/lib/format";
import {
  ClientType,
  type OpportunityFilters as Filters,
  PipelineStage,
} from "@/lib/types";

interface Props {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onReset: () => void;
}

const selectClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function OpportunityFilters({ filters, onChange, onReset }: Props) {
  const hasActiveFilters =
    Boolean(filters.stage) ||
    Boolean(filters.clientType) ||
    Boolean(filters.problematic);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        Étape
        <select
          className={selectClass}
          value={filters.stage ?? ""}
          onChange={(e) =>
            onChange({ stage: (e.target.value || undefined) as PipelineStage })
          }
        >
          <option value="">Toutes</option>
          {STAGE_ORDER.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        Client
        <select
          className={selectClass}
          value={filters.clientType ?? ""}
          onChange={(e) =>
            onChange({
              clientType: (e.target.value || undefined) as ClientType,
            })
          }
        >
          <option value="">Tous</option>
          {Object.values(ClientType).map((type) => (
            <option key={type} value={type}>
              {CLIENT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
          checked={Boolean(filters.problematic)}
          onChange={(e) =>
            onChange({ problematic: e.target.checked || undefined })
          }
        />
        À problème uniquement
      </label>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );
}
