import { supabase } from "@/integrations/supabase/client";

/** Append-only audit entry. Silent on failure to avoid blocking UX. */
export async function logAudit(table: string, recordId: string, action: string, reason?: string) {
  try {
    await supabase.rpc("log_audit", {
      _table: table, _record_id: recordId, _action: action,
      _old: null, _new: null, _reason: reason ?? null,
    });
  } catch { /* noop */ }
}
