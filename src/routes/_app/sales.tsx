import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { StepIndicator, BlockBanner } from "@/components/chain-ui";
import { nextDocNo } from "@/hooks/use-table";
import { PaymentTermsSelect } from "@/components/payment-terms-select";
import { DocActions } from "@/components/doc-actions";
import { PinApprovalDialog } from "@/components/pin-approval-dialog";
import type { DocPrintData } from "@/components/print-dialog";

export const Route = createFileRoute("/_app/sales")({ component: SalesPage });

const STEPS = ["Customer LPO", "Quotation", "Sales Order", "Picking", "Packing", "Delivery Note", "Invoice", "Receipt"];

function SalesPage() {
  const [tab, setTab] = useState("clpo");
  const idx = ["clpo", "quote", "so", "pick", "pack", "dn", "inv", "rct", "cn"].indexOf(tab);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sales (Stock Out)</h1>
        <p className="text-sm text-muted-foreground">
          Customer LPO → Quotation → SO → Picking → Packing → Delivery Note → Invoice → Receipt (Credit Note when needed)
        </p>
      </div>
      <StepIndicator steps={STEPS} current={Math.min(idx, STEPS.length - 1)} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="clpo">Customer LPOs</TabsTrigger>
          <TabsTrigger value="quote">Quotations</TabsTrigger>
          <TabsTrigger value="so">Sales Orders</TabsTrigger>
          <TabsTrigger value="pick">Picking</TabsTrigger>
          <TabsTrigger value="pack">Packing</TabsTrigger>
          <TabsTrigger value="dn">Delivery Notes</TabsTrigger>
          <TabsTrigger value="inv">Invoices</TabsTrigger>
          <TabsTrigger value="rct">Receipts</TabsTrigger>
          <TabsTrigger value="cn">Credit Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="clpo"><CustomerLpos /></TabsContent>
        <TabsContent value="quote"><Quotations /></TabsContent>
        <TabsContent value="so"><SalesOrders /></TabsContent>
        <TabsContent value="pick"><PickingLists /></TabsContent>
        <TabsContent value="pack"><PackingNotes /></TabsContent>
        <TabsContent value="dn"><DeliveryNotes /></TabsContent>
        <TabsContent value="inv"><Invoices /></TabsContent>
        <TabsContent value="rct"><Receipts /></TabsContent>
        <TabsContent value="cn"><CreditNotes /></TabsContent>
      </Tabs>
    </div>
  );
}

// ============ Hooks/utilities ============
function useList(table: string, order = "created_at") {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    const { data } = await (supabase as any).from(table).select("*").order(order, { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);
  return { rows, loading, refresh };
}

function useLookup(table: string) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (supabase as any).from(table).select("*").order("name", { ascending: true }).then(({ data }: any) => setRows(data ?? []));
  }, [table]);
  return rows;
}

type LineItem = { product_id: string | null; description: string; quantity: number; unit_price: number };
const emptyItem = (): LineItem => ({ product_id: null, description: "", quantity: 1, unit_price: 0 });

function ItemsEditor({ items, setItems, products }: { items: LineItem[]; setItems: (i: LineItem[]) => void; products: any[] }) {
  function patch(i: number, p: Partial<LineItem>) {
    setItems(items.map((it, idx) => idx === i ? { ...it, ...p } : it));
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Items</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, emptyItem()])}>
          <Plus className="h-3 w-3 mr-1" />Add
        </Button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Select value={it.product_id ?? "free"} onValueChange={(v) => {
            if (v === "free") return patch(i, { product_id: null });
            const p = products.find((x) => x.id === v);
            patch(i, { product_id: v, description: p?.name ?? "", unit_price: Number(p?.selling_price ?? 0) });
          }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Product" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">— free text —</SelectItem>
              {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.sku} · {p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="flex-1" placeholder="Description" value={it.description} onChange={(e) => patch(i, { description: e.target.value })} />
          <Input className="w-20" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => patch(i, { quantity: Number(e.target.value) })} />
          <Input className="w-28" type="number" placeholder="Price" value={it.unit_price} onChange={(e) => patch(i, { unit_price: Number(e.target.value) })} />
          <Button type="button" size="icon" variant="ghost" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function totalsFor(items: LineItem[], vatRate = 16) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const vat = +(subtotal * (vatRate / 100)).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), vat, total };
}

const fmt = (n: number | null | undefined) => `KES ${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// ============ 1. Customer LPOs ============
function CustomerLpos() {
  const { rows, loading, refresh } = useList("customer_lpos");
  const customers = useLookup("customers");
  const [open, setOpen] = useState(false);
  const [customer_id, setCust] = useState("");
  const [customer_lpo_no, setLpoNo] = useState("");
  const [notes, setNotes] = useState("");

  async function save() {
    if (!customer_id || !customer_lpo_no) return toast.error("Customer & LPO number required");
    const clpo_no = await nextDocNo("CLPO");
    const { error } = await supabase.from("customer_lpos").insert({ clpo_no, customer_id, customer_lpo_no, notes });
    if (error) return toast.error(error.message);
    toast.success(`Recorded ${clpo_no}`);
    setOpen(false); setCust(""); setLpoNo(""); setNotes(""); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Record incoming customer Local Purchase Orders. Required for B2B invoices.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New CLPO</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Customer LPO</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Customer</Label>
                <Select value={customer_id} onValueChange={setCust}>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Customer LPO Number</Label><Input value={customer_lpo_no} onChange={(e) => setLpoNo(e.target.value)} /></div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["CLPO No", "Customer LPO #", "Customer", "Notes", "Created"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.clpo_no}</TableCell>
            <TableCell className="font-mono">{r.customer_lpo_no}</TableCell>
            <TableCell>{customers.find((c) => c.id === r.customer_id)?.name ?? "—"}</TableCell>
            <TableCell className="text-muted-foreground">{r.notes || "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </DocTable>
    </div>
  );
}

// ============ 2. Quotations ============
function Quotations() {
  const { rows, loading, refresh } = useList("quotations");
  const customers = useLookup("customers");
  const products = useLookup("products");
  const [open, setOpen] = useState(false);
  const [customer_id, setCust] = useState("");
  const [validity, setValidity] = useState("");
  const [payment_terms, setPT] = useState("Net 30");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const t = totalsFor(items);

  async function save() {
    if (!customer_id) return toast.error("Customer required");
    if (items.some((i) => !i.description || i.quantity <= 0)) return toast.error("Items invalid");
    const quote_no = await nextDocNo("QT");
    const { data: q, error } = await supabase.from("quotations").insert({
      quote_no, customer_id, validity: validity || null, payment_terms, status: "pending",
      subtotal: t.subtotal, vat: t.vat, total: t.total,
    }).select("id").single();
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("quotation_items").insert(items.map((i) => ({ ...i, quotation_id: q.id })));
    if (e2) return toast.error(e2.message);
    toast.success(`Created ${quote_no}`);
    setOpen(false); setItems([emptyItem()]); setCust(""); refresh();
  }

  async function setStatus(id: string, status: string) {
    await supabase.from("quotations").update({ status: status as any }).eq("id", id);
    await supabase.rpc("log_audit" as any, { _table: "quotations", _record_id: id, _action: status });
    refresh();
  }
  const [pinFor, setPinFor] = useState<{ id: string; status: string } | null>(null);

  function buildPrint(r: any): DocPrintData {
    const c = customers.find((x) => x.id === r.customer_id);
    return {
      docType: "QUOTATION", docNo: r.quote_no, date: new Date(r.created_at).toLocaleDateString(),
      terms: r.payment_terms, dueDate: r.validity ?? undefined,
      billTo: { name: c?.name ?? "—", kra_pin: c?.kra_pin, address: c?.address, phone: c?.phone },
      lines: [], // items fetched lazily — kept compact
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Issue quotations to customers. Approved quotes can be converted to Sales Orders.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Quotation</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New Quotation</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label>Customer</Label>
                <Select value={customer_id} onValueChange={setCust}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Valid until</Label><Input type="date" value={validity} onChange={(e) => setValidity(e.target.value)} /></div>
              <div className="col-span-3"><Label>Payment terms</Label><PaymentTermsSelect value={payment_terms} onChange={setPT} /></div>
            </div>
            <ItemsEditor items={items} setItems={setItems} products={products} />
            <div className="flex justify-end text-sm gap-6 pt-2">
              <span>Subtotal: <b>{fmt(t.subtotal)}</b></span>
              <span>VAT: <b>{fmt(t.vat)}</b></span>
              <span>Total: <b className="text-primary">{fmt(t.total)}</b></span>
            </div>
            <DialogFooter><Button onClick={save}>Save Quotation</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["Quote", "Customer", "Total", "Status", "Created", "Actions"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.quote_no}</TableCell>
            <TableCell>{customers.find((c) => c.id === r.customer_id)?.name ?? "—"}</TableCell>
            <TableCell>{fmt(r.total)}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
            <TableCell className="text-right space-x-1">
              {r.status !== "approved" && r.status !== "rejected" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setPinFor({ id: r.id, status: "approved" })}>Approve</Button>
                  <Button size="sm" variant="ghost" onClick={() => setPinFor({ id: r.id, status: "rejected" })}>Reject</Button>
                </>
              )}
              <DocActions table="quotations" docId={r.id} docLabel={r.quote_no} buildPrint={() => buildPrint(r)} onReverted={refresh} />
            </TableCell>
          </TableRow>
        ))}
      </DocTable>
      <PinApprovalDialog open={!!pinFor} onOpenChange={(o) => !o && setPinFor(null)}
        title="Authorise quotation status change"
        onApproved={async () => { if (pinFor) await setStatus(pinFor.id, pinFor.status); setPinFor(null); }} />
    </div>
  );
}

// ============ 3. Sales Orders ============
function SalesOrders() {
  const { rows, loading, refresh } = useList("sales_orders");
  const customers = useLookup("customers");
  const products = useLookup("products");
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clpos, setClpos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [customer_id, setCust] = useState("");
  const [quote_id, setQuote] = useState<string>("");
  const [customer_lpo_id, setClpo] = useState<string>("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const t = totalsFor(items);

  useEffect(() => {
    supabase.from("quotations").select("*").eq("status", "approved" as any).then(({ data }) => setQuotes(data ?? []));
    supabase.from("customer_lpos").select("*").then(({ data }) => setClpos(data ?? []));
  }, [open]);

  async function loadFromQuote(qid: string) {
    setQuote(qid);
    const q = quotes.find((x) => x.id === qid);
    if (q) setCust(q.customer_id);
    const { data } = await supabase.from("quotation_items").select("*").eq("quotation_id", qid);
    setItems((data ?? []).map((d) => ({ product_id: d.product_id, description: d.description ?? "", quantity: Number(d.quantity), unit_price: Number(d.unit_price) })));
  }

  async function save() {
    if (!customer_id) return toast.error("Customer required");
    if (items.some((i) => !i.description || i.quantity <= 0)) return toast.error("Items invalid");
    const so_no = await nextDocNo("SO");
    const clpo = clpos.find((c) => c.id === customer_lpo_id);
    const { data: so, error } = await supabase.from("sales_orders").insert({
      so_no, customer_id, quote_id: quote_id || null, customer_lpo_id: customer_lpo_id || null,
      customer_lpo_no: clpo?.customer_lpo_no ?? null, status: "pending",
      subtotal: t.subtotal, vat: t.vat, total: t.total,
    }).select("id").single();
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("so_items").insert(items.map((i) => ({ ...i, so_id: so.id })));
    if (e2) return toast.error(e2.message);
    toast.success(`Created ${so_no}`);
    setOpen(false); setItems([emptyItem()]); setCust(""); setQuote(""); setClpo(""); refresh();
  }

  async function setStatus(id: string, status: string) {
    await supabase.from("sales_orders").update({ status: status as any }).eq("id", id);
    await supabase.rpc("log_audit" as any, { _table: "sales_orders", _record_id: id, _action: status });
    refresh();
  }
  const [pinFor, setPinFor] = useState<{ id: string; status: string } | null>(null);

  function buildPrint(r: any): DocPrintData {
    const c = customers.find((x) => x.id === r.customer_id);
    return {
      docType: "SALES ORDER", docNo: r.so_no, date: new Date(r.created_at).toLocaleDateString(),
      reference: r.customer_lpo_no ? `CLPO: ${r.customer_lpo_no} → ${r.so_no}` : undefined,
      billTo: { name: c?.name ?? "—", kra_pin: c?.kra_pin, address: c?.address, phone: c?.phone },
      lines: [],
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Confirmed customer orders ready for fulfilment.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New SO</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New Sales Order</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>From quotation</Label>
                <Select value={quote_id} onValueChange={loadFromQuote}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{quotes.map((q) => <SelectItem key={q.id} value={q.id}>{q.quote_no}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Customer</Label>
                <Select value={customer_id} onValueChange={setCust}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Customer LPO</Label>
                <Select value={customer_lpo_id} onValueChange={setClpo}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>{clpos.map((c) => <SelectItem key={c.id} value={c.id}>{c.customer_lpo_no}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <ItemsEditor items={items} setItems={setItems} products={products} />
            <div className="flex justify-end text-sm gap-6 pt-2">
              <span>Subtotal: <b>{fmt(t.subtotal)}</b></span>
              <span>VAT: <b>{fmt(t.vat)}</b></span>
              <span>Total: <b className="text-primary">{fmt(t.total)}</b></span>
            </div>
            <DialogFooter><Button onClick={save}>Save SO</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["SO", "Customer", "CLPO #", "Total", "Status", "Created", "Actions"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.so_no}</TableCell>
            <TableCell>{customers.find((c) => c.id === r.customer_id)?.name ?? "—"}</TableCell>
            <TableCell className="font-mono text-xs">{r.customer_lpo_no || "—"}</TableCell>
            <TableCell>{fmt(r.total)}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
            <TableCell className="text-right space-x-1">
              {r.status !== "approved" && r.status !== "completed" && (
                <Button size="sm" variant="outline" onClick={() => setPinFor({ id: r.id, status: "approved" })}>Approve</Button>
              )}
              {r.status === "approved" && (
                <Button size="sm" variant="outline" onClick={() => setPinFor({ id: r.id, status: "completed" })}>Mark complete</Button>
              )}
              <DocActions table="sales_orders" docId={r.id} docLabel={r.so_no} buildPrint={() => buildPrint(r)} onReverted={refresh} />
            </TableCell>
          </TableRow>
        ))}
      </DocTable>
      <PinApprovalDialog open={!!pinFor} onOpenChange={(o) => !o && setPinFor(null)}
        title="Authorise sales order"
        onApproved={async () => { if (pinFor) await setStatus(pinFor.id, pinFor.status); setPinFor(null); }} />
    </div>
  );
}

// ============ 4. Picking Lists ============
function PickingLists() {
  const { rows, loading, refresh } = useList("picking_lists");
  const [sos, setSos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [so_id, setSo] = useState("");
  const [picker, setPicker] = useState("");

  useEffect(() => {
    supabase.from("sales_orders").select("*").in("status", ["approved", "pending"] as any).then(({ data }) => setSos(data ?? []));
  }, [open]);

  async function save() {
    if (!so_id) return toast.error("Sales Order required");
    const pl_no = await nextDocNo("PL");
    const { error } = await supabase.from("picking_lists").insert({ pl_no, so_id, picker, status: "pending" });
    if (error) return toast.error(error.message);
    toast.success(`Created ${pl_no}`); setOpen(false); setSo(""); setPicker(""); refresh();
  }
  async function complete(id: string) {
    await supabase.from("picking_lists").update({ status: "completed" as any }).eq("id", id); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Storekeeper pulls stock against an approved SO.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Picking List</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Picking List</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Sales Order</Label>
                <Select value={so_id} onValueChange={setSo}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{sos.map((s) => <SelectItem key={s.id} value={s.id}>{s.so_no}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Picker</Label><Input value={picker} onChange={(e) => setPicker(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["PL", "SO", "Picker", "Status", "Created", "Actions"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.pl_no}</TableCell>
            <TableCell className="font-mono text-xs">{r.so_id?.slice(0, 8)}</TableCell>
            <TableCell>{r.picker || "—"}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              {r.status !== "completed" && <Button size="sm" variant="outline" onClick={() => complete(r.id)}><Check className="h-3 w-3 mr-1" />Complete</Button>}
            </TableCell>
          </TableRow>
        ))}
      </DocTable>
    </div>
  );
}

// ============ 5. Packing Notes ============
function PackingNotes() {
  const { rows, loading, refresh } = useList("packing_notes");
  const [sos, setSos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [so_id, setSo] = useState("");
  const [cartons, setCartons] = useState(1);
  const [weight, setWeight] = useState<number | "">("");
  const [condition_check, setCond] = useState("OK");

  useEffect(() => { supabase.from("sales_orders").select("*").then(({ data }) => setSos(data ?? [])); }, [open]);

  async function save() {
    if (!so_id) return toast.error("SO required");
    const pn_no = await nextDocNo("PN");
    const { error } = await supabase.from("packing_notes").insert({
      pn_no, so_id, cartons, weight: weight === "" ? null : Number(weight), condition_check,
    });
    if (error) return toast.error(error.message);
    toast.success(`Created ${pn_no}`); setOpen(false); setSo(""); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Pack picked stock and record carton/weight info.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Packing Note</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Packing Note</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Sales Order</Label>
                <Select value={so_id} onValueChange={setSo}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{sos.map((s) => <SelectItem key={s.id} value={s.id}>{s.so_no}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Cartons</Label><Input type="number" value={cartons} onChange={(e) => setCartons(Number(e.target.value))} /></div>
              <div><Label>Weight (kg)</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))} /></div>
              <div className="col-span-2"><Label>Condition check</Label><Input value={condition_check} onChange={(e) => setCond(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["PN", "SO", "Cartons", "Weight", "Condition", "Created"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.pn_no}</TableCell>
            <TableCell className="font-mono text-xs">{r.so_id?.slice(0, 8)}</TableCell>
            <TableCell>{r.cartons}</TableCell>
            <TableCell>{r.weight ?? "—"}</TableCell>
            <TableCell>{r.condition_check}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </DocTable>
    </div>
  );
}

// ============ 6. Delivery Notes ============
function DeliveryNotes() {
  const { rows, loading, refresh } = useList("delivery_notes");
  const [sos, setSos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [so_id, setSo] = useState("");
  const [driver_name, setDriver] = useState("");
  const [vehicle_reg, setVeh] = useState("");
  const [delivery_address, setAddr] = useState("");

  useEffect(() => { supabase.from("sales_orders").select("*").then(({ data }) => setSos(data ?? [])); }, [open]);

  async function save() {
    if (!so_id) return toast.error("SO required");
    const dn_no = await nextDocNo("DN");
    const { error } = await supabase.from("delivery_notes").insert({
      dn_no, so_id, driver_name, vehicle_reg, delivery_address, signed: false,
    });
    if (error) return toast.error(error.message);
    toast.success(`Created ${dn_no}`); setOpen(false); setSo(""); refresh();
  }
  async function sign(id: string) {
    const sig = prompt("Customer name / signature:");
    if (!sig) return;
    const { error } = await supabase.from("delivery_notes").update({
      signed: true, signed_at: new Date().toISOString(), customer_signature: sig,
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Delivery signed"); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Issue Delivery Notes. <b>Invoice cannot be created until DN is signed.</b></p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Delivery Note</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Delivery Note</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Sales Order</Label>
                <Select value={so_id} onValueChange={setSo}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{sos.map((s) => <SelectItem key={s.id} value={s.id}>{s.so_no}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Driver</Label><Input value={driver_name} onChange={(e) => setDriver(e.target.value)} /></div>
              <div><Label>Vehicle reg.</Label><Input value={vehicle_reg} onChange={(e) => setVeh(e.target.value)} /></div>
              <div className="col-span-2"><Label>Delivery address</Label><Input value={delivery_address} onChange={(e) => setAddr(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Save</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["DN", "SO", "Driver", "Vehicle", "Signed", "Created", "Actions"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.dn_no}</TableCell>
            <TableCell className="font-mono text-xs">{r.so_id?.slice(0, 8)}</TableCell>
            <TableCell>{r.driver_name || "—"}</TableCell>
            <TableCell>{r.vehicle_reg || "—"}</TableCell>
            <TableCell><StatusBadge status={r.signed ? "completed" : "pending"} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
            <TableCell className="text-right">
              {!r.signed && <Button size="sm" variant="outline" onClick={() => sign(r.id)}>Capture signature</Button>}
            </TableCell>
          </TableRow>
        ))}
      </DocTable>
    </div>
  );
}

// ============ 7. Invoices ============
function Invoices() {
  const { rows, loading, refresh } = useList("invoices");
  const customers = useLookup("customers");
  const products = useLookup("products");
  const [signedDns, setSignedDns] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [dn_id, setDn] = useState("");
  const [so_id, setSo] = useState<string>("");
  const [customer_id, setCust] = useState("");
  const [is_tax_invoice, setTax] = useState(false);
  const [seller_kra_pin, setSPin] = useState("");
  const [buyer_kra_pin, setBPin] = useState("");
  const [customer_lpo_no, setClpoNo] = useState("");
  const [due_date, setDue] = useState("");
  const [items, setItems] = useState<LineItem[]>([emptyItem()]);
  const t = totalsFor(items);

  useEffect(() => {
    supabase.from("delivery_notes").select("*").eq("signed", true).then(({ data }) => setSignedDns(data ?? []));
    supabase.from("company_settings").select("kra_pin").eq("id", 1).single().then(({ data }) => setSPin(data?.kra_pin ?? ""));
  }, [open]);

  async function pickDn(dnId: string) {
    setDn(dnId);
    const dn = signedDns.find((d) => d.id === dnId);
    if (!dn) return;
    setSo(dn.so_id);
    const { data: so } = await supabase.from("sales_orders").select("*").eq("id", dn.so_id).single();
    if (so) {
      setCust(so.customer_id);
      setClpoNo(so.customer_lpo_no ?? "");
    }
    const { data: si } = await supabase.from("so_items").select("*").eq("so_id", dn.so_id);
    setItems((si ?? []).map((d) => ({ product_id: d.product_id, description: d.description ?? "", quantity: Number(d.quantity), unit_price: Number(d.unit_price) })));
  }

  async function save() {
    if (!dn_id) return toast.error("Signed Delivery Note required");
    if (!customer_id) return toast.error("Customer required");
    if (is_tax_invoice && (!seller_kra_pin || !buyer_kra_pin)) return toast.error("Tax invoice needs both KRA PINs");
    if (items.some((i) => !i.description || i.quantity <= 0)) return toast.error("Items invalid");
    const invoice_no = await nextDocNo("INV");
    const { data: inv, error } = await supabase.from("invoices").insert({
      invoice_no, customer_id, so_id: so_id || null, dn_id,
      is_tax_invoice, seller_kra_pin: is_tax_invoice ? seller_kra_pin : null,
      buyer_kra_pin: is_tax_invoice ? buyer_kra_pin : null,
      customer_lpo_no: customer_lpo_no || null,
      due_date: due_date || null, status: "pending",
      subtotal: t.subtotal, vat: t.vat, total: t.total, amount_paid: 0,
    }).select("id").single();
    if (error) return toast.error(error.message);
    const { error: e2 } = await supabase.from("invoice_items").insert(items.map((i) => ({ ...i, invoice_id: inv.id })));
    if (e2) return toast.error(e2.message);
    toast.success(`Issued ${invoice_no}`);
    setOpen(false); setDn(""); setSo(""); setCust(""); setItems([emptyItem()]); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Invoices must reference a signed Delivery Note. Tax invoices require both seller &amp; buyer KRA PINs.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Invoice</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
            {signedDns.length === 0 && <BlockBanner>No signed Delivery Notes available. Sign a DN first.</BlockBanner>}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label>Signed Delivery Note</Label>
                <Select value={dn_id} onValueChange={pickDn}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{signedDns.map((d) => <SelectItem key={d.id} value={d.id}>{d.dn_no}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Due date</Label><Input type="date" value={due_date} onChange={(e) => setDue(e.target.value)} /></div>
              <div><Label>Customer</Label>
                <Select value={customer_id} onValueChange={setCust}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Customer LPO #</Label><Input value={customer_lpo_no} onChange={(e) => setClpoNo(e.target.value)} /></div>
              <div className="flex items-end gap-2">
                <input id="taxinv" type="checkbox" checked={is_tax_invoice} onChange={(e) => setTax(e.target.checked)} />
                <Label htmlFor="taxinv">Tax invoice</Label>
              </div>
              {is_tax_invoice && (
                <>
                  <div><Label>Seller KRA PIN</Label><Input value={seller_kra_pin} onChange={(e) => setSPin(e.target.value)} /></div>
                  <div><Label>Buyer KRA PIN</Label><Input value={buyer_kra_pin} onChange={(e) => setBPin(e.target.value)} /></div>
                </>
              )}
            </div>
            <ItemsEditor items={items} setItems={setItems} products={products} />
            <div className="flex justify-end text-sm gap-6 pt-2">
              <span>Subtotal: <b>{fmt(t.subtotal)}</b></span>
              <span>VAT: <b>{fmt(t.vat)}</b></span>
              <span>Total: <b className="text-primary">{fmt(t.total)}</b></span>
            </div>
            <DialogFooter><Button onClick={save} disabled={!dn_id}>Issue Invoice</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["Invoice", "Customer", "Total", "Paid", "Status", "Due", "Created"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.invoice_no}{r.is_tax_invoice && <span className="ml-2 text-[10px] text-primary">TAX</span>}</TableCell>
            <TableCell>{customers.find((c) => c.id === r.customer_id)?.name ?? "—"}</TableCell>
            <TableCell>{fmt(r.total)}</TableCell>
            <TableCell>{fmt(r.amount_paid)}</TableCell>
            <TableCell><StatusBadge status={r.status} /></TableCell>
            <TableCell className="text-xs">{r.due_date ?? "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </DocTable>
    </div>
  );
}

// ============ 8. Receipts ============
function Receipts() {
  const { rows, loading, refresh } = useList("receipts");
  const [invs, setInvs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [invoice_id, setInv] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState("cash");
  const [mpesa_code, setMpesa] = useState("");

  useEffect(() => {
    supabase.from("invoices").select("*").neq("status", "paid" as any).then(({ data }) => setInvs(data ?? []));
  }, [open]);

  async function save() {
    if (!invoice_id || amount <= 0) return toast.error("Invoice & amount required");
    const inv = invs.find((i) => i.id === invoice_id);
    if (!inv) return;
    const receipt_no = await nextDocNo("RCT");
    const { error } = await supabase.from("receipts").insert({
      receipt_no, invoice_id, customer_id: inv.customer_id, amount, method,
      mpesa_code: method === "mpesa" ? mpesa_code : null,
    });
    if (error) return toast.error(error.message);
    const newPaid = Number(inv.amount_paid ?? 0) + amount;
    const newStatus = newPaid >= Number(inv.total) ? "paid" : "partial";
    await supabase.from("invoices").update({ amount_paid: newPaid, status: newStatus as any }).eq("id", invoice_id);
    toast.success(`Receipt ${receipt_no}`);
    setOpen(false); setInv(""); setAmount(0); setMpesa(""); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Record customer payments. Updates invoice paid amount automatically.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Receipt</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Receipt</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Invoice</Label>
                <Select value={invoice_id} onValueChange={setInv}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{invs.map((i) => <SelectItem key={i.id} value={i.id}>{i.invoice_no} — {fmt(Number(i.total) - Number(i.amount_paid ?? 0))} due</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (KES)</Label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
                <div><Label>Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank">Bank transfer</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {method === "mpesa" && <div><Label>M-Pesa Code</Label><Input value={mpesa_code} onChange={(e) => setMpesa(e.target.value)} /></div>}
            </div>
            <DialogFooter><Button onClick={save}>Save Receipt</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["Receipt", "Invoice", "Amount", "Method", "M-Pesa", "Created"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.receipt_no}</TableCell>
            <TableCell className="font-mono text-xs">{r.invoice_id?.slice(0, 8)}</TableCell>
            <TableCell>{fmt(r.amount)}</TableCell>
            <TableCell className="capitalize">{r.method}</TableCell>
            <TableCell className="font-mono text-xs">{r.mpesa_code || "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </DocTable>
    </div>
  );
}

// ============ 9. Credit Notes ============
function CreditNotes() {
  const { rows, loading, refresh } = useList("credit_notes");
  const [invs, setInvs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [invoice_id, setInv] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [reason, setReason] = useState("");

  useEffect(() => { supabase.from("invoices").select("*").then(({ data }) => setInvs(data ?? [])); }, [open]);

  async function save() {
    if (!invoice_id || amount <= 0) return toast.error("Invoice & amount required");
    const cn_no = await nextDocNo("CN");
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("credit_notes").insert({
      cn_no, invoice_id, amount, reason, approved_by: user?.id,
    });
    if (error) return toast.error(error.message);
    toast.success(`Credit Note ${cn_no}`);
    setOpen(false); setInv(""); setAmount(0); setReason(""); refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <p className="text-sm text-muted-foreground">Credit Notes must always reference an original invoice.</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />New Credit Note</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Credit Note</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Original Invoice</Label>
                <Select value={invoice_id} onValueChange={setInv}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{invs.map((i) => <SelectItem key={i.id} value={i.id}>{i.invoice_no} — {fmt(i.total)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Credit amount (KES)</Label><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
              <div><Label>Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            </div>
            <DialogFooter><Button onClick={save}>Issue Credit Note</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <DocTable loading={loading} cols={["CN", "Invoice", "Amount", "Reason", "Created"]}>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-mono">{r.cn_no}</TableCell>
            <TableCell className="font-mono text-xs">{r.invoice_id?.slice(0, 8)}</TableCell>
            <TableCell>{fmt(r.amount)}</TableCell>
            <TableCell className="text-muted-foreground">{r.reason || "—"}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </DocTable>
    </div>
  );
}

// ============ Shared table shell ============
function DocTable({ loading, cols, children }: { loading: boolean; cols: string[]; children: React.ReactNode }) {
  const empty = !loading && (Array.isArray(children) ? children.length === 0 : !children);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Records</CardTitle></CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>{cols.map((c) => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={cols.length}>Loading…</TableCell></TableRow>
                : empty ? <TableRow><TableCell colSpan={cols.length} className="text-muted-foreground">No records yet</TableCell></TableRow>
                : children}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
