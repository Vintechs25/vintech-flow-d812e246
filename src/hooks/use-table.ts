import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTable<T = any>(table: string, opts?: { order?: string; ascending?: boolean; filter?: (q: any) => any }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q: any = supabase.from(table).select("*").order(opts?.order ?? "created_at", { ascending: opts?.ascending ?? false });
    if (opts?.filter) q = opts.filter(q);
    const { data } = await q;
    setData((data ?? []) as T[]);
    setLoading(false);
  }, [table]);

  useEffect(() => { refresh(); }, [refresh]);
  return { data, loading, refresh };
}

export async function nextDocNo(docType: string): Promise<string> {
  const { data, error } = await supabase.rpc("next_doc_no", { _doc_type: docType });
  if (error) throw error;
  return data as string;
}
