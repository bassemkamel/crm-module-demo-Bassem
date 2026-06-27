import { EditOpportunity } from "./EditOpportunity";

export const metadata = {
  title: "Modifier l'opportunité · CRM",
};

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditOpportunity id={id} />;
}
