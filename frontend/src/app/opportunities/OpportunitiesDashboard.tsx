"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, getOpportunities, getPipelineSummary } from "@/lib/api";
import type {
  OpportunityFilters as Filters,
  Paginated,
  Opportunity,
  PipelineSummary,
} from "@/lib/types";
import { ClientType, PipelineStage } from "@/lib/types";
import { OpportunityFilters } from "@/components/OpportunityFilters";
import { OpportunitiesTable } from "@/components/OpportunitiesTable";
import { Pagination } from "@/components/Pagination";
import { PipelineSummaryWidget } from "@/components/PipelineSummaryWidget";
import { EmptyState, ErrorState, Spinner } from "@/components/states";

const DEFAULT_LIMIT = 10;

type AsyncState<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

function parseFilters(params: URLSearchParams): Filters {
  const stage = params.get("stage");
  const clientType = params.get("clientType");
  return {
    stage:
      stage && stage in PipelineStage ? (stage as PipelineStage) : undefined,
    clientType:
      clientType && clientType in ClientType
        ? (clientType as ClientType)
        : undefined,
    problematic: params.get("problematic") === "true" || undefined,
    page: Number(params.get("page")) || 1,
    limit: Number(params.get("limit")) || DEFAULT_LIMIT,
  };
}

export function OpportunitiesDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseFilters(new URLSearchParams(searchParams.toString()));

  const [list, setList] = useState<AsyncState<Paginated<Opportunity>>>({
    status: "loading",
  });
  const [summary, setSummary] = useState<AsyncState<PipelineSummary>>({
    status: "loading",
  });
  // Bumping this re-triggers the fetch effects (used by the retry buttons).
  const [reloadKey, setReloadKey] = useState(0);

  const { stage, clientType, problematic, page, limit } = filters;

  useEffect(() => {
    let ignore = false;
    setList({ status: "loading" });
    getOpportunities({ stage, clientType, problematic, page, limit })
      .then((data) => {
        if (!ignore) setList({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (!ignore) setList({ status: "error", error: toMessage(err) });
      });
    return () => {
      ignore = true;
    };
  }, [stage, clientType, problematic, page, limit, reloadKey]);

  useEffect(() => {
    let ignore = false;
    setSummary({ status: "loading" });
    getPipelineSummary()
      .then((data) => {
        if (!ignore) setSummary({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (!ignore) setSummary({ status: "error", error: toMessage(err) });
      });
    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  const updateUrl = useCallback(
    (next: Partial<Filters>, resetPage: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      const apply = (key: string, value: string | undefined) => {
        if (value) params.set(key, value);
        else params.delete(key);
      };
      if ("stage" in next) apply("stage", next.stage);
      if ("clientType" in next) apply("clientType", next.clientType);
      if ("problematic" in next)
        apply("problematic", next.problematic ? "true" : undefined);
      if ("page" in next)
        apply("page", next.page ? String(next.page) : undefined);
      if (resetPage) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onFilterChange = (next: Partial<Filters>) => updateUrl(next, true);
  const onReset = () =>
    updateUrl(
      { stage: undefined, clientType: undefined, problematic: undefined },
      true,
    );
  const onPageChange = (nextPage: number) =>
    updateUrl({ page: nextPage }, false);
  const reload = () => setReloadKey((k) => k + 1);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-800">Pipeline</h2>
        {summary.status === "loading" && (
          <Spinner label="Chargement du récap…" />
        )}
        {summary.status === "error" && (
          <ErrorState message={summary.error} onRetry={reload} />
        )}
        {summary.status === "success" && (
          <PipelineSummaryWidget summary={summary.data} />
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-zinc-800">
              Opportunités
            </h2>
            <Link
              href="/opportunities/new"
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              + Nouvelle
            </Link>
          </div>
          <OpportunityFilters
            filters={filters}
            onChange={onFilterChange}
            onReset={onReset}
          />
        </div>

        {list.status === "loading" && <Spinner />}
        {list.status === "error" && (
          <ErrorState message={list.error} onRetry={reload} />
        )}
        {list.status === "success" &&
          (list.data.data.length === 0 ? (
            <EmptyState message="Aucune opportunité ne correspond aux filtres." />
          ) : (
            <>
              <OpportunitiesTable opportunities={list.data.data} />
              <Pagination meta={list.data.meta} onPageChange={onPageChange} />
            </>
          ))}
      </section>
    </div>
  );
}

function toMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erreur inattendue";
}
