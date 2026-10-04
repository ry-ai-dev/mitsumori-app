import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { DocumentRecord, Profile } from "@/lib/types";
import { TYPE_LABEL } from "@/lib/types";

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
  sectionBlock: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  sectionBody: {
    color: "#374151",
    lineHeight: 1.6,
  },
  notesBlock: {
    marginTop: 32,
  },
  notesLabel: {
    color: "#6b7280",
    marginBottom: 4,
  },
});

type Props = {
  document: DocumentRecord;
  profile: Profile | null;
};

export default function ProposalPdf({ document, profile }: Props) {
  const sections = document.proposal_sections ?? [];
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

        {sections.map((section, i) => (
          <View style={styles.sectionBlock} key={i}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

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
