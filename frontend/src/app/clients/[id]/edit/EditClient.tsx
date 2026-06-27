"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, getClient } from "@/lib/api";
import type { Client } from "@/lib/types";
import { ClientForm } from "@/components/ClientForm";
import { ErrorState, Spinner } from "@/components/states";

type AsyncState =
  | { status: "loading" }
  | { status: "notfound" }
  | { status: "error"; error: string }
  | { status: "success"; data: Client };

export function EditClient({ id }: { id: string }) {
  const [state, setState] = useState<AsyncState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    setState({ status: "loading" });
    getClient(id)
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
        href="/clients"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        <span aria-hidden>&larr;</span> Retour aux clients
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900">
        Modifier le client
      </h1>

      {state.status === "loading" && <Spinner label="Chargement du client…" />}
      {state.status === "error" && (
        <ErrorState
          message={state.error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      )}
      {state.status === "notfound" && (
        <p className="text-sm text-zinc-500">Ce client n'existe plus.</p>
      )}
      {state.status === "success" && (
        <ClientForm mode="edit" client={state.data} />
      )}
    </div>
  );
}

function toMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erreur inattendue";
}
