import { Suspense } from "react";
import { OpportunitiesDashboard } from "./OpportunitiesDashboard";
import { Spinner } from "@/components/states";

export const metadata = {
  title: "Opportunités · CRM",
};

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OpportunitiesDashboard />
    </Suspense>
  );
}
