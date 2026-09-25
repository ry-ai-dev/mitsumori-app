"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import SubmitButton from "@/components/SubmitButton";

export default function SignupPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return; // 二重送信防止
    setIsSubmitting(true);
    setError(null);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError("登録に失敗しました。" + error.message);
      setIsSubmitting(false);
      return;
    }

    setDone(true);
    setIsSubmitting(false);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm card p-8 text-center">
          <h1 className="text-lg font-semibold mb-2">確認メールを送信しました</h1>
          <p className="text-sm text-gray-600 mb-4">
            登録したメールアドレス宛に確認メールを送りました。メール内のリンクを開いて登録を完了してください。
          </p>
          <Link href="/login" className="text-brand-500 hover:underline text-sm">
            ログインページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm card p-8">
        <h1 className="text-lg font-semibold mb-6">新規登録</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">メールアドレス</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">パスワード（8文字以上）</label>
            <input
              type="password"
              required
              minLength={8}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton isSubmitting={isSubmitting} className="btn-primary w-full">
            登録する
          </SubmitButton>
        </form>
        <p className="text-sm text-gray-500 mt-4">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-brand-500 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
