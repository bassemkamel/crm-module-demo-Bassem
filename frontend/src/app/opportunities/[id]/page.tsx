import { OpportunityDetail } from "./OpportunityDetail";

export const metadata = {
  title: "Opportunity · CRM",
};

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpportunityDetail id={id} />;
}
