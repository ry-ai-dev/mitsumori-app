# 実装計画: 見積書・請求書作成ツール

## Context

課題2として、フリーランス案件受注に向けて実務で使える「見積書・請求書作成ツール」を作る。要件定義書（`/home/claude/requirements2.md`）は確定済み。このセッションの作業環境にはGitリポジトリが存在しない（グリーンフィールド）ため、既存コードの探索フェーズは不要。Next.jsプロジェクトをこの作業環境内で新規スキャフォールドし、完成後にファイル一式をユーザーへ送付する。デプロイ（Vercel/GitHub）はユーザー側の環境で行う想定。

課題1で発生した問題（ボタン連打による二重送信、Vercel環境変数の登録漏れ）を踏まえ、実装の最初から二重送信防止と環境変数チェックリストを組み込む。

## 技術スタック

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase（PostgreSQL / Auth / RLS）— `@supabase/supabase-js` + `@supabase/ssr`
- PDF生成: `@react-pdf/renderer`（Reactコンポーネントとして帳票を定義し、クライアント側でPDFダウンロード）
- フォームバリデーション: `zod` + `react-hook-form`（軽量に。過剰にならない範囲で）

## データモデル（Supabase / PostgreSQL）

`supabase/migrations/0001_init.sql` としてSQLを作成する。

```
profiles          -- 事業者情報（発行者自身）。auth.users と1:1
  id (uuid, PK, = auth.uid())
  business_name, full_name, address, bank_info (text), created_at

clients            -- クライアント（宛先）
  id (uuid, PK)
  user_id (uuid, FK -> auth.users)
  name, address, contact_email, created_at

documents          -- 見積書・請求書
  id (uuid, PK)
  user_id (uuid, FK -> auth.users)
  client_id (uuid, FK -> clients)
  type ('quote' | 'invoice')
  doc_number (text)          -- 例: Q-0001 / INV-0001
  status ('draft' | 'sent' | 'paid')
  issue_date, due_date (nullable, invoiceのみ使用)
  notes (text, nullable)
  subtotal, tax, total (numeric)
  source_quote_id (uuid, nullable) -- 見積書から変換した請求書の場合、元見積書を参照
  created_at

document_items     -- 明細行
  id (uuid, PK)
  document_id (uuid, FK -> documents)
  description, unit_price (numeric), quantity (numeric), sort_order (int)
```

RLSポリシー: 全テーブルで `user_id = auth.uid()`（documentsは直接user_id列を持つ非正規化設計とし、JOINを増やさない）。`document_items` は親 `documents` の `user_id` を通してポリシー判定。

採番（`doc_number`）: MVPでは複雑なシーケンステーブルを作らず、作成時に「同一user_id・同一typeの既存件数+1」をゼロ埋めして採番する（個人利用規模のため十分）。

## ディレクトリ構成（App Router）

```
app/
  login/page.tsx
  signup/page.tsx
  (dashboard)/
    layout.tsx              -- 認証チェック + 共通ヘッダー
    page.tsx                -- 書類一覧 "/"
    quotes/new/page.tsx
    invoices/new/page.tsx
    documents/[id]/page.tsx
    clients/page.tsx
    clients/[id]/page.tsx   -- 新規は [id]="new" で分岐 or /clients/new を別ルートに
    settings/page.tsx
lib/
  supabase/{client.ts, server.ts, middleware.ts}
  pdf/QuoteInvoicePdf.tsx   -- @react-pdf/renderer テンプレート（見積書/請求書共通）
  calc.ts                  -- 小計・税額・合計の計算ロジック
components/
  DocumentItemsForm.tsx    -- 明細行の追加・削除・入力
  ClientSelect.tsx
  StatusBadge.tsx
middleware.ts              -- 未ログイン時に /login へリダイレクト
```

## 主要機能の実装方針

1. **認証**: Supabase Auth（メール+パスワード）。`middleware.ts` で保護ルートを判定。ログイン/サインアップは既存パターン（Supabase公式のNext.js App Router用SSR構成）に準拠。

2. **クライアント管理・事業者情報設定**: シンプルなCRUDフォーム。特別な設計は不要。

3. **見積書・請求書作成フォーム**:
   - クライアント選択（登録済みから選択）
   - 明細行（品目・単価・数量）を動的に追加/削除、`calc.ts` でリアルタイムに小計・消費税（10%固定でMVP）・合計を計算
   - 送信ボタンは送信中 `disabled` にし、`isSubmitting` state で二重送信を防止（課題1の反省点）
   - 保存時に `doc_number` を採番してDB登録

4. **見積書→請求書変換**: 書類詳細ページに「請求書に変換」ボタン。既存の見積書データ（クライアント・明細）をコピーして請求書作成フォームに引き継ぐ（`source_quote_id` を記録）。

5. **PDF生成**: `@react-pdf/renderer` でテンプレートコンポーネントを作成。
   - ヘッダー（書類種別・番号・発行日）／宛先・発行者情報／明細テーブル／合計／備考、の固定区画構成
   - 明細テーブルは行数を固定（例: 12行）にし、未入力分は罫線のみの空行として描画 → 余白と規則性のあるレイアウトを実現（要件定義書7章の方針）
   - 書類詳細ページの「PDFダウンロード」ボタンから `@react-pdf/renderer` の `pdf().toBlob()` でクライアント生成してダウンロード

6. **書類一覧**: ステータス・種別でのフィルタ、クライアント名・番号での検索（クライアントサイドfilterで十分、件数が少ないため）。

## 環境変数チェックリスト（課題1の反省を反映）

`.env.local.example` を作成し、以下を明記する:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

README（またはデプロイ手順メモ）に「Vercelにデプロイする前に、この2つをVercelのEnvironment Variablesに登録したか確認する」というチェック項目を明記する。

## 実装順序

1. プロジェクトscaffold（create-next-app, Tailwind, 依存パッケージ導入）
2. SupabaseマイグレーションSQL作成（テーブル + RLS）
3. Supabaseクライアント設定 + 認証（login/signup + middleware）
4. クライアント管理・事業者情報設定ページ
5. 見積書・請求書作成フォーム（`calc.ts` 含む）
6. 書類一覧・詳細ページ（ステータス変更、見積書→請求書変換）
7. PDF生成テンプレート + ダウンロード機能
8. `.env.local.example` / README（環境変数チェックリスト・セットアップ手順）作成
9. 動作確認（`npm run build` が通ることを確認）し、ファイル一式をユーザーに送付

## 検証方法

- `npm run build` でビルドエラーがないことを確認
- ローカルでSupabaseの環境変数がない状態でも起動時にクラッシュしない（該当画面でエラーメッセージが出る程度）ことを確認
- 主要ページ（一覧・作成フォーム・詳細・PDF生成部分）のコードを読み返し、要件定義書のF-01〜F-11がすべてカバーされているか照合
