import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_app/reports")({ component: ReportsPage });

function toCsv(rows: any[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
function downloadCsv(name: string, rows: any[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [lpos, setLpos] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("pos_sales").select("sale_no, total, payment_method, status, created_at").order("created_at", { ascending: false }).limit(200).then(({ data }) => setSales(data ?? []));
    supabase.from("products").select("sku, name, stock_qty, reorder_level, cost_price, selling_price").then(({ data }) => setStock(data ?? []));
    supabase.from("invoices").select("invoice_no, total, amount_paid, status, due_date, created_at").then(({ data }) => setInvoices(data ?? []));
    supabase.from("lpos").select("lpo_no, total, status, created_at").then(({ data }) => setLpos(data ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports &amp; Analytics</h1>
        <p className="text-sm text-muted-foreground">All reports exportable to CSV</p>
      </div>
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="proc">Procurement</TabsTrigger>
          <TabsTrigger value="inv">Invoices</TabsTrigger>
        </TabsList>
        {[
          { val: "sales", title: "POS Sales", rows: sales, file: "sales" },
          { val: "stock", title: "Stock Levels", rows: stock, file: "stock" },
          { val: "proc", title: "LPO Register", rows: lpos, file: "lpos" },
          { val: "inv", title: "Invoices", rows: invoices, file: "invoices" },
        ].map(({ val, title, rows, file }) => (
          <TabsContent key={val} value={val}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{title}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => downloadCsv(file, rows)}>
                  <Download className="h-3 w-3 mr-1" />Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto max-h-[60vh]">
                  <Table>
                    <TableHeader>
                      <TableRow>{rows[0] && Object.keys(rows[0]).map((k) => <TableHead key={k}>{k}</TableHead>)}</TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.length === 0 ? <TableRow><TableCell className="text-muted-foreground">No data</TableCell></TableRow>
                        : rows.map((r, i) => (
                          <TableRow key={i}>{Object.keys(rows[0]).map((k) => <TableCell key={k} className="text-xs">{String(r[k] ?? "—")}</TableCell>)}</TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
