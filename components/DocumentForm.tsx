"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubmitButton from "@/components/SubmitButton";
import DocumentItemsForm from "@/components/DocumentItemsForm";
import { calcTotals, formatCurrency, nextDocNumber } from "@/lib/calc";
import type { Client, DocumentItem, DocumentRecord, DocumentType } from "@/lib/types";

type Props = {
  type: DocumentType;
  clients: Client[];
  document?: DocumentRecord;
  initialClientId?: string;
  initialItems?: DocumentItem[];
  initialNotes?: string;
  sourceQuoteId?: string;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function DocumentForm({
  type,
  clients,
  document,
  initialClientId,
  initialItems,
  initialNotes,
  sourceQuoteId,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(document);

  const [clientId, setClientId] = useState(
    document?.client_id ?? initialClientId ?? clients[0]?.id ?? ""
  );
  const [issueDate, setIssueDate] = useState(document?.issue_date ?? todayStr());
  const [dueDate, setDueDate] = useState(document?.due_date ?? "");
  const [notes, setNotes] = useState(document?.notes ?? initialNotes ?? "");
  const [items, setItems] = useState<DocumentItem[]>(
    document?.document_items && document.document_items.length > 0
      ? document.document_items
      : initialItems && initialItems.length > 0
      ? initialItems
      : [{ description: "", unit_price: 0, quantity: 1, sort_order: 0 }]
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { subtotal, tax, total } = calcTotals(items);
  const label = type === "quote" ? "見積書" : "請求書";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || isDeleting) return; // 二重送信防止（課題1の反省点）
    if (!clientId) {
      setError("クライアントを選択してください。先にクライアントを登録してください。");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("ログイン状態を確認できませんでした。再度ログインしてください。");
      setIsSubmitting(false);
      return;
    }

    const dueDateValue = type === "invoice" && dueDate ? dueDate : null;

    if (isEdit) {
      const { error: docError } = await supabase
        .from("documents")
        .update({
          client_id: clientId,
          issue_date: issueDate,
          due_date: dueDateValue,
          notes: notes || null,
          subtotal,
          tax,
          total,
        })
        .eq("id", document!.id);

      if (docError) {
        setError("更新に失敗しました。" + docError.message);
        setIsSubmitting(false);
        return;
      }

      const { error: deleteItemsError } = await supabase
        .from("document_items")
        .delete()
        .eq("document_id", document!.id);

      if (deleteItemsError) {
        setError("明細の更新に失敗しました。" + deleteItemsError.message);
        setIsSubmitting(false);
        return;
      }

      const itemRows = items
        .filter((item) => item.description.trim() !== "")
        .map((item, i) => ({
          document_id: document!.id,
          description: item.description,
          unit_price: item.unit_price,
          quantity: item.quantity,
          sort_order: i,
        }));

      if (itemRows.length > 0) {
        const { error: itemsError } = await supabase.from("document_items").insert(itemRows);
        if (itemsError) {
          setError("明細の保存に失敗しました。" + itemsError.message);
          setIsSubmitting(false);
          return;
        }
      }

      router.push(`/documents/${document!.id}`);
      router.refresh();
      return;
    }

    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", type);

    const docNumber = nextDocNumber(type, count ?? 0);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        client_id: clientId,
        type,
        doc_number: docNumber,
        status: "draft",
        issue_date: issueDate,
        due_date: dueDateValue,
        notes: notes || null,
        subtotal,
        tax,
        total,
        source_quote_id: sourceQuoteId ?? null,
      })
      .select()
      .single();

    if (docError || !doc) {
      setError("保存に失敗しました。" + (docError?.message ?? ""));
      setIsSubmitting(false);
      return;
    }

    const itemRows = items
      .filter((item) => item.description.trim() !== "")
      .map((item, i) => ({
        document_id: doc.id,
        description: item.description,
        unit_price: item.unit_price,
        quantity: item.quantity,
        sort_order: i,
      }));

    if (itemRows.length > 0) {
      const { error: itemsError } = await supabase.from("document_items").insert(itemRows);
      if (itemsError) {
        setError("明細の保存に失敗しました。" + itemsError.message);
        setIsSubmitting(false);
        return;
      }
    }

    router.push(`/documents/${doc.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!document || isSubmitting || isDeleting) return;
    if (!confirm(`この${label}を削除しますか？この操作は取り消せません。`)) return;
    setIsDeleting(true);
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", document.id);
    if (deleteError) {
      setError("削除に失敗しました。" + deleteError.message);
      setIsDeleting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <div className="card p-8 text-center text-sm text-gray-500">
        {label}を作成する前に、まずクライアントを登録してください。
        <div className="mt-4">
          <a href="/clients/new" className="btn-primary">
            クライアントを登録する
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">クライアント *</label>
            <select
              className="input"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">発行日 *</label>
            <input
              type="date"
              required
              className="input"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
          </div>
          {type === "invoice" && (
            <div>
              <label className="label">支払期限</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold mb-3">明細</h2>
        <DocumentItemsForm items={items} onChange={setItems} />

        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>小計</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>消費税（10%）</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-100">
              <span>合計</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <label className="label">備考</label>
        <textarea
          className="input"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <SubmitButton isSubmitting={isSubmitting}>
            {isEdit ? "更新する" : `${label}を作成する`}
          </SubmitButton>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push(isEdit ? `/documents/${document!.id}` : "/")}
          >
            キャンセル
          </button>
        </div>
        {isEdit && (
          <button
            type="button"
            disabled={isDeleting || isSubmitting}
            onClick={handleDelete}
            className="btn-danger"
          >
            {isDeleting ? "削除中..." : "削除する"}
          </button>
        )}
      </div>
    </form>
  );
}
