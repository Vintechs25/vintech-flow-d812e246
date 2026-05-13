import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 text-warning border-warning/30",
  approved: "bg-success/15 text-success border-success/30",
  completed: "bg-success/15 text-success border-success/30",
  paid: "bg-success/15 text-success border-success/30",
  partial: "bg-info/15 text-info border-info/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  blocked: "bg-destructive/15 text-destructive border-destructive/30",
  void: "bg-destructive/10 text-muted-foreground border-border",
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status ?? "draft").toLowerCase();
  return (
    <Badge variant="outline" className={cn("capitalize", map[s] ?? map.draft)}>
      {s}
    </Badge>
  );
}
