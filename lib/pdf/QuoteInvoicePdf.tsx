import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { DocumentRecord, Profile } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/types";
import { formatCurrency } from "@/lib/calc";

// 日本語（Noto Sans JP）フォントを登録。Helvetica等の標準フォントは
// 日本語グリフを持たないため、明示的にフォントファイルを登録する必要がある。
// public/fonts 配下に配置したTTFを、ブラウザ上のPDF生成（pdf().toBlob()）からも
// 参照できるようルート相対パスで登録する。
Font.register({
  family: "Noto Sans JP",
  fonts: [
    { src: "/fonts/NotoSansJP-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/NotoSansJP-Bold.ttf", fontWeight: 700 },
  ],
});

// 日本語フォントには単語区切りの概念がないため、ハイフネーションによる
// 不要な分割を無効化する。
Font.registerHyphenationCallback((word) => [word]);

// 固定で確保する明細の行数。入力が少ない書類でも余白のバランスが崩れないようにする。
const FIXED_ROW_COUNT = 12;

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Noto Sans JP",
    color: "#1f2937",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 2,
  },
  metaTable: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  metaLabel: {
    width: 64,
    color: "#6b7280",
  },
  partiesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },
  partyBlock: {
    width: "48%",
  },
  partyLabel: {
    color: "#6b7280",
    marginBottom: 4,
  },
  partyName: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
  },
  partyLine: {
    color: "#374151",
    lineHeight: 1.5,
  },
  totalBanner: {
    backgroundColor: "#f4f6fb",
    borderRadius: 4,
    padding: 12,
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalBannerLabel: {
    color: "#374151",
  },
  totalBannerValue: {
    fontSize: 18,
    fontWeight: 700,
  },
  table: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 7,
  },
  colDescription: { width: "46%" },
  colPrice: { width: "18%", textAlign: "right" },
  colQty: { width: "14%", textAlign: "right" },
  colAmount: { width: "22%", textAlign: "right" },
  tableHeaderText: {
    color: "#6b7280",
    fontSize: 9,
  },
  summaryBlock: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  summaryRowFinal: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    marginTop: 4,
  },
  summaryLabel: {
    color: "#6b7280",
  },
  summaryLabelFinal: {
    fontWeight: 700,
  },
  notesBlock: {
    marginTop: 32,
  },
  notesLabel: {
    color: "#6b7280",
    marginBottom: 4,
  },
  bankBlock: {
    marginTop: 20,
  },
});

type Props = {
  document: DocumentRecord;
  profile: Profile | null;
};

export default function QuoteInvoicePdf({ document, profile }: Props) {
  const rows = document.document_items ?? [];
  const paddedRows = [...rows];
  while (paddedRows.length < FIXED_ROW_COUNT) {
    paddedRows.push({ description: "", unit_price: 0, quantity: 0, sort_order: paddedRows.length });
  }

  const issuerName = profile?.business_name || profile?.full_name || "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.docTitle}>{TYPE_LABEL[document.type]}</Text>
            <View style={styles.metaTable}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>番号</Text>
                <Text>{document.doc_number}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>発行日</Text>
                <Text>{document.issue_date}</Text>
              </View>
              {document.type === "invoice" && document.due_date && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>支払期限</Text>
                  <Text>{document.due_date}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>宛先</Text>
            <Text style={styles.partyName}>{document.clients?.name ?? ""} 御中</Text>
            {document.clients?.address && (
              <Text style={styles.partyLine}>{document.clients.address}</Text>
            )}
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>発行者</Text>
            <Text style={styles.partyName}>{issuerName}</Text>
            {profile?.address && <Text style={styles.partyLine}>{profile.address}</Text>}
          </View>
        </View>

        <View style={styles.totalBanner}>
          <Text style={styles.totalBannerLabel}>ご{document.type === "quote" ? "見積" : "請求"}金額（税込）</Text>
          <Text style={styles.totalBannerValue}>{formatCurrency(document.total)}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDescription, styles.tableHeaderText]}>品目</Text>
            <Text style={[styles.colPrice, styles.tableHeaderText]}>単価</Text>
            <Text style={[styles.colQty, styles.tableHeaderText]}>数量</Text>
            <Text style={[styles.colAmount, styles.tableHeaderText]}>金額</Text>
          </View>
          {paddedRows.map((item, i) => {
            const hasContent = item.description.trim() !== "";
            const lineTotal = hasContent ? item.unit_price * item.quantity : null;
            return (
              <View style={styles.tableRow} key={i}>
                <Text style={styles.colDescription}>{item.description}</Text>
                <Text style={styles.colPrice}>
                  {hasContent ? formatCurrency(item.unit_price) : ""}
                </Text>
                <Text style={styles.colQty}>{hasContent ? item.quantity : ""}</Text>
                <Text style={styles.colAmount}>
                  {lineTotal !== null ? formatCurrency(lineTotal) : ""}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryBlock}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>小計</Text>
            <Text>{formatCurrency(document.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>消費税（10%）</Text>
            <Text>{formatCurrency(document.tax)}</Text>
          </View>
          <View style={styles.summaryRowFinal}>
            <Text style={styles.summaryLabelFinal}>合計</Text>
            <Text style={styles.summaryLabelFinal}>{formatCurrency(document.total)}</Text>
          </View>
        </View>

        {document.type === "invoice" && profile?.bank_info && (
          <View style={styles.bankBlock}>
            <Text style={styles.notesLabel}>お振込先</Text>
            <Text style={styles.partyLine}>{profile.bank_info}</Text>
          </View>
        )}

        {document.notes && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesLabel}>備考</Text>
            <Text style={styles.partyLine}>{document.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
