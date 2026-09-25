import { createClient } from "@/lib/supabase/server";
import DocumentForm from "@/components/DocumentForm";
import type { Client, DocumentItem } from "@/lib/types";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });

  let initialClientId: string | undefined;
  let initialItems: DocumentItem[] | undefined;
  let initialNotes: string | undefined;
  let sourceQuoteId: string | undefined;

  // 見積書からの変換（/invoices/new?from=<quoteId>）
  if (searchParams.from) {
    const { data: quote } = await supabase
      .from("documents")
      .select("*, document_items(*)")
      .eq("id", searchParams.from)
      .eq("type", "quote")
      .single();

    if (quote) {
      initialClientId = quote.client_id;
      initialNotes = quote.notes ?? undefined;
      sourceQuoteId = quote.id;
      initialItems = (quote.document_items ?? [])
        .sort((a: DocumentItem, b: DocumentItem) => a.sort_order - b.sort_order)
        .map((item: DocumentItem) => ({
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
          sort_order: item.sort_order,
        }));
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">請求書を作成</h1>
      {sourceQuoteId && (
        <p className="text-sm text-brand-600 bg-brand-50 rounded-md px-3 py-2 mb-4">
          見積書の内容を引き継いで作成しています。内容を確認・修正してください。
        </p>
      )}
      <DocumentForm
        type="invoice"
        clients={(clients ?? []) as Client[]}
        initialClientId={initialClientId}
        initialItems={initialItems}
        initialNotes={initialNotes}
        sourceQuoteId={sourceQuoteId}
      />
    </div>
  );
}
