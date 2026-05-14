import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { Receipt, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/invoices")({ component: InvoicesPage });

function fmtKES(n: number) { return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0); }

function InvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    (async () => {
      const [inv, cus] = await Promise.all([
        supabase.from("invoices").select("*").order("created_at", { ascending: false }).limit(100),
        supabase.from("customers").select("id, name"),
      ]);
      setRows(inv.data ?? []);
      setCustomers(new Map((cus.data ?? []).map((c: any) => [c.id, c.name])));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <p className="text-sm text-muted-foreground">CLPO → Quote → SO → DN → Invoice → Receipt</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center justify-between">All Invoices <Link to="/sales" className="text-xs text-primary hover:underline">Open Sales →</Link></CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No invoices yet</p>
              <Button asChild size="sm"><Link to="/sales">Create Invoice</Link></Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice</TableHead><TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead>
                  <TableHead>Status</TableHead><TableHead>Due</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{r.invoice_no}</TableCell>
                      <TableCell className="text-xs">{customers.get(r.customer_id) ?? "—"}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(r.total))}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(r.amount_paid ?? 0))}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.due_date ?? "—"}</TableCell>
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
