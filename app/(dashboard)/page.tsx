import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DocumentListClient from "@/components/DocumentListClient";
import type { DocumentRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: documents } = await supabase
    .from("documents")
    .select("*, clients(*)")
    .order("created_at", { ascending: false });

  const list = (documents ?? []) as DocumentRecord[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">書類一覧</h1>
        <div className="flex gap-2">
          <Link href="/quotes/new" className="btn-secondary">
            + 見積書を作成
          </Link>
          <Link href="/proposals/new" className="btn-secondary">
            + 提案書を作成
          </Link>
          <Link href="/invoices/new" className="btn-primary">
            + 請求書を作成
          </Link>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-500">
          まだ見積書・請求書がありません。まずは「見積書を作成」から始めてください。
        </div>
      ) : (
        <DocumentListClient documents={list} />
      )}
    </div>
  );
}
