"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubmitButton from "@/components/SubmitButton";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Profile | null;
  email: string;
};

export default function SettingsForm({ profile, email }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [businessName, setBusinessName] = useState(profile?.business_name ?? "");
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [bankInfo, setBankInfo] = useState(profile?.bank_info ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return; // 二重送信防止
    setIsSubmitting(true);
    setError(null);
    setSaved(false);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("ログイン状態を確認できませんでした。");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      business_name: businessName || null,
      full_name: fullName || null,
      address: address || null,
      bank_info: bankInfo || null,
    });

    if (error) {
      setError("保存に失敗しました。" + error.message);
      setIsSubmitting(false);
      return;
    }

    setSaved(true);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4 max-w-lg">
      <div>
        <label className="label">ログインメールアドレス</label>
        <input className="input bg-gray-50" value={email} disabled />
      </div>
      <div>
        <label className="label">屋号 / 事業者名</label>
        <input
          className="input"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">氏名</label>
        <input
          className="input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
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
        <label className="label">振込先情報</label>
        <textarea
          className="input"
          rows={3}
          placeholder="銀行名・支店名・口座種別・口座番号・口座名義など"
          value={bankInfo}
          onChange={(e) => setBankInfo(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">保存しました。</p>}

      <SubmitButton isSubmitting={isSubmitting}>保存する</SubmitButton>
    </form>
  );
}
