import { createClient } from "@/lib/supabase/server";
import DocumentForm from "@/components/DocumentForm";
import type { Client } from "@/lib/types";

export default async function NewQuotePage() {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">見積書を作成</h1>
      <DocumentForm type="quote" clients={(clients ?? []) as Client[]} />
    </div>
  );
}
