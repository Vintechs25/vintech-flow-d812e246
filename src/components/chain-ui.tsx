import { AlertTriangle } from "lucide-react";

export function BlockBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive-foreground/90 p-3 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex items-center gap-2 whitespace-nowrap">
            <span
              className={
                "h-6 w-6 rounded-full grid place-items-center text-[10px] font-semibold border " +
                (done
                  ? "bg-primary text-primary-foreground border-primary"
                  : active
                  ? "bg-primary/20 text-primary border-primary/50"
                  : "bg-muted text-muted-foreground border-border")
              }
            >
              {i + 1}
            </span>
            <span className={done || active ? "text-foreground" : "text-muted-foreground"}>{s}</span>
            {i < steps.length - 1 && <span className="text-muted-foreground mx-1">→</span>}
          </li>
        );
      })}
    </ol>
  );
}
