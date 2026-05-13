import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { BlockBanner } from "@/components/chain-ui";
import { nextDocNo } from "@/hooks/use-table";

export function PaymentVouchers() {
  const [rows, setRows] = useState<any[]>([]);
  const [matched, setMatched] = useState<any[]>([]);

  async function refresh() {
    const { data } = await supabase.from("payment_vouchers").select("*, supplier_invoices(invoice_no, amount)").order("created_at", { ascending: false });
    setRows(data ?? []);
    const { data: m } = await supabase.from("supplier_invoices").select("id, invoice_no, amount, match_status").eq("match_status", "matched");
    setMatched(m ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function createPv(invId: string, amount: number) {
    try {
      const pv_no = await nextDocNo("PV");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("payment_vouchers").insert({
        pv_no, supplier_invoice_id: invId, amount, method: "bank", status: "pending", authorised_by: user?.id,
      });
      if (error) throw error;
      toast.success(`Created ${pv_no}`);
      refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  async function pay(id: string) {
    const ra_no = await nextDocNo("RA");
    const { error } = await supabase.from("payment_vouchers").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("remittance_advice").insert({ ra_no, payment_voucher_id: id, reference: ra_no });
    toast.success(`Paid · Remittance ${ra_no}`);
    refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Block: only matched supplier invoices can be paid. Remittance auto-issued on payment.</p>
      {matched.length === 0 && <BlockBanner>No matched invoices to pay.</BlockBanner>}
      {matched.length > 0 && (
        <div className="rounded-md border p-3">
          <div className="text-sm font-medium mb-2">Matched invoices ready to pay</div>
          <div className="space-y-1">
            {matched.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="font-mono">{m.invoice_no}</span>
                <span>KES {Number(m.amount).toLocaleString()}</span>
                <Button size="sm" variant="outline" onClick={() => createPv(m.id, m.amount)}>Raise PV</Button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>PV No</TableHead><TableHead>Invoice</TableHead><TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">No payment vouchers</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.pv_no}</TableCell>
                  <TableCell>{r.supplier_invoices?.invoice_no}</TableCell>
                  <TableCell className="text-right">{Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell className="capitalize">{r.method}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    {r.status !== "paid" && <Button size="sm" variant="outline" onClick={() => pay(r.id)}>Mark paid</Button>}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
