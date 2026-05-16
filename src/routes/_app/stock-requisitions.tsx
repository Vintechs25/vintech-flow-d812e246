import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, FileCheck2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ProductPicker } from "@/components/product-picker";
import { PinApprovalDialog } from "@/components/pin-approval-dialog";
import { RevertDialog } from "@/components/revert-dialog";
import { AuditTab } from "@/components/audit-tab";
import { StatusBadge } from "@/components/status-badge";
import { logAudit } from "@/lib/audit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/stock-requisitions")({ component: StockRequisitionsPage });

function StockRequisitionsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [department, setDepartment] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [revertId, setRevertId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  async function refresh() {
    const { data } = await supabase.from("stock_requisitions").select("*, items:stock_requisition_items(*, products(name,sku))").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function create() {
    if (!department) return toast.error("Department required");
    if (!items.length) return toast.error("Add at least one item from catalogue");
    const { data: srNo } = await supabase.rpc("next_doc_no", { _doc_type: "stock_requisition" });
    const { data: u } = await supabase.auth.getUser();
    const { data: sr, error } = await supabase.from("stock_requisitions")
      .insert({ sr_no: srNo as string, department, urgency, reason, created_by: u.user?.id, status: "pending" })
      .select().single();
    if (error || !sr) return toast.error(error?.message ?? "Failed");
    const payload = items.map((i) => ({
      sr_id: sr.id, product_id: i.product_id, description: i.description, quantity: Number(i.quantity), unit: i.unit ?? "pcs",
    }));
    await supabase.from("stock_requisition_items").insert(payload);
    await logAudit("stock_requisitions", sr.id, "created");
    toast.success(`Stock Requisition ${srNo} created`);
    setDepartment(""); setReason(""); setItems([]);
    refresh();
  }

  async function approve(id: string) {
    const { data: u } = await supabase.auth.getUser();
    await supabase.from("stock_requisitions").update({ status: "approved", approved_by: u.user?.id, approved_at: new Date().toISOString() }).eq("id", id);
    await logAudit("stock_requisitions", id, "PIN approved");
    toast.success("Approved");
    refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Requisitions</h1>
        <p className="text-sm text-muted-foreground">Catalogue-only items · Store Manager PIN approval</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">New Requisition</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Department</Label><Input value={department} onChange={(e) => setDepartment(e.target.value)} /></div>
            <div><Label>Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          </div>

          <div className="border rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Items (catalogue search only)</span>
              <ProductPicker onSelect={(p) => setItems([...items, { product_id: p.id, description: p.name, unit: p.unit, quantity: 1 }])} />
            </div>
            {items.length === 0 && <p className="text-xs text-muted-foreground">No items added. Use catalogue search above. Items not listed? Ask admin to add them in Settings → Products.</p>}
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7 text-sm">{it.description} <span className="text-xs text-muted-foreground">({it.unit})</span></div>
                <div className="col-span-3"><Input type="number" min={1} value={it.quantity} onChange={(e) => setItems(items.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))} /></div>
                <div className="col-span-2"><Button size="sm" variant="ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button></div>
              </div>
            ))}
          </div>

          <Button onClick={create}><Plus className="h-3 w-3 mr-1" />Create Requisition</Button>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>
            <TableHead>No.</TableHead><TableHead>Department</TableHead><TableHead>Urgency</TableHead>
            <TableHead>Items</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">No requisitions yet</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.sr_no}</TableCell>
                  <TableCell>{r.department}</TableCell>
                  <TableCell className="capitalize">{r.urgency}</TableCell>
                  <TableCell>{r.items?.length ?? 0}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="ghost" onClick={() => setOpenId(openId === r.id ? null : r.id)}>Audit</Button>
                    {r.status === "pending" && <Button size="sm" onClick={() => setApproveId(r.id)}><FileCheck2 className="h-3 w-3 mr-1" />Approve</Button>}
                    {r.status === "approved" && <Button size="sm" variant="outline" onClick={() => setRevertId(r.id)}><RotateCcw className="h-3 w-3 mr-1" />Revert</Button>}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {openId && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Audit trail</CardTitle></CardHeader>
          <CardContent><AuditTab table="stock_requisitions" docId={openId} /></CardContent>
        </Card>
      )}

      <PinApprovalDialog open={!!approveId} onOpenChange={(o) => !o && setApproveId(null)}
        title="Approve Stock Requisition"
        onApproved={async () => { if (approveId) await approve(approveId); }} />
      {revertId && (
        <RevertDialog open={!!revertId} onOpenChange={(o) => !o && setRevertId(null)}
          table="stock_requisitions" docId={revertId} docLabel="Stock Requisition"
          onReverted={refresh} />
      )}
    </div>
  );
}
