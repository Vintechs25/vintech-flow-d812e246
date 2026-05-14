import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Boxes, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/items")({ component: ItemsPage });
function fmtKES(n: number) { return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0); }

function ItemsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { supabase.from("products").select("*").order("name").then(({ data }) => setRows(data ?? [])); }, []);
  const filtered = rows.filter((r) => !q || r.name.toLowerCase().includes(q.toLowerCase()) || r.sku.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Items & Catalogue</h1>
        <p className="text-sm text-muted-foreground">Product master — managed in Settings</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Catalogue</CardTitle>
          <div className="flex gap-2">
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="w-[200px]" />
            <Button asChild size="sm" variant="outline"><Link to="/settings">Manage</Link></Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No items in catalogue</p>
              <Button asChild size="sm"><Link to="/settings">Add Item</Link></Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>SKU</TableHead><TableHead>Barcode</TableHead><TableHead>Unit</TableHead><TableHead className="text-right">Cost</TableHead><TableHead className="text-right">Sell</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="text-sm">{r.name}</TableCell>
                      <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                      <TableCell className="font-mono text-xs">{r.barcode ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.unit ?? "pcs"}</TableCell>
                      <TableCell className="text-right text-xs">{fmtKES(Number(r.cost_price))}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(r.selling_price))}</TableCell>
                      <TableCell><Badge variant="outline" className={r.is_active ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}>{r.is_active ? "Active" : "Inactive"}</Badge></TableCell>
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
void Boxes;
