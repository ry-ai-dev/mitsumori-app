import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientForm from "@/components/ClientForm";
import type { Client } from "@/lib/types";

export default async function EditClientPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!client) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">クライアント編集</h1>
      <ClientForm client={client as Client} />
    </div>
  );
}
