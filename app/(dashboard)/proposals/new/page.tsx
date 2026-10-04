import { createClient } from "@/lib/supabase/server";
import ProposalForm from "@/components/ProposalForm";
import type { Client } from "@/lib/types";

export default async function NewProposalPage() {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">提案書を作成</h1>
      <ProposalForm clients={(clients ?? []) as Client[]} />
    </div>
  );
}
