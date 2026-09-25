"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubmitButton from "@/components/SubmitButton";
import type { Client } from "@/lib/types";

type Props = {
  client?: Client;
};

export default function ClientForm({ client }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = Boolean(client);

  const [name, setName] = useState(client?.name ?? "");
  const [address, setAddress] = useState(client?.address ?? "");
  const [contactEmail, setContactEmail] = useState(client?.contact_email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || isDeleting) return; // 二重送信防止
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

    const payload = {
      name,
      address: address || null,
      contact_email: contactEmail || null,
      user_id: user.id,
    };

    const { error } = isEdit
      ? await supabase.from("clients").update(payload).eq("id", client!.id)
      : await supabase.from("clients").insert(payload);

    if (error) {
      setError("保存に失敗しました。" + error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/clients");
    router.refresh();
  }

  async function handleDelete() {
    if (!client || isSubmitting || isDeleting) return;
    if (!confirm("このクライアントを削除しますか？関連する書類は削除されません。")) return;
    setIsDeleting(true);
    const { error } = await supabase.from("clients").delete().eq("id", client.id);
    if (error) {
      setError("削除に失敗しました。既存の見積書・請求書で参照されている可能性があります。");
      setIsDeleting(false);
      return;
    }
    router.push("/clients");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-lg">
      <div>
        <label className="label">クライアント名 *</label>
        <input
          required
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">住所</label>
        <textarea
          className="input"
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div>
        <label className="label">連絡先メールアドレス</label>
        <input
          type="email"
          className="input"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <SubmitButton isSubmitting={isSubmitting}>
            {isEdit ? "更新する" : "登録する"}
          </SubmitButton>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => router.push("/clients")}
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
