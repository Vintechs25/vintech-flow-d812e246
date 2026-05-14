import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeftRight, Inbox } from "lucide-react";

export const Route = createFileRoute("/_app/stock-movement")({ component: StockMovementPage });

function StockMovementPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [products, setProducts] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const [m, p] = await Promise.all([
        supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("products").select("id, name, sku"),
      ]);
      setRows(m.data ?? []);
      setProducts(new Map((p.data ?? []).map((x: any) => [x.id, `${x.sku} — ${x.name}`])));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Movement</h1>
        <p className="text-sm text-muted-foreground">All inbound and outbound stock changes</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Movements</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No stock movement yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Qty</TableHead><TableHead>Ref</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("en-KE")}</TableCell>
                      <TableCell className="text-xs">{products.get(r.product_id) ?? r.product_id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs uppercase">{r.movement_type}</TableCell>
                      <TableCell className={`text-right text-xs ${Number(r.qty_change) >= 0 ? "text-success" : "text-destructive"}`}>{Number(r.qty_change) >= 0 ? "+" : ""}{r.qty_change}</TableCell>
                      <TableCell className="text-xs">{r.ref_doc_type ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.notes ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
void ArrowLeftRight;
