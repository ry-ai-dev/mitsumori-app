# 見積書・請求書作成ツール

フリーランス案件向けの見積書・請求書作成ツール（Next.js + Supabase + @react-pdf/renderer）。

このプロジェクトはClaude（チャット環境）で途中まで実装したものです。**チャット環境ではnpmレジストリへのアクセスが制限されており、`npm install`・動作確認・PDFフォントの検証ができませんでした。** ここから先はCursor / Claude Code CLIなど、実際にコマンドが実行できるローカル環境（または別のClaude Codeセッション）で続きを進めてください。

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.local に Supabase の URL / anon key を記入
npm run dev
```

Supabase側では `supabase/migrations/0001_init.sql` を SQL Editor で実行してテーブルとRLSを作成してください。

## 実装済み

- プロジェクト雛形一式（package.json・Tailwind・TypeScript設定）
- Supabaseスキーマ・RLS（`supabase/migrations/0001_init.sql`）
- 認証（ログイン/サインアップ、`middleware.ts`での保護ルート）
- クライアント管理（`/clients`, `/clients/new`, `/clients/[id]`）
- 事業者情報設定（`/settings`）
- 見積書・請求書 作成フォーム（`/quotes/new`, `/invoices/new`）
  - 明細行の追加・削除、小計・消費税・合計の自動計算
  - 見積書 → 請求書の変換（`/invoices/new?from=<quoteId>` で明細を引き継ぎ）
- 書類一覧ページ（`/`、検索・種別/状態フィルタ）
- PDFテンプレート（`lib/pdf/QuoteInvoicePdf.tsx`）※要確認事項あり、下記参照

## 未実装（ここから先にお願いしたい作業）

1. **書類詳細ページ（`/documents/[id]`）**
   - 明細・合計の表示
   - ステータス変更（下書き/送付済み/入金済み）を更新するUI
   - PDFダウンロードボタン（`@react-pdf/renderer` の `pdf(<QuoteInvoicePdf .../>).toBlob()` を使う想定）
   - 見積書の場合は「請求書に変換」ボタン（`/invoices/new?from=<このドキュメントid>` に遷移するだけでOK）
   - すべて `IMPLEMENTATION_PLAN.md` の設計方針に沿って実装してください

2. **PDFの日本語フォント対応（要注意・最優先で確認してください）**
   - `@react-pdf/renderer` の標準フォント（Helvetica等）は日本語グリフを持っていません。このままでは PDF 上で日本語が表示されない可能性が高いです
   - `lib/pdf/QuoteInvoicePdf.tsx` 内で `Font.register` を使い、Noto Sans JP等の日本語フォント（TTF/OTF/WOFF）を登録し、`styles` の `fontFamily` に指定する対応が必要です
   - 例: `@fontsource/noto-sans-jp` パッケージのCDN配布ファイルを `Font.register({ family: "Noto Sans JP", src: "<URL>" })` で読み込む方法があります。ローカル環境で実際にPDFを生成し、日本語が正しく表示されるか必ず確認してください

3. **動作確認一式**
   - `npm run build` が通ることの確認
   - 認証 → クライアント登録 → 見積書作成 → PDF出力 → 請求書変換、の一連の流れを実際に動かしての確認

## デプロイ前チェックリスト（課題1の反省を反映）

Vercelにデプロイする前に、以下を必ず確認してください（課題1でこの登録漏れがあったため）：

- [ ] `NEXT_PUBLIC_SUPABASE_URL` をVercelのEnvironment Variablesに登録した
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` をVercelのEnvironment Variablesに登録した
- [ ] Production / Preview / Development すべての環境にチェックを入れた
- [ ] 環境変数登録後、Redeployを実行した（登録しただけでは反映されない）

## 参考ドキュメント

- `requirements.md` — 要件定義書
- `IMPLEMENTATION_PLAN.md` — 実装計画（Plan Modeで承認したもの）
