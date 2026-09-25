import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DocumentDetail from "@/components/DocumentDetail";
import type { DocumentRecord, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: document } = await supabase
    .from("documents")
    .select("*, clients(*), document_items(*)")
    .eq("id", params.id)
    .single();

  if (!document) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  const record = document as DocumentRecord;
  record.document_items = (record.document_items ?? []).sort(
    (a, b) => a.sort_order - b.sort_order
  );

  return (
    <DocumentDetail document={record} profile={profile as Profile | null} />
  );
}
