"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ApiError,
  createClient,
  deleteClient,
  updateClient,
  type ClientInput,
} from "@/lib/api";
import { type Client, ClientType } from "@/lib/types";
import { ErrorState } from "@/components/states";

const optionalText = z.string().trim().optional();

const schema = z
  .object({
    type: z.nativeEnum(ClientType),
    email: z
      .string()
      .trim()
      .email("Invalid email")
      .optional()
      .or(z.literal("")),
    phone: optionalText,
    notes: optionalText,
    companyName: optionalText,
    registrationNumber: optionalText,
    industry: optionalText,
    firstName: optionalText,
    lastName: optionalText,
  })
  .superRefine((val, ctx) => {
    if (val.type === ClientType.COMPANY) {
      if (!val.companyName?.trim()) {
        ctx.addIssue({
          path: ["companyName"],
          code: z.ZodIssueCode.custom,
          message: "Company name is required",
        });
      }
    } else {
      if (!val.firstName?.trim()) {
        ctx.addIssue({
          path: ["firstName"],
          code: z.ZodIssueCode.custom,
          message: "First name is required",
        });
      }
      if (!val.lastName?.trim()) {
        ctx.addIssue({
          path: ["lastName"],
          code: z.ZodIssueCode.custom,
          message: "Last name is required",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  mode: "create" | "edit";
  client?: Client;
}

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

function emptyToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function ClientForm({ mode, client }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: client
      ? {
          type: client.type,
          email: client.email ?? "",
          phone: client.phone ?? "",
          notes: client.notes ?? "",
          companyName: client.companyName ?? "",
          registrationNumber: client.registrationNumber ?? "",
          industry: client.industry ?? "",
          firstName: client.firstName ?? "",
          lastName: client.lastName ?? "",
        }
      : {
          type: ClientType.COMPANY,
          email: "",
          phone: "",
          notes: "",
          companyName: "",
          registrationNumber: "",
          industry: "",
          firstName: "",
          lastName: "",
        },
  });

  const type = watch("type");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const common = {
      type: values.type,
      email: emptyToNull(values.email),
      phone: emptyToNull(values.phone),
      notes: emptyToNull(values.notes),
    };
    // Clear the fields that don't apply to the selected type so switching type
    // doesn't leave stale data behind.
    const payload: ClientInput =
      values.type === ClientType.COMPANY
        ? {
            ...common,
            companyName: emptyToNull(values.companyName),
            registrationNumber: emptyToNull(values.registrationNumber),
            industry: emptyToNull(values.industry),
            firstName: null,
            lastName: null,
          }
        : {
            ...common,
            firstName: emptyToNull(values.firstName),
            lastName: emptyToNull(values.lastName),
            companyName: null,
            registrationNumber: null,
            industry: null,
          };

    try {
      if (mode === "create") {
        const created = await createClient(payload);
        router.push(`/clients?highlight=${created.id}`);
      } else if (client) {
        await updateClient(client.id, payload);
        router.push("/clients");
      }
      router.refresh();
    } catch (err) {
      setServerError(toMessage(err));
    }
  };

  const onDelete = async () => {
    if (!client) return;
    if (
      !window.confirm(
        "Delete this client and all of their opportunities? This cannot be undone.",
      )
    ) {
      return;
    }
    setServerError(null);
    setDeleting(true);
    try {
      await deleteClient(client.id);
      router.push("/clients");
      router.refresh();
    } catch (err) {
      setServerError(toMessage(err));
      setDeleting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
      noValidate
    >
      {serverError && <ErrorState message={serverError} />}

      <Field label="Client type" error={errors.type?.message}>
        <select className={inputClass} {...register("type")}>
          <option value={ClientType.COMPANY}>Company</option>
          <option value={ClientType.INDIVIDUAL}>Individual</option>
        </select>
      </Field>

      {type === ClientType.COMPANY ? (
        <>
          <Field label="Company name" error={errors.companyName?.message}>
            <input
              type="text"
              className={inputClass}
              placeholder="e.g. Acme Corporation"
              {...register("companyName")}
            />
          </Field>
          <Field
            label="Registration number"
            error={errors.registrationNumber?.message}
          >
            <input
              type="text"
              className={inputClass}
              {...register("registrationNumber")}
            />
          </Field>
          <Field label="Industry" error={errors.industry?.message}>
            <input
              type="text"
              className={inputClass}
              {...register("industry")}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="First name" error={errors.firstName?.message}>
            <input
              type="text"
              className={inputClass}
              {...register("firstName")}
            />
          </Field>
          <Field label="Last name" error={errors.lastName?.message}>
            <input
              type="text"
              className={inputClass}
              {...register("lastName")}
            />
          </Field>
        </>
      )}

      <Field label="Email" error={errors.email?.message}>
        <input
          type="email"
          className={inputClass}
          placeholder="name@example.com"
          {...register("email")}
        />
      </Field>

      <Field label="Phone" error={errors.phone?.message}>
        <input type="text" className={inputClass} {...register("phone")} />
      </Field>

      <Field label="Notes" error={errors.notes?.message}>
        <textarea className={inputClass} rows={3} {...register("notes")} />
      </Field>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || deleting}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Saving…"
              : mode === "create"
                ? "Create client"
                : "Save changes"}
          </button>
          <Link
            href="/clients"
            className="text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            Cancel
          </Link>
        </div>

        {mode === "edit" && (
          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting || deleting}
            className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
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
  return "Unexpected error";
}
