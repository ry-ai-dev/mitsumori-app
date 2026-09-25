import type { DocumentStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const COLOR: Record<DocumentStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
