import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

const NAV_ITEMS = [
  { href: "/", label: "書類一覧" },
  { href: "/clients", label: "クライアント" },
  { href: "/settings", label: "事業者情報" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-brand-600">
              見積書・請求書ツール
            </Link>
            <nav className="flex items-center gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-gray-600 hover:text-brand-600"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
