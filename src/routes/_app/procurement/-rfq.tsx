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
import { StatusBadge } from "@/components/status-badge";
import { BlockBanner } from "@/components/chain-ui";
import { nextDocNo } from "@/hooks/use-table";

export function Rfqs() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [prs, setPrs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  async function refresh() {
    const { data } = await supabase.from("rfqs").select("*, purchase_requisitions(pr_no)").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => {
    refresh();
    supabase.from("purchase_requisitions").select("id, pr_no, status").eq("status", "approved").then(({ data }) => setPrs(data ?? []));
    supabase.from("suppliers").select("id, name").then(({ data }) => setSuppliers(data ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Send RFQ to ≥3 suppliers. Compare quotes and select winning supplier.</p>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={prs.length === 0}><Plus className="h-4 w-4 mr-1" /> New RFQ</Button></DialogTrigger>
          <NewRfqDialog prs={prs} suppliers={suppliers} onClose={(s: boolean) => { setOpen(false); if (s) refresh(); }} />
        </Dialog>
      </div>
      {prs.length === 0 && <BlockBanner>No approved PRs available — approve a PR first.</BlockBanner>}
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>RFQ No</TableHead><TableHead>PR Ref</TableHead><TableHead>Required by</TableHead>
            <TableHead>Payment terms</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-muted-foreground">No RFQs yet</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.rfq_no}</TableCell>
                  <TableCell>{r.purchase_requisitions?.pr_no || "—"}</TableCell>
                  <TableCell>{r.required_delivery || "—"}</TableCell>
                  <TableCell>{r.payment_terms || "—"}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NewRfqDialog({ prs, suppliers, onClose }: any) {
  const [prId, setPrId] = useState("");
  const [date, setDate] = useState("");
  const [terms, setTerms] = useState("Net 30");
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(id: string) {
    setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function save() {
    if (!prId) return toast.error("Select a PR");
    if (picked.length < 3) return toast.error("Select at least 3 suppliers");
    setSaving(true);
    try {
      const rfq_no = await nextDocNo("RFQ");
      const { data: rfq, error } = await supabase.from("rfqs").insert({
        rfq_no, pr_id: prId, required_delivery: date || null, payment_terms: terms, status: "pending",
      }).select("id").single();
      if (error) throw error;
      await supabase.from("rfq_suppliers").insert(picked.map((s) => ({ rfq_id: rfq.id, supplier_id: s })));
      toast.success(`Created ${rfq_no}`);
      onClose(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>New RFQ</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Purchase Requisition (approved)</Label>
          <Select value={prId} onValueChange={setPrId}>
            <SelectTrigger><SelectValue placeholder="Select PR" /></SelectTrigger>
            <SelectContent>{prs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.pr_no}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Required delivery</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><Label>Payment terms</Label><Input value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
        </div>
        <div>
          <Label>Suppliers (pick 3+)</Label>
          {suppliers.length === 0 ? <p className="text-xs text-muted-foreground mt-1">Add suppliers in Settings first.</p>
            : <div className="grid grid-cols-2 gap-2 mt-1 max-h-40 overflow-auto">
              {suppliers.map((s: any) => (
                <label key={s.id} className="flex items-center gap-2 text-sm border border-border rounded-md px-2 py-1 cursor-pointer hover:bg-muted">
                  <input type="checkbox" checked={picked.includes(s.id)} onChange={() => toggle(s.id)} />
                  {s.name}
                </label>
              ))}
            </div>}
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={save} disabled={saving}>Save RFQ</Button>
      </DialogFooter>
    </DialogContent>
  );
}
