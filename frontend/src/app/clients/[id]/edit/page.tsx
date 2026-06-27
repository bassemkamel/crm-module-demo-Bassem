import { EditClient } from "./EditClient";

export const metadata = {
  title: "Modifier le client · CRM",
};

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditClient id={id} />;
}
