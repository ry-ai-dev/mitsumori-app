"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import StatusBadge from "@/components/StatusBadge";
import PdfDownloadButton from "@/components/PdfDownloadButton";
import { formatCurrency } from "@/lib/calc";
import type { DocumentRecord, DocumentStatus, Profile } from "@/lib/types";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/types";

type Props = {
  document: DocumentRecord;
  profile: Profile | null;
};

const STATUS_OPTIONS: DocumentStatus[] = ["draft", "sent", "paid"];

export default function DocumentDetail({ document, profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = document.document_items ?? [];
  const label = TYPE_LABEL[document.type];

  async function handleStatusChange(next: DocumentStatus) {
    if (isUpdatingStatus || next === status) return; // 二重送信防止（課題1の反省点）
    setIsUpdatingStatus(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("documents")
      .update({ status: next })
      .eq("id", document.id);

    if (updateError) {
      setError("ステータスの更新に失敗しました。" + updateError.message);
      setIsUpdatingStatus(false);
      return;
    }

    setStatus(next);
    setIsUpdatingStatus(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{document.doc_number}</p>
          <h1 className="text-xl font-semibold">
            {label} ・ {document.clients?.name ?? "（削除済みクライアント）"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {document.type === "quote" && (
            <Link href={`/invoices/new?from=${document.id}`} className="btn-secondary">
              請求書に変換
            </Link>
          )}
          <Link href={`/documents/${document.id}/edit`} className="btn-secondary">
            編集する
          </Link>
          <PdfDownloadButton document={{ ...document, status }} profile={profile} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="card p-6 grid grid-cols-2 gap-6">
        <div>
          <p className="label">宛先</p>
          <p className="font-medium">{document.clients?.name ?? "（削除済みクライアント）"}</p>
          {document.clients?.address && (
            <p className="text-sm text-gray-500">{document.clients.address}</p>
          )}
          {document.clients?.contact_email && (
            <p className="text-sm text-gray-500">{document.clients.contact_email}</p>
          )}
        </div>
        <div>
          <p className="label">発行日</p>
          <p className="text-sm text-gray-700">{document.issue_date}</p>
          {document.type === "invoice" && document.due_date && (
            <>
              <p className="label mt-3">支払期限</p>
              <p className="text-sm text-gray-700">{document.due_date}</p>
            </>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">ステータス</h2>
          <StatusBadge status={status} />
        </div>
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={isUpdatingStatus || s === status}
              onClick={() => handleStatusChange(s)}
              className={s === status ? "btn-primary" : "btn-secondary"}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {document.type === "proposal" ? (
        <div className="space-y-4">
          {(document.proposal_sections ?? []).map((section, i) => (
            <div key={i} className="card p-6">
              <h2 className="text-sm font-semibold mb-3">{section.heading}</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{section.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6">
          <h2 className="text-sm font-semibold mb-3">明細</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">品目</th>
                <th className="py-2 font-medium text-right">単価</th>
                <th className="py-2 font-medium text-right">数量</th>
                <th className="py-2 font-medium text-right">金額</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-400">
                    明細がありません。
                  </td>
                </tr>
              ) : (
                items.map((item, i) => (
                  <tr key={item.id ?? i} className="border-b border-gray-50">
                    <td className="py-2">{item.description}</td>
                    <td className="py-2 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-6 border-t border-gray-100 pt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>小計</span>
                <span>{formatCurrency(document.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>消費税（10%）</span>
                <span>{formatCurrency(document.tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-100">
                <span>合計</span>
                <span>{formatCurrency(document.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {document.notes && (
        <div className="card p-6">
          <p className="label">備考</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{document.notes}</p>
        </div>
      )}
    </div>
  );
}
