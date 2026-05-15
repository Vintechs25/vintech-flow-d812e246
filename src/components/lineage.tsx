import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function LineageBadge({ chain }: { chain: (string | null | undefined)[] }) {
  const items = chain.filter(Boolean) as string[];
  if (items.length === 0) return null;
  return (
    <Badge variant="outline" className="font-mono text-[10px]">
      {items.join(" → ")}
    </Badge>
  );
}

export function LockedHint({ source }: { source: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-muted-foreground"><Lock className="h-3 w-3" /></span>
        </TooltipTrigger>
        <TooltipContent>Sourced from {source} — edit the source to change</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
