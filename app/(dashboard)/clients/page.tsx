import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (clients ?? []) as Client[];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">クライアント</h1>
        <Link href="/clients/new" className="btn-primary">
          + 新規登録
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 text-sm">
          まだクライアントが登録されていません。まずは「新規登録」からクライアントを追加してください。
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {list.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{c.name}</p>
                {c.contact_email && (
                  <p className="text-sm text-gray-500">{c.contact_email}</p>
                )}
              </div>
              <span className="text-gray-400 text-sm">編集 →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
