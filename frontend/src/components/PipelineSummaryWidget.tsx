import { formatCurrency, sortByStageOrder, STAGE_LABELS } from "@/lib/format";
import type { PipelineSummary } from "@/lib/types";

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        tone === "warning"
          ? "border-amber-200 bg-amber-50"
          : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold ${
          tone === "warning" ? "text-amber-700" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function PipelineSummaryWidget({
  summary,
}: {
  summary: PipelineSummary;
}) {
  const stages = sortByStageOrder(summary.byStage);
  const maxValue = Math.max(1, ...stages.map((s) => s.value));

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          label="Open pipeline"
          value={formatCurrency(summary.totalOpenValue)}
          hint={`${summary.totalCount} opportunities total`}
        />
        <Kpi
          label="Weighted value"
          value={formatCurrency(summary.weightedOpenValue)}
          hint="By stage win probability"
        />
        <Kpi
          label="Won"
          value={formatCurrency(summary.wonValue)}
          hint={`Lost: ${formatCurrency(summary.lostValue)}`}
        />
        <Kpi
          label="Problematic"
          value={String(summary.problematic.count)}
          hint={formatCurrency(summary.problematic.value) + " at risk"}
          tone="warning"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-700">
          Value by stage
        </h3>
        <ul className="space-y-2">
          {stages.map((s) => (
            <li key={s.stage} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm text-zinc-600">
                {STAGE_LABELS[s.stage]}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${(s.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-sm tabular-nums text-zinc-700">
                {formatCurrency(s.value)}
              </span>
              <span className="w-8 shrink-0 text-right text-xs tabular-nums text-zinc-400">
                {s.count}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
