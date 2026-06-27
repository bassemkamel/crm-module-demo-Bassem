import Link from "next/link";
import { HealthBadge, StageBadge } from "./Badge";
import { CLIENT_TYPE_LABELS, formatCurrency, formatDate } from "@/lib/format";
import type { Opportunity } from "@/lib/types";

export function OpportunitiesTable({
  opportunities,
}: {
  opportunities: Opportunity[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full divide-y divide-zinc-200 text-sm">
        <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">Opportunity</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Stage</th>
            <th className="px-4 py-3 text-right">Amount</th>
            <th className="px-4 py-3">Close date</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {opportunities.map((opp) => (
            <tr
              key={opp.id}
              className={`transition-colors hover:bg-zinc-50 ${
                opp.isProblematic ? "bg-red-50/40" : ""
              }`}
            >
              <td className="px-4 py-3">
                <Link
                  href={`/opportunities/${opp.id}`}
                  className="font-medium text-indigo-700 hover:underline"
                >
                  {opp.title}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="text-zinc-800">{opp.client.displayName}</div>
                <div className="text-xs text-zinc-400">
                  {CLIENT_TYPE_LABELS[opp.client.type]}
                </div>
              </td>
              <td className="px-4 py-3">
                <StageBadge stage={opp.stage} />
              </td>
              <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-800">
                {formatCurrency(opp.amount)}
              </td>
              <td className="px-4 py-3 text-zinc-600">
                {formatDate(opp.expectedCloseDate)}
              </td>
              <td className="px-4 py-3">
                <HealthBadge health={opp.health} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
