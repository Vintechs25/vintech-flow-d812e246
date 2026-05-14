import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Inbox } from "lucide-react";

export const Route = createFileRoute("/_app/stock")({ component: StockLevelsPage });
function fmtKES(n: number) { return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0); }

function StockLevelsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { supabase.from("products").select("*").order("name").then(({ data }) => setRows(data ?? [])); }, []);
  const filtered = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.sku.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Levels</h1>
        <p className="text-sm text-muted-foreground">Live inventory across all SKUs</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">All Items</CardTitle>
          <Input placeholder="Search SKU or name…" value={q} onChange={(e) => setQ(e.target.value)} className="w-[240px]" />
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No items match</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Reorder</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Selling</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const low = Number(r.stock_qty) <= Number(r.reorder_level);
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell className="text-sm">{r.name}</TableCell>
                        <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                        <TableCell className="text-right">{r.stock_qty}</TableCell>
                        <TableCell className="text-right text-xs">{r.reorder_level}</TableCell>
                        <TableCell className="text-right text-xs">{fmtKES(Number(r.cost_price))}</TableCell>
                        <TableCell className="text-right">{fmtKES(Number(r.selling_price))}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={low ? "bg-warning/15 text-warning border-warning/30" : "bg-success/15 text-success border-success/30"}>
                            {low ? "Low" : "OK"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
void Inbox;
