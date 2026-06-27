import {
  ClientType,
  OpportunityHealth,
  PipelineStage,
  type StageBreakdown,
} from "./types";

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const STAGE_LABELS: Record<PipelineStage, string> = {
  NEW: "Nouveau",
  QUALIFIED: "Qualifié",
  PROPOSAL: "Proposition",
  NEGOTIATION: "Négociation",
  WON: "Gagné",
  LOST: "Perdu",
};

// Stable order for displaying stages (pipeline flow, terminal stages last).
export const STAGE_ORDER: PipelineStage[] = [
  PipelineStage.NEW,
  PipelineStage.QUALIFIED,
  PipelineStage.PROPOSAL,
  PipelineStage.NEGOTIATION,
  PipelineStage.WON,
  PipelineStage.LOST,
];

export function sortByStageOrder(breakdown: StageBreakdown[]): StageBreakdown[] {
  return [...breakdown].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
  );
}

export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  COMPANY: "Entreprise",
  INDIVIDUAL: "Particulier",
};

export const HEALTH_LABELS: Record<OpportunityHealth, string> = {
  OK: "Dans les temps",
  LATE: "En retard",
  STAGNANT: "Stagnante",
};

// Tailwind classes per health state for the status badge.
export const HEALTH_BADGE_CLASSES: Record<OpportunityHealth, string> = {
  OK: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  LATE: "bg-red-50 text-red-700 ring-red-600/20",
  STAGNANT: "bg-amber-50 text-amber-700 ring-amber-600/20",
};

export const STAGE_BADGE_CLASSES: Record<PipelineStage, string> = {
  NEW: "bg-slate-100 text-slate-700 ring-slate-600/20",
  QUALIFIED: "bg-sky-50 text-sky-700 ring-sky-600/20",
  PROPOSAL: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  NEGOTIATION: "bg-violet-50 text-violet-700 ring-violet-600/20",
  WON: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  LOST: "bg-zinc-100 text-zinc-500 ring-zinc-500/20",
};
