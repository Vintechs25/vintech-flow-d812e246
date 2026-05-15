import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckCircle2, Printer, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { BlockBanner } from "@/components/chain-ui";
import { nextDocNo } from "@/hooks/use-table";
import { PinApprovalDialog } from "@/components/pin-approval-dialog";
import { ProofUpload } from "@/components/proof-upload";
import { PrintDialog, type DocPrintData } from "@/components/print-dialog";
import { LineageBadge } from "@/components/lineage";

export function Grns() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [lpos, setLpos] = useState<any[]>([]);
  const [pinTarget, setPinTarget] = useState<string | null>(null);
  const [proofFor, setProofFor] = useState<any | null>(null);
  const [printFor, setPrintFor] = useState<DocPrintData | null>(null);

  async function refresh() {
    const { data } = await supabase.from("grns").select("*, lpos(lpo_no, suppliers(name, kra_pin, address)), grn_items(received_qty, lpo_qty, products(name, unit, selling_price))").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => {
    refresh();
    supabase.from("lpos").select("id, lpo_no, lpo_items(id, product_id, description, quantity)").eq("status", "approved").then(({ data }) => setLpos(data ?? []));
  }, []);

  async function complete(id: string) {
    const { error } = await supabase.from("grns").update({ status: "completed" }).eq("id", id);
    if (error) return toast.error(error.message);
    await supabase.from("audit_log").insert({ action: "grn_post", table_name: "grns", record_id: id });
    toast.success("GRN posted — stock updated");
    refresh();
  }

  function openPrint(r: any) {
    setPrintFor({
      docType: "GOODS RECEIVED NOTE",
      docNo: r.grn_no,
      date: new Date(r.created_at).toLocaleDateString(),
      reference: r.lpos?.lpo_no ? `${r.lpos.lpo_no} → ${r.grn_no}` : undefined,
      billTo: { name: r.lpos?.suppliers?.name ?? "—", kra_pin: r.lpos?.suppliers?.kra_pin, address: r.lpos?.suppliers?.address },
      lines: (r.grn_items ?? []).map((it: any) => ({
        description: it.products?.name ?? "—",
        quantity: Number(it.received_qty ?? 0),
        unit: it.products?.unit ?? "pcs",
        unit_price: Number(it.products?.selling_price ?? 0),
      })),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Block: no signed GRN = no stock update, no payment.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button disabled={lpos.length === 0}><Plus className="h-4 w-4 mr-1" />New GRN</Button></DialogTrigger>
          <NewGrnDialog lpos={lpos} onClose={(s: boolean) => { setOpen(false); if (s) refresh(); }} />
        </Dialog>
      </div>
      {lpos.length === 0 && <BlockBanner>No approved LPOs available — issue an LPO first.</BlockBanner>}
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>GRN No</TableHead><TableHead>Lineage</TableHead><TableHead>Supplier</TableHead>
            <TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-muted-foreground">No GRNs yet</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.grn_no}</TableCell>
                  <TableCell><LineageBadge chain={[r.lpos?.lpo_no, r.grn_no]} /></TableCell>
                  <TableCell>{r.lpos?.suppliers?.name}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => openPrint(r)}><Printer className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setProofFor(r)}><Paperclip className="h-3 w-3" /></Button>
                    {r.status !== "completed" && (
                      <Button size="sm" variant="outline" onClick={() => setPinTarget(r.id)}>
                        <CheckCircle2 className="h-3 w-3 mr-1" />Approve &amp; Post
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <PinApprovalDialog
        open={!!pinTarget}
        onOpenChange={(o) => !o && setPinTarget(null)}
        title="Authorise GRN posting"
        description="This will update stock levels."
        onApproved={async () => { if (pinTarget) await complete(pinTarget); setPinTarget(null); }}
      />

      <Dialog open={!!proofFor} onOpenChange={(o) => !o && setProofFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Proof for {proofFor?.grn_no}</DialogTitle></DialogHeader>
          {proofFor && <ProofUpload docType="grn" docId={proofFor.id} />}
        </DialogContent>
      </Dialog>

      {printFor && <PrintDialog open={!!printFor} onOpenChange={(o) => !o && setPrintFor(null)} doc={printFor} />}
    </div>
  );
}

function NewGrnDialog({ lpos, onClose }: any) {
  const [lpoId, setLpoId] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  function pickLpo(id: string) {
    setLpoId(id);
    const lpo = lpos.find((l: any) => l.id === id);
    setItems((lpo?.lpo_items ?? []).map((i: any) => ({
      lpo_item_id: i.id, product_id: i.product_id, description: i.description,
      lpo_qty: i.quantity, received_qty: i.quantity, condition: "good", batch: "", expiry: "",
    })));
  }

  async function save() {
    if (!lpoId) return toast.error("Select LPO");
    setSaving(true);
    try {
      const grn_no = await nextDocNo("GRN");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: grn, error } = await supabase.from("grns").insert({
        grn_no, lpo_id: lpoId, supervisor_signature: supervisor, received_by: user?.id, status: "draft",
      }).select("id").single();
      if (error) throw error;
      await supabase.from("grn_items").insert(items.map((i) => ({
        grn_id: grn.id, lpo_item_id: i.lpo_item_id, product_id: i.product_id,
        lpo_qty: i.lpo_qty, received_qty: i.received_qty, condition: i.condition,
        batch: i.batch || null, expiry: i.expiry || null,
      })));
      toast.success(`Created ${grn_no}. Sign &amp; Post to update stock.`);
      onClose(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>New Goods Received Note</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>LPO</Label>
          <Select value={lpoId} onValueChange={pickLpo}>
            <SelectTrigger><SelectValue placeholder="Select LPO" /></SelectTrigger>
            <SelectContent>{lpos.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.lpo_no}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Supervisor signature</Label><Input value={supervisor} onChange={(e) => setSupervisor(e.target.value)} /></div>
      </div>
      {items.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-auto">
          <Label>Received items</Label>
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center text-sm">
              <div className="col-span-5">{it.description}</div>
              <div className="col-span-2 text-muted-foreground">LPO: {it.lpo_qty}</div>
              <Input className="col-span-2" type="number" value={it.received_qty}
                onChange={(e) => setItems((a) => a.map((x, idx) => idx === i ? { ...x, received_qty: Number(e.target.value) } : x))} />
              <Input className="col-span-3" placeholder="Batch/Serial" value={it.batch}
                onChange={(e) => setItems((a) => a.map((x, idx) => idx === i ? { ...x, batch: e.target.value } : x))} />
            </div>
          ))}
        </div>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={save} disabled={saving}>Save GRN</Button>
      </DialogFooter>
    </DialogContent>
  );
}
