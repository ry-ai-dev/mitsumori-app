"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DocumentRecord, DocumentStatus, DocumentType } from "@/lib/types";
import { STATUS_LABEL, TYPE_LABEL } from "@/lib/types";
import { formatCurrency } from "@/lib/calc";
import StatusBadge from "@/components/StatusBadge";

type Props = {
  documents: DocumentRecord[];
};

export default function DocumentListClient({ documents }: Props) {
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | "all">("all");

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (typeFilter !== "all" && doc.type !== typeFilter) return false;
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      if (keyword.trim()) {
        const kw = keyword.trim().toLowerCase();
        const haystack = `${doc.doc_number} ${doc.clients?.name ?? ""}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [documents, keyword, typeFilter, statusFilter]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="input max-w-xs"
          placeholder="番号・クライアント名で検索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          className="input max-w-[9rem]"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DocumentType | "all")}
        >
          <option value="all">種別: すべて</option>
          <option value="quote">見積書</option>
          <option value="invoice">請求書</option>
        </select>
        <select
          className="input max-w-[9rem]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | "all")}
        >
          <option value="all">状態: すべて</option>
          {(Object.keys(STATUS_LABEL) as DocumentStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          条件に一致する書類がありません。
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {filtered.map((doc) => (
            <Link
              key={doc.id}
              href={`/documents/${doc.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-400 w-20">{doc.doc_number}</span>
                <div>
                  <p className="font-medium">
                    {TYPE_LABEL[doc.type]} ・ {doc.clients?.name ?? "（削除済みクライアント）"}
                  </p>
                  <p className="text-sm text-gray-500">発行日: {doc.issue_date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">{formatCurrency(doc.total)}</span>
                <StatusBadge status={doc.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
