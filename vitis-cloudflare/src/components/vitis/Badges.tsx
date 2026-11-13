import { Badge } from "@/components/ui/badge";
import { CONTENT_TYPES, STATUSES, isOverdue } from "@/lib/labels";

export function ExampleBadge() {
  return <Badge variant="example">Exemplo</Badge>;
}
export function StatusBadge({ status, nextReview }: { status: string; nextReview?: string | null }) {
  if (isOverdue(status, nextReview)) return <Badge variant="warning">Revisão necessária</Badge>;
  const v =
    status === "published" ? "success" : status === "archived" ? "critical" : status === "approved" ? "brand" : status === "in_review" ? "warning" : "muted";
  return <Badge variant={v}>{STATUSES[status as keyof typeof STATUSES] ?? status}</Badge>;
}
export function TypeBadge({ type }: { type: string }) {
  return <Badge variant="outline">{CONTENT_TYPES[type as keyof typeof CONTENT_TYPES] ?? type}</Badge>;
}
