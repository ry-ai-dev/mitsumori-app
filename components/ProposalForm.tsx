"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubmitButton from "@/components/SubmitButton";
import ProposalSectionsForm from "@/components/ProposalSectionsForm";
import { nextDocNumber } from "@/lib/calc";
import type { Client, DocumentRecord, ProposalSection } from "@/lib/types";

type Props = {
  clients: Client[];
  document?: DocumentRecord;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const DEFAULT_SECTION_HEADINGS = [
  "現状の課題",
  "提案する解決策",
  "想定効果",
  "技術構成",
  "スケジュールと費用",
];

export default function ProposalForm({ clients, document }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(document);

  const [clientId, setClientId] = useState(document?.client_id ?? clients[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState(document?.issue_date ?? todayStr());
  const [notes, setNotes] = useState(document?.notes ?? "");
  const [sections, setSections] = useState<ProposalSection[]>(
    document?.proposal_sections && document.proposal_sections.length > 0
      ? document.proposal_sections
      : DEFAULT_SECTION_HEADINGS.map((heading) => ({ heading, body: "" }))
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

    if (isEdit) {
      const { error: docError } = await supabase
        .from("documents")
        .update({
          client_id: clientId,
          issue_date: issueDate,
          notes: notes || null,
          proposal_sections: sections,
        })
        .eq("id", document!.id);

      if (docError) {
        setError("更新に失敗しました。" + docError.message);
        setIsSubmitting(false);
        return;
      }

      router.push(`/documents/${document!.id}`);
      router.refresh();
      return;
    }

    const { count } = await supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("type", "proposal");

    const docNumber = nextDocNumber("proposal", count ?? 0);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        client_id: clientId,
        type: "proposal",
        doc_number: docNumber,
        status: "draft",
        issue_date: issueDate,
        due_date: null,
        notes: notes || null,
        subtotal: 0,
        tax: 0,
        total: 0,
        source_quote_id: null,
        proposal_sections: sections,
      })
      .select()
      .single();

    if (docError || !doc) {
      setError("保存に失敗しました。" + (docError?.message ?? ""));
      setIsSubmitting(false);
      return;
    }

    router.push(`/documents/${doc.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!document || isSubmitting || isDeleting) return;
    if (!confirm("この提案書を削除しますか？この操作は取り消せません。")) return;
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
        提案書を作成する前に、まずクライアントを登録してください。
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
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold mb-3">提案内容</h2>
        <ProposalSectionsForm sections={sections} onChange={setSections} />
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
            {isEdit ? "更新する" : "提案書を作成する"}
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
