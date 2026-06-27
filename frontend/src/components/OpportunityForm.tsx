"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ApiError,
  createOpportunity,
  deleteOpportunity,
  getClients,
  updateOpportunity,
  type OpportunityInput,
} from "@/lib/api";
import { CLIENT_TYPE_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/lib/format";
import { type Client, type Opportunity, PipelineStage } from "@/lib/types";
import { ErrorState } from "@/components/states";

const schema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  // Kept as a string so we can validate the decimal precision the API expects.
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Saisissez un montant valide (2 décimales max)")
    .refine((v) => parseFloat(v) > 0, "Le montant doit être supérieur à 0"),
  expectedCloseDate: z.string().min(1, "La date de signature est requise"),
  stage: z.nativeEnum(PipelineStage),
  clientId: z.string().min(1, "Sélectionnez un client"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  opportunity?: Opportunity;
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

export function OpportunityForm({ mode, opportunity }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[] | null>(null);
  const [clientsError, setClientsError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: opportunity
      ? {
          title: opportunity.title,
          amount: String(opportunity.amount),
          expectedCloseDate: opportunity.expectedCloseDate.slice(0, 10),
          stage: opportunity.stage,
          clientId: opportunity.clientId,
        }
      : {
          title: "",
          amount: "",
          expectedCloseDate: "",
          stage: PipelineStage.NEW,
          clientId: "",
        },
  });

  useEffect(() => {
    let ignore = false;
    getClients()
      .then((data) => {
        if (!ignore) setClients(data);
      })
      .catch((err: unknown) => {
        if (!ignore) setClientsError(toMessage(err));
      });
    return () => {
      ignore = true;
    };
  }, []);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const payload: OpportunityInput = {
      title: values.title.trim(),
      amount: parseFloat(values.amount),
      expectedCloseDate: new Date(values.expectedCloseDate).toISOString(),
      stage: values.stage,
      clientId: values.clientId,
    };

    try {
      if (mode === "create") {
        const created = await createOpportunity(payload);
        router.push(`/opportunities/${created.id}`);
      } else if (opportunity) {
        await updateOpportunity(opportunity.id, payload);
        router.push(`/opportunities/${opportunity.id}`);
      }
      router.refresh();
    } catch (err) {
      setServerError(toMessage(err));
    }
  };

  const onDelete = async () => {
    if (!opportunity) return;
    if (
      !window.confirm(
        "Supprimer cette opportunité ? Cette action est irréversible.",
      )
    ) {
      return;
    }
    setServerError(null);
    setDeleting(true);
    try {
      await deleteOpportunity(opportunity.id);
      router.push("/opportunities");
      router.refresh();
    } catch (err) {
      setServerError(toMessage(err));
      setDeleting(false);
    }
  };

  const cancelHref = opportunity
    ? `/opportunities/${opportunity.id}`
    : "/opportunities";

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
      noValidate
    >
      {serverError && <ErrorState message={serverError} />}

      <Field label="Titre" error={errors.title?.message}>
        <input
          type="text"
          className={inputClass}
          placeholder="ex. Licence annuelle plateforme"
          {...register("title")}
        />
      </Field>

      <Field label="Montant (EUR)" error={errors.amount?.message}>
        <input
          type="number"
          step="0.01"
          min="0"
          className={inputClass}
          placeholder="0.00"
          {...register("amount")}
        />
      </Field>

      <Field
        label="Date de signature prévue"
        error={errors.expectedCloseDate?.message}
      >
        <input
          type="date"
          className={inputClass}
          {...register("expectedCloseDate")}
        />
      </Field>

      <Field label="Étape" error={errors.stage?.message}>
        <select className={inputClass} {...register("stage")}>
          {STAGE_ORDER.map((stage) => (
            <option key={stage} value={stage}>
              {STAGE_LABELS[stage]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Client" error={errors.clientId?.message}>
        {clientsError ? (
          <p className="text-sm text-red-600">
            Impossible de charger les clients : {clientsError}
          </p>
        ) : (
          <select
            className={inputClass}
            disabled={!clients}
            {...register("clientId")}
          >
            <option value="">
              {clients ? "Sélectionnez un client…" : "Chargement des clients…"}
            </option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName} ({CLIENT_TYPE_LABELS[c.type]})
              </option>
            ))}
          </select>
        )}
      </Field>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || deleting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Enregistrement…"
              : mode === "create"
                ? "Créer l'opportunité"
                : "Enregistrer"}
          </button>
          <Link
            href={cancelHref}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            Annuler
          </Link>
        </div>

        {mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting || deleting}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      {children}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function toMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Erreur inattendue";
}
