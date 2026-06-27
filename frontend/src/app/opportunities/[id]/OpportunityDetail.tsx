"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, getOpportunity } from "@/lib/api";
import {
  CLIENT_TYPE_LABELS,
  formatCurrency,
  formatDate,
  HEALTH_LABELS,
} from "@/lib/format";
import { ClientType, OpportunityHealth, type Opportunity } from "@/lib/types";
import { HealthBadge, StageBadge } from "@/components/Badge";
import { ErrorState, Spinner } from "@/components/states";

type AsyncState =
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "error"; error: string }
  | { status: "success"; data: Opportunity };

export function OpportunityDetail({ id }: { id: string }) {
  const [state, setState] = useState<AsyncState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState({ status: "loading" });
    getOpportunity(id)
      .then((data) => {
        if (!ignore) setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (ignore) return;
        if (err instanceof ApiError && err.status === 404) {
          setState({ status: "notfound" });
        } else {
          setState({ status: "error", error: toMessage(err) });
        }
      });
    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  return (
    <div className="space-y-6">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        <span aria-hidden>&larr;</span> Back to opportunities
      </Link>

      {state.status === "loading" && <Spinner label="Loading opportunity…" />}
      {state.status === "error" && (
        <ErrorState
          message={state.error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      )}
      {state.status === "notfound" && <NotFound />}
      {state.status === "success" && <Detail opportunity={state.data} />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-12 text-center">
      <p className="text-sm font-medium text-zinc-700">Opportunity not found</p>
      <p className="mt-1 text-sm text-zinc-500">
        It may have been deleted.{" "}
        <Link href="/opportunities" className="text-indigo-700 hover:underline">
          Go back to the list
        </Link>
      </p>
    </div>
  );
}

function Detail({ opportunity }: { opportunity: Opportunity }) {
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            {opportunity.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            For{" "}
            <span className="font-medium text-zinc-700">
              {opportunity.client.displayName}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StageBadge stage={opportunity.stage} />
          <HealthBadge health={opportunity.health} />
          <Link
            href={`/opportunities/${opportunity.id}/edit`}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
          >
            Edit
          </Link>
        </div>
      </header>

      {opportunity.isProblematic && (
        <ProblematicBanner health={opportunity.health} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Opportunity">
          <Field label="Amount" value={formatCurrency(opportunity.amount)} />
          <Field
            label="Expected close date"
            value={formatDate(opportunity.expectedCloseDate)}
          />
          <Field
            label="Last stage change"
            value={formatDate(opportunity.stageChangedAt)}
          />
          <Field label="Created" value={formatDate(opportunity.createdAt)} />
          <Field label="Updated" value={formatDate(opportunity.updatedAt)} />
        </Card>

        <ClientCard client={opportunity.client} />
      </div>
    </>
  );
}

function ProblematicBanner({ health }: { health: OpportunityHealth }) {
  const reason =
    health === OpportunityHealth.LATE
      ? "The expected close date has passed and the deal isn't closed."
      : "This deal hasn't changed stage for a while and may be stalling.";
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-sm font-medium text-amber-800">
        {HEALTH_LABELS[health]} — needs attention
      </p>
      <p className="mt-0.5 text-sm text-amber-700">{reason}</p>
    </div>
  );
}

function ClientCard({ client }: { client: Opportunity["client"] }) {
  return (
    <Card title="Client">
      <Field label="Name" value={client.displayName} />
      <Field label="Type" value={CLIENT_TYPE_LABELS[client.type]} />
      {client.type === ClientType.COMPANY ? (
        <>
          <Field label="Registration no." value={client.registrationNumber} />
          <Field label="Industry" value={client.industry} />
        </>
      ) : (
        <>
          <Field label="First name" value={client.firstName} />
          <Field label="Last name" value={client.lastName} />
        </>
      )}
      <Field label="Email" value={client.email} />
      <Field label="Phone" value={client.phone} />
      <Field label="Notes" value={client.notes} />
    </Card>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-zinc-800">
        {value || <span className="text-zinc-400">—</span>}
      </dd>
    </div>
  );
}

function toMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}
