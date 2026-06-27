import Link from "next/link";
import { OpportunityForm } from "@/components/OpportunityForm";

export const metadata = {
  title: "Nouvelle opportunité · CRM",
};

export default function NewOpportunityPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/opportunities"
        className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-800"
      >
        <span aria-hidden>&larr;</span> Retour aux opportunités
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-900">
        Nouvelle opportunité
      </h1>
      <OpportunityForm mode="create" />
    </div>
  );
}
