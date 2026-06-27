"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, deleteClient, getClients } from "@/lib/api";
import { CLIENT_TYPE_LABELS } from "@/lib/format";
import { type Client, ClientType } from "@/lib/types";
import { EmptyState, ErrorState, Spinner } from "@/components/states";

type AsyncState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: Client[] };

const selectClass =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function ClientsList() {
  const [typeFilter, setTypeFilter] = useState<ClientType | "">("");
  const [state, setState] = useState<AsyncState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let ignore = false;
    setState({ status: "loading" });
    getClients(typeFilter || undefined)
      .then((data) => {
        if (!ignore) setState({ status: "success", data });
      })
      .catch((err: unknown) => {
        if (!ignore) setState({ status: "error", error: toMessage(err) });
      });
    return () => {
      ignore = true;
    };
  }, [typeFilter, reloadKey]);

  const onDelete = async (client: Client) => {
    if (
      !window.confirm(
        `Delete "${client.displayName}" and all of their opportunities? This cannot be undone.`,
      )
    ) {
      return;
    }
    setActionError(null);
    setDeletingId(client.id);
    try {
      await deleteClient(client.id);
      reload();
    } catch (err) {
      setActionError(toMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-zinc-800">Clients</h1>
          <Link
            href="/clients/new"
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            + New
          </Link>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-600">
          Type
          <select
            className={selectClass}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ClientType | "")}
          >
            <option value="">All</option>
            {Object.values(ClientType).map((t) => (
              <option key={t} value={t}>
                {CLIENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {actionError && <ErrorState message={actionError} />}

      {state.status === "loading" && <Spinner />}
      {state.status === "error" && (
        <ErrorState message={state.error} onRetry={reload} />
      )}
      {state.status === "success" &&
        (state.data.length === 0 ? (
          <EmptyState message="No clients yet. Create your first one." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {state.data.map((client) => (
                  <tr key={client.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-800">
                      {client.displayName}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {CLIENT_TYPE_LABELS[client.type]}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {client.email || <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {client.phone || <span className="text-zinc-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/clients/${client.id}/edit`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(client)}
                        disabled={deletingId === client.id}
                        className="ml-4 font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === client.id ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}

function toMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Unexpected error";
}
