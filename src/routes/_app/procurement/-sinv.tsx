import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BlockBanner } from "@/components/chain-ui";

export function SupplierInvoices() {
  const [rows, setRows] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  async function refresh() {
    const { data } = await supabase.from("supplier_invoices").select("*, lpos(lpo_no, total)").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => {
    refresh();
    supabase.from("grns").select("id, grn_no, lpo_id, status, lpos(lpo_no, total)").eq("status", "completed").then(({ data }) => setGrns(data ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">3-Way Match: LPO ↔ GRN ↔ Invoice. Mismatches block payment.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={grns.length === 0}><Plus className="h-4 w-4 mr-1" />New Supplier Invoice</Button></DialogTrigger>
          <NewSinvDialog grns={grns} onClose={(s: boolean) => { setOpen(false); if (s) refresh(); }} />
        </Dialog>
      </div>
      {grns.length === 0 && <BlockBanner>No completed GRNs — sign &amp; post a GRN first.</BlockBanner>}
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Invoice No</TableHead><TableHead>LPO</TableHead><TableHead className="text-right">LPO Total</TableHead>
            <TableHead className="text-right">Invoice Amt</TableHead><TableHead>Match</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-muted-foreground">No supplier invoices</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.invoice_no}</TableCell>
                  <TableCell>{r.lpos?.lpo_no}</TableCell>
                  <TableCell className="text-right">{Number(r.lpos?.total ?? 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(r.amount).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      r.match_status === "matched" ? "border-success/40 text-success bg-success/10"
                      : r.match_status === "mismatch" ? "border-destructive/40 text-destructive bg-destructive/10"
                      : "border-warning/40 text-warning bg-warning/10"
                    }>{r.match_status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NewSinvDialog({ grns, onClose }: any) {
  const [grnId, setGrnId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [amount, setAmount] = useState(0);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!grnId || !invoiceNo) return toast.error("Invoice no and GRN required");
    const grn = grns.find((g: any) => g.id === grnId);
    const lpoTotal = Number(grn?.lpos?.total ?? 0);
    const match_status = Math.abs(lpoTotal - amount) < 0.01 ? "matched" : "mismatch";
    setSaving(true);
    try {
      const { error } = await supabase.from("supplier_invoices").insert({
        invoice_no: invoiceNo, lpo_id: grn.lpo_id, grn_id: grnId, amount, match_status,
      });
      if (error) throw error;
      toast.success(match_status === "matched" ? "Invoice matched" : "Mismatch — payment blocked");
      onClose(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New Supplier Invoice</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>GRN</Label>
          <Select value={grnId} onValueChange={setGrnId}>
            <SelectTrigger><SelectValue placeholder="Select GRN" /></SelectTrigger>
            <SelectContent>{grns.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.grn_no} ({g.lpos?.lpo_no})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Supplier Invoice No</Label><Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} /></div>
        <div><Label>Amount (KES)</Label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={save} disabled={saving}>Save</Button>
      </DialogFooter>
    </DialogContent>
  );
}
