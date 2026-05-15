import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { BlockBanner } from "@/components/chain-ui";
import { nextDocNo } from "@/hooks/use-table";
import { PaymentTermsSelect } from "@/components/payment-terms-select";

type Item = { description: string; quantity: number; unit_price: number };

export function Lpos() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [prs, setPrs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  async function refresh() {
    const { data } = await supabase.from("lpos").select("*, suppliers(name), purchase_requisitions(pr_no)").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => {
    refresh();
    supabase.from("purchase_requisitions").select("id, pr_no").eq("status", "approved").then(({ data }) => setPrs(data ?? []));
    supabase.from("suppliers").select("id, name, kra_pin").then(({ data }) => setSuppliers(data ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Block: cannot raise an LPO without an approved PR.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={prs.length === 0 || suppliers.length === 0}><Plus className="h-4 w-4 mr-1" />New LPO</Button></DialogTrigger>
          <NewLpoDialog prs={prs} suppliers={suppliers} onClose={(s: boolean) => { setOpen(false); if (s) refresh(); }} />
        </Dialog>
      </div>
      {prs.length === 0 && <BlockBanner>No approved PR available.</BlockBanner>}
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>LPO No</TableHead><TableHead>Supplier</TableHead><TableHead>PR Ref</TableHead>
            <TableHead className="text-right">Total (KES)</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-muted-foreground">No LPOs yet</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.lpo_no}</TableCell>
                  <TableCell>{r.suppliers?.name}</TableCell>
                  <TableCell>{r.purchase_requisitions?.pr_no || "—"}</TableCell>
                  <TableCell className="text-right">{Number(r.total).toLocaleString()}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NewLpoDialog({ prs, suppliers, onClose }: any) {
  const [prId, setPrId] = useState("");
  const [supId, setSupId] = useState("");
  const [date, setDate] = useState("");
  const [terms, setTerms] = useState("Net 30");
  const [signatory, setSignatory] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unit_price: 0 }]);
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((a, i) => a + i.quantity * i.unit_price, 0);
  const vat = subtotal * 0.16;
  const total = subtotal + vat;

  function setItem(i: number, p: Partial<Item>) {
    setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, ...p } : it));
  }

  async function save() {
    if (!prId) return toast.error("PR is required (chain enforcement)");
    if (!supId) return toast.error("Select supplier");
    if (!signatory.trim()) return toast.error("Authorised signatory required");
    if (items.some((i) => !i.description || i.quantity <= 0 || i.unit_price < 0)) return toast.error("Complete all items");
    setSaving(true);
    try {
      const lpo_no = await nextDocNo("LPO");
      const supplier = suppliers.find((s: any) => s.id === supId);
      const { data: lpo, error } = await supabase.from("lpos").insert({
        lpo_no, pr_id: prId, supplier_id: supId, delivery_date: date || null, payment_terms: terms,
        subtotal, vat, total, signatory, kra_pin: supplier?.kra_pin, status: "approved",
      }).select("id").single();
      if (error) throw error;
      await supabase.from("lpo_items").insert(items.map((i) => ({ ...i, lpo_id: lpo.id })));
      toast.success(`Created ${lpo_no}`);
      onClose(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader><DialogTitle>New Local Purchase Order</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Purchase Requisition</Label>
          <Select value={prId} onValueChange={setPrId}>
            <SelectTrigger><SelectValue placeholder="Approved PR" /></SelectTrigger>
            <SelectContent>{prs.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.pr_no}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Supplier</Label>
          <Select value={supId} onValueChange={setSupId}>
            <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
            <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Delivery date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div><Label>Payment terms</Label><PaymentTermsSelect value={terms} onChange={setTerms} /></div>
        <div className="col-span-2"><Label>Authorised signatory</Label><Input value={signatory} onChange={(e) => setSignatory(e.target.value)} /></div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Items</Label>
          <Button variant="outline" size="sm" onClick={() => setItems((a) => [...a, { description: "", quantity: 1, unit_price: 0 }])}>
            <Plus className="h-3 w-3 mr-1" />Add
          </Button>
        </div>
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <Input className="flex-1" placeholder="Description" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
            <Input className="w-20" type="number" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
            <Input className="w-28" type="number" placeholder="Unit price" value={it.unit_price} onChange={(e) => setItem(i, { unit_price: Number(e.target.value) })} />
            <div className="w-24 text-right text-sm">{(it.quantity * it.unit_price).toFixed(2)}</div>
            <Button size="icon" variant="ghost" onClick={() => setItems((a) => a.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
        <div className="text-right text-sm space-y-1 mt-2">
          <div>Subtotal: <span className="font-mono">{subtotal.toFixed(2)}</span></div>
          <div>VAT 16%: <span className="font-mono">{vat.toFixed(2)}</span></div>
          <div className="font-semibold">Total: <span className="font-mono">{total.toFixed(2)}</span> KES</div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={save} disabled={saving}>Save LPO</Button>
      </DialogFooter>
    </DialogContent>
  );
}
