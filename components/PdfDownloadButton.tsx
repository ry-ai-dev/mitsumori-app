"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";
import type { DocumentRecord, Profile } from "@/lib/types";

type Props = {
  document: DocumentRecord;
  profile: Profile | null;
};

export default function PdfDownloadButton({ document, profile }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownloadPdf() {
    if (isDownloading) return; // 二重送信防止（課題1の反省点）
    setIsDownloading(true);
    setError(null);

    try {
      // @react-pdf/renderer はサイズが大きいため、ダウンロード実行時のみ動的読み込みする
      const isProposal = document.type === "proposal";
      const [{ pdf }, { default: PdfTemplate }] = await Promise.all([
        import("@react-pdf/renderer"),
        isProposal ? import("@/lib/pdf/ProposalPdf") : import("@/lib/pdf/QuoteInvoicePdf"),
      ]);
      const blob = await pdf(
        <PdfTemplate document={document} profile={profile} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${document.doc_number}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("PDFの生成に失敗しました。" + (e instanceof Error ? e.message : ""));
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div>
      <SubmitButton
        isSubmitting={isDownloading}
        submittingLabel="生成中..."
        className="btn-primary"
        type="button"
        onClick={handleDownloadPdf}
      >
        PDFダウンロード
      </SubmitButton>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
