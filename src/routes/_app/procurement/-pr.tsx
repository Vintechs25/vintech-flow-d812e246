import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { nextDocNo } from "@/hooks/use-table";
import { ProductPicker, type ProductLite } from "@/components/product-picker";

type Item = { description: string; quantity: number; unit: string; product_id?: string | null };

export function PurchaseRequisitions() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data } = await supabase.from("purchase_requisitions").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function setStatus(id: string, status: "approved" | "rejected") {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("purchase_requisitions").update({
      status, approved_by: user?.id, approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`PR ${status}`);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Block: nothing proceeds without an approved PR.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New PR</Button></DialogTrigger>
          <NewPRDialog onClose={(saved) => { setOpen(false); if (saved) refresh(); }} />
        </Dialog>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>PR No</TableHead><TableHead>Department</TableHead><TableHead>Urgency</TableHead>
            <TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6}>Loading…</TableCell></TableRow>
              : rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">No requisitions yet</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.pr_no}</TableCell>
                  <TableCell>{r.department || "—"}</TableCell>
                  <TableCell className="capitalize">{r.urgency}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right space-x-1">
                    {r.status !== "approved" && r.status !== "rejected" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "approved")}>
                          <Check className="h-3 w-3 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, "rejected")}>
                          <X className="h-3 w-3 mr-1" />Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function NewPRDialog({ onClose }: { onClose: (saved: boolean) => void }) {
  const [department, setDepartment] = useState("");
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", quantity: 1, unit: "pcs" }]);
  const [saving, setSaving] = useState(false);

  function setItem(i: number, patch: Partial<Item>) {
    setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  }

  async function save() {
    if (items.some((i) => !i.description.trim() || i.quantity <= 0)) return toast.error("Pick a product and qty > 0 for each line");
    setSaving(true);
    try {
      const pr_no = await nextDocNo("PR");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: pr, error } = await supabase.from("purchase_requisitions").insert({
        pr_no, department, budget_code: budget, urgency, reason, status: "pending", created_by: user?.id,
      }).select("id").single();
      if (error) throw error;
      const { error: e2 } = await supabase.from("pr_items").insert(items.map((i) => ({
        pr_id: pr.id, description: i.description, quantity: i.quantity, unit: i.unit,
      })));
      if (e2) throw e2;
      toast.success(`Created ${pr_no}`);
      onClose(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>New Purchase Requisition</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Department</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
        <div><Label>Budget code</Label><Input value={budget} onChange={(e) => setBudget(e.target.value)} /></div>
        <div>
          <Label>Urgency</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Reason / Justification</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Items</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((a) => [...a, { description: "", quantity: 1, unit: "pcs" }])}>
            <Plus className="h-3 w-3 mr-1" />Add item
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input className="flex-1" placeholder="Description" value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
              <Input className="w-24" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} />
              <Input className="w-20" placeholder="Unit" value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} />
              <Button type="button" size="icon" variant="ghost" onClick={() => setItems((a) => a.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={() => onClose(false)}>Cancel</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save PR"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
