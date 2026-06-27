import Link from "next/link";
import { ClientForm } from "@/components/ClientForm";

export const metadata = {
  title: "Nouveau client · CRM",
};

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        <span aria-hidden>&larr;</span> Retour aux clients
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900">Nouveau client</h1>
      <ClientForm mode="create" />
    </div>
  );
}
