import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/SettingsForm";
import type { Profile } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">事業者情報設定</h1>
      <p className="text-sm text-gray-500 mb-6">
        見積書・請求書の発行者欄に表示される、あなた自身の情報を登録してください。
      </p>
      <SettingsForm profile={profile as Profile | null} email={user!.email ?? ""} />
    </div>
  );
}
