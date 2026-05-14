import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/payments")({ component: PaymentsPage });
function fmtKES(n: number) { return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0); }

function PaymentsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [pvs, setPvs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("receipts").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => setReceipts(data ?? []));
    supabase.from("payment_vouchers").select("*").order("created_at", { ascending: false }).limit(100).then(({ data }) => setPvs(data ?? []));
  }, []);

  const Empty = ({ to, label }: { to: string; label: string }) => (
    <div className="text-center py-10 text-muted-foreground">
      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm mb-3">No records</p>
      <Button asChild size="sm"><Link to={to}>{label}</Link></Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">Receipts (AR) and Payment Vouchers (AP)</p>
      </div>
      <Tabs defaultValue="rec">
        <TabsList>
          <TabsTrigger value="rec">Receipts</TabsTrigger>
          <TabsTrigger value="pv">Payment Vouchers</TabsTrigger>
        </TabsList>
        <TabsContent value="rec">
          <Card><CardHeader><CardTitle className="text-base">Receipts</CardTitle></CardHeader>
            <CardContent>
              {receipts.length === 0 ? <Empty to="/sales" label="Record Receipt" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Method</TableHead><TableHead>M-Pesa</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {receipts.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{r.receipt_no}</TableCell>
                        <TableCell className="text-xs uppercase">{r.method}</TableCell>
                        <TableCell className="font-mono text-xs">{r.mpesa_code ?? "—"}</TableCell>
                        <TableCell className="text-right">{fmtKES(Number(r.amount))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pv">
          <Card><CardHeader><CardTitle className="text-base">Payment Vouchers</CardTitle></CardHeader>
            <CardContent>
              {pvs.length === 0 ? <Empty to="/procurement" label="Create Voucher" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>PV</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {pvs.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{p.pv_no}</TableCell>
                        <TableCell className="text-xs uppercase">{p.method}</TableCell>
                        <TableCell className="text-xs uppercase">{p.status}</TableCell>
                        <TableCell className="text-right">{fmtKES(Number(p.amount))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
