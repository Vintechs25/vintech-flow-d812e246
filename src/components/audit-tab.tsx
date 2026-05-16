import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

/** Reads from audit_log filtered by table+record_id. Read-only timeline. */
export function AuditTab({ table, docId }: { table: string; docId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_log").select("*")
        .eq("table_name", table).eq("record_id", docId).order("created_at", { ascending: false });
      setRows(data ?? []);
      const ids = [...new Set((data ?? []).map(r => r.user_id).filter(Boolean))] as string[];
      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("id,full_name,email").in("id", ids);
        const map: any = {};
        (ps ?? []).forEach(p => { map[p.id] = p; });
        setProfiles(map);
      }
    })();
  }, [table, docId]);
  if (!rows.length) return <p className="text-xs text-muted-foreground p-3">No audit entries yet.</p>;
  return (
    <ScrollArea className="h-72 rounded-md border p-3">
      <ol className="space-y-2">
        {rows.map((r) => {
          const u = profiles[r.user_id];
          return (
            <li key={r.id} className="flex gap-3 text-xs border-l-2 border-primary/50 pl-3">
              <Clock className="h-3 w-3 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-mono text-[10px] text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </div>
                <div className="font-medium">{r.action}</div>
                {u && <div className="text-muted-foreground">{u.full_name || u.email}</div>}
                {r.reason && <div className="italic text-muted-foreground mt-1">"{r.reason}"</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </ScrollArea>
  );
}
