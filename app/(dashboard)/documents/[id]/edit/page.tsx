import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentForm from "@/components/DocumentForm";
import ProposalForm from "@/components/ProposalForm";
import type { Client, DocumentRecord } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: document } = await supabase
    .from("documents")
    .select("*, clients(*), document_items(*)")
    .eq("id", params.id)
    .single();

  if (!document) notFound();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  const record = document as DocumentRecord;
  record.document_items = (record.document_items ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">{TYPE_LABEL[record.type]}を編集</h1>
      {record.type === "proposal" ? (
        <ProposalForm clients={(clients ?? []) as Client[]} document={record} />
      ) : (
        <DocumentForm
          type={record.type}
          clients={(clients ?? []) as Client[]}
          document={record}
        />
      )}
    </div>
  );
}
