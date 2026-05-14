import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, FileText, Inbox } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/reports")({ component: ReportsPage });

const PRIMARY = "var(--color-primary)";
const COLORS = ["var(--color-primary)", "var(--color-destructive)", "var(--color-warning)", "var(--color-info)", "var(--color-success)"];

function fmtKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0);
}
function toCsv(rows: any[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
function downloadCsv(name: string, rows: any[]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}
function downloadPdfPlaceholder(name: string) {
  // Lightweight printable export: open print window with page title
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<title>${name}</title><h1 style="font-family:sans-serif">${name}</h1><p>Use browser Save as PDF</p>`);
  w.print();
}

type Preset = "today" | "week" | "month" | "lastMonth" | "custom";
function presetRange(p: Preset, from?: string, to?: string): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  if (p === "today") return { start, end };
  if (p === "week") { start.setDate(start.getDate() - 7); return { start, end }; }
  if (p === "month") { start.setDate(1); return { start, end }; }
  if (p === "lastMonth") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start: s, end: e };
  }
  return {
    start: from ? new Date(from) : new Date(now.getFullYear(), 0, 1),
    end: to ? new Date(to + "T23:59:59") : end,
  };
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="text-center py-10 text-muted-foreground">
      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{msg}</p>
    </div>
  );
}

function RangeBar({ preset, setPreset, from, setFrom, to, setTo, exportName, exportRows }: any) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Select value={preset} onValueChange={setPreset}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="lastMonth">Last Month</SelectItem>
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>
      {preset === "custom" && (
        <>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
        </>
      )}
      <div className="ml-auto flex gap-2">
        <Button size="sm" variant="outline" onClick={() => downloadPdfPlaceholder(exportName)}>
          <FileText className="h-3 w-3 mr-1" /> Export PDF
        </Button>
        <Button size="sm" variant="outline" onClick={() => downloadCsv(exportName, exportRows)}>
          <Download className="h-3 w-3 mr-1" /> Export CSV
        </Button>
      </div>
    </div>
  );
}

function ReportsPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const range = useMemo(() => presetRange(preset, from, to), [preset, from, to]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground">Sales · Stock · Procurement · Finance — exportable to CSV / PDF</p>
      </div>
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="stock">Stock & Inventory</TabsTrigger>
          <TabsTrigger value="proc">Procurement</TabsTrigger>
          <TabsTrigger value="fin">Payments & Finance</TabsTrigger>
        </TabsList>
        <TabsContent value="sales"><SalesTab range={range} preset={preset} setPreset={setPreset} from={from} setFrom={setFrom} to={to} setTo={setTo} /></TabsContent>
        <TabsContent value="stock"><StockTab range={range} preset={preset} setPreset={setPreset} from={from} setFrom={setFrom} to={to} setTo={setTo} /></TabsContent>
        <TabsContent value="proc"><ProcTab range={range} preset={preset} setPreset={setPreset} from={from} setFrom={setFrom} to={to} setTo={setTo} /></TabsContent>
        <TabsContent value="fin"><FinTab range={range} preset={preset} setPreset={setPreset} from={from} setFrom={setFrom} to={to} setTo={setTo} /></TabsContent>
      </Tabs>
    </div>
  );
}

// -------- SALES TAB --------
function SalesTab({ range, ...rb }: any) {
  const [granularity, setGranularity] = useState<"day" | "week" | "month" | "year">("day");
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [s, it, cn, p] = await Promise.all([
        supabase.from("pos_sales").select("sale_no, total, subtotal, vat, discount, payment_method, status, created_at, cashier")
          .gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString()),
        supabase.from("pos_sale_items").select("description, line_total, quantity, product_id, sale_id"),
        supabase.from("credit_notes").select("cn_no, amount, reason, created_at, invoice_id"),
        supabase.from("products").select("id, name, category_id"),
      ]);
      setSales((s.data ?? []).filter((x: any) => x.status === "completed"));
      setItems(it.data ?? []);
      setCreditNotes(cn.data ?? []);
      setProducts(p.data ?? []);
    })();
  }, [range.start, range.end]);

  const overTime = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
      const d = new Date(s.created_at);
      let key = "";
      if (granularity === "day") key = d.toISOString().slice(0, 10);
      else if (granularity === "week") {
        const onejan = new Date(d.getFullYear(), 0, 1);
        const wk = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${wk}`;
      }
      else if (granularity === "month") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      else key = String(d.getFullYear());
      map[key] = (map[key] ?? 0) + Number(s.total ?? 0);
    });
    return Object.entries(map).sort().map(([k, v]) => ({ key: k, revenue: v }));
  }, [sales, granularity]);

  const byMethod = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => { const m = (s.payment_method || "cash").toUpperCase(); map[m] = (map[m] ?? 0) + Number(s.total ?? 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const byCategory = useMemo(() => {
    const prodMap = new Map(products.map((p) => [p.id, p.category_id ?? "Uncategorised"]));
    const saleSet = new Set(sales.map((s) => s.sale_no ? s.sale_no : ""));
    void saleSet;
    const map: Record<string, number> = {};
    items.forEach((it) => {
      const cat = (it.product_id && prodMap.get(it.product_id)) || "Uncategorised";
      map[String(cat)] = (map[String(cat)] ?? 0) + Number(it.line_total ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name: String(name).slice(0, 8), value })).slice(0, 6);
  }, [items, products]);

  const byCashier = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => { const c = (s.cashier ?? "—").slice(0, 8); map[c] = (map[c] ?? 0) + Number(s.total ?? 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales]);

  const totalDiscount = sales.reduce((a, s) => a + Number(s.discount ?? 0), 0);

  return (
    <Card>
      <CardContent className="pt-6">
        <RangeBar {...rb} preset={rb.preset} exportName="sales-report" exportRows={sales} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Revenue Over Time</CardTitle>
              <Select value={granularity} onValueChange={(v: any) => setGranularity(v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                {overTime.length === 0 ? <Empty msg="No sales in range" /> : (
                  <ResponsiveContainer>
                    <LineChart data={overTime}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="key" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: any) => fmtKES(Number(v))} />
                      <Line type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Payment Method Split</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                {byMethod.length === 0 ? <Empty msg="No payment data" /> : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byMethod} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                        {byMethod.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: any) => fmtKES(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Sales by Category</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                {byCategory.length === 0 ? <Empty msg="No category data" /> : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: any) => fmtKES(Number(v))} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Sales by Cashier</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[240px]">
                {byCashier.length === 0 ? <Empty msg="No cashier data" /> : (
                  <ResponsiveContainer>
                    <BarChart data={byCashier}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: any) => fmtKES(Number(v))} />
                      <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-sm">Discounts Given</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{fmtKES(totalDiscount)}</div>
            <div className="text-xs text-muted-foreground">Across {sales.length} transactions</div>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle className="text-sm">Returns & Credit Notes</CardTitle></CardHeader>
          <CardContent>
            {creditNotes.length === 0 ? <Empty msg="No credit notes" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Ref</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {creditNotes.slice(0, 25).map((c) => (
                    <TableRow key={c.cn_no} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{c.cn_no}</TableCell>
                      <TableCell className="text-xs">{c.reason ?? "—"}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(c.amount))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

// -------- STOCK TAB --------
function StockTab({ range, ...rb }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [deadDays, setDeadDays] = useState<30 | 60 | 90>(30);

  useEffect(() => {
    (async () => {
      const [p, m, it] = await Promise.all([
        supabase.from("products").select("id, name, sku, stock_qty, cost_price, selling_price"),
        supabase.from("stock_movements").select("product_id, qty_change, movement_type, created_at")
          .gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString()),
        supabase.from("pos_sale_items").select("product_id, quantity, line_total, sale_id"),
      ]);
      setProducts(p.data ?? []);
      setMovements(m.data ?? []);
      setItems(it.data ?? []);
    })();
  }, [range.start, range.end]);

  const totalCost = products.reduce((a, p) => a + Number(p.stock_qty) * Number(p.cost_price), 0);
  const totalSell = products.reduce((a, p) => a + Number(p.stock_qty) * Number(p.selling_price), 0);

  const movers = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => { if (it.product_id) map[it.product_id] = (map[it.product_id] ?? 0) + Number(it.quantity ?? 0); });
    const enriched = products.map((p) => ({ name: p.name, sku: p.sku, units: map[p.id] ?? 0 }));
    return enriched.sort((a, b) => b.units - a.units);
  }, [items, products]);

  const timeline = useMemo(() => {
    const map: Record<string, { in: number; out: number }> = {};
    movements.forEach((m) => {
      const k = new Date(m.created_at).toISOString().slice(0, 10);
      if (!map[k]) map[k] = { in: 0, out: 0 };
      const q = Number(m.qty_change);
      if (q >= 0) map[k].in += q; else map[k].out += -q;
    });
    return Object.entries(map).sort().map(([d, v]) => ({ date: d, ...v }));
  }, [movements]);

  const deadStock = useMemo(() => {
    const cutoff = Date.now() - deadDays * 24 * 3600 * 1000;
    const recent = new Set(movements.filter((m) => new Date(m.created_at).getTime() >= cutoff).map((m) => m.product_id));
    return products.filter((p) => !recent.has(p.id) && Number(p.stock_qty) > 0);
  }, [products, movements, deadDays]);

  return (
    <Card>
      <CardContent className="pt-6">
        <RangeBar {...rb} exportName="stock-report" exportRows={movers} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total Cost Value</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{fmtKES(totalCost)}</div></CardContent>
          </Card>
          <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total Selling Value</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold text-primary">{fmtKES(totalSell)}</div></CardContent>
          </Card>
        </div>

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">Stock In/Out Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[240px]">
              {timeline.length === 0 ? <Empty msg="No stock movement in range" /> : (
                <ResponsiveContainer>
                  <AreaChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                    <Area dataKey="in" stackId="1" stroke="var(--color-success)" fill="var(--color-success)" fillOpacity={0.4} />
                    <Area dataKey="out" stackId="1" stroke="var(--color-destructive)" fill="var(--color-destructive)" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">Fast Movers (top 25)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Units sold</TableHead></TableRow></TableHeader>
              <TableBody>
                {movers.slice(0, 25).map((m) => (
                  <TableRow key={m.sku} className="hover:bg-muted/40">
                    <TableCell className="text-xs">{m.name}</TableCell>
                    <TableCell className="font-mono text-xs">{m.sku}</TableCell>
                    <TableCell className="text-right">{m.units}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Dead Stock</CardTitle>
            <Select value={String(deadDays)} onValueChange={(v) => setDeadDays(Number(v) as any)}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {deadStock.length === 0 ? <Empty msg="No dead stock detected" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>SKU</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Cost Value</TableHead></TableRow></TableHeader>
                <TableBody>
                  {deadStock.slice(0, 25).map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell className="text-xs">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="text-right">{p.stock_qty}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(p.stock_qty) * Number(p.cost_price))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

// -------- PROCUREMENT TAB --------
function ProcTab({ range, ...rb }: any) {
  const [lpos, setLpos] = useState<any[]>([]);
  const [grns, setGrns] = useState<any[]>([]);
  const [sinvs, setSinvs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const [l, g, s, sup] = await Promise.all([
        supabase.from("lpos").select("lpo_no, supplier_id, total, status, created_at")
          .gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString()),
        supabase.from("grns").select("grn_no, lpo_id, status, created_at"),
        supabase.from("supplier_invoices").select("invoice_no, lpo_id, amount, match_status, created_at"),
        supabase.from("suppliers").select("id, name"),
      ]);
      setLpos(l.data ?? []); setGrns(g.data ?? []); setSinvs(s.data ?? []); setSuppliers(sup.data ?? []);
    })();
  }, [range.start, range.end]);

  const supMap = new Map(suppliers.map((s) => [s.id, s.name]));
  const filteredLpos = statusFilter === "all" ? lpos : lpos.filter((l) => l.status === statusFilter);

  const spend = useMemo(() => {
    const map: Record<string, number> = {};
    lpos.forEach((l) => { const n = supMap.get(l.supplier_id) ?? "—"; map[n] = (map[n] ?? 0) + Number(l.total ?? 0); });
    return Object.entries(map).map(([name, value]) => ({ name: String(name).slice(0, 14), value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [lpos, suppliers]);

  return (
    <Card>
      <CardContent className="pt-6">
        <RangeBar {...rb} exportName="procurement-report" exportRows={lpos} />

        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">LPO Register</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="approved">Open</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="completed">Closed</SelectItem>
                <SelectItem value="rejected">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {filteredLpos.length === 0 ? <Empty msg="No LPOs match" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>LPO</TableHead><TableHead>Supplier</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredLpos.slice(0, 25).map((l) => (
                    <TableRow key={l.lpo_no} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{l.lpo_no}</TableCell>
                      <TableCell className="text-xs">{supMap.get(l.supplier_id) ?? "—"}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(l.total))}</TableCell>
                      <TableCell className="text-xs uppercase">{l.status}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">GRN Register</CardTitle></CardHeader>
          <CardContent>
            {grns.length === 0 ? <Empty msg="No GRNs" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>GRN</TableHead><TableHead>LPO</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {grns.slice(0, 25).map((g) => (
                    <TableRow key={g.grn_no} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{g.grn_no}</TableCell>
                      <TableCell className="font-mono text-xs">{lpos.find((l) => l.lpo_no && (l as any).id === g.lpo_id)?.lpo_no ?? g.lpo_id?.slice(0, 8)}</TableCell>
                      <TableCell className="text-xs uppercase">{g.status}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">3-Way Match Status</CardTitle></CardHeader>
          <CardContent>
            {sinvs.length === 0 ? <Empty msg="No supplier invoices" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Match</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sinvs.slice(0, 25).map((s) => {
                    const cls = s.match_status === "matched" ? "text-success" : s.match_status === "disputed" ? "text-destructive" : "text-warning";
                    return (
                      <TableRow key={s.invoice_no} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{s.invoice_no}</TableCell>
                        <TableCell className="text-right">{fmtKES(Number(s.amount))}</TableCell>
                        <TableCell className={`text-xs uppercase ${cls}`}>{s.match_status}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Supplier Spend Analysis</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {spend.length === 0 ? <Empty msg="No supplier spend" /> : (
                <ResponsiveContainer>
                  <BarChart data={spend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v / 1000}k`} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: any) => fmtKES(Number(v))} />
                    <Bar dataKey="value" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

// -------- FINANCE TAB --------
function FinTab({ range, ...rb }: any) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [pvs, setPvs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [posSales, setPosSales] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [r, i, p, c, ps] = await Promise.all([
        supabase.from("receipts").select("receipt_no, amount, method, created_at, customer_id, mpesa_code")
          .gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString()),
        supabase.from("invoices").select("invoice_no, total, amount_paid, vat, status, due_date, customer_id, created_at"),
        supabase.from("payment_vouchers").select("pv_no, amount, status, created_at, supplier_invoice_id, method"),
        supabase.from("customers").select("id, name"),
        supabase.from("pos_sales").select("vat, created_at, status").gte("created_at", range.start.toISOString()).lte("created_at", range.end.toISOString()),
      ]);
      setReceipts(r.data ?? []); setInvoices(i.data ?? []); setPvs(p.data ?? []); setCustomers(c.data ?? []); setPosSales(ps.data ?? []);
    })();
  }, [range.start, range.end]);

  const cusMap = new Map(customers.map((c) => [c.id, c.name]));
  const totalReceipts = receipts.reduce((a, r) => a + Number(r.amount), 0);
  const ar = useMemo(() => {
    const open = invoices.filter((i) => i.status !== "paid");
    const map: Record<string, number> = {};
    open.forEach((i) => { const n = cusMap.get(i.customer_id) ?? "—"; map[n] = (map[n] ?? 0) + (Number(i.total) - Number(i.amount_paid ?? 0)); });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [invoices, customers]);

  const vatByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    [...invoices, ...posSales].forEach((x: any) => {
      const d = new Date(x.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[k] = (map[k] ?? 0) + Number(x.vat ?? 0);
    });
    return Object.entries(map).sort();
  }, [invoices, posSales]);

  return (
    <Card>
      <CardContent className="pt-6">
        <RangeBar {...rb} exportName="finance-report" exportRows={receipts} />

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">Payments Received — Total: {fmtKES(totalReceipts)}</CardTitle></CardHeader>
          <CardContent>
            {receipts.length === 0 ? <Empty msg="No receipts in range" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Customer</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {receipts.slice(0, 25).map((r) => (
                    <TableRow key={r.receipt_no} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{r.receipt_no}</TableCell>
                      <TableCell className="text-xs">{cusMap.get(r.customer_id) ?? "—"}</TableCell>
                      <TableCell className="text-xs uppercase">{r.method}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(r.amount))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">Outstanding AR by Customer</CardTitle></CardHeader>
          <CardContent>
            {ar.length === 0 ? <Empty msg="No outstanding AR" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ar.slice(0, 25).map(([n, v]) => (
                    <TableRow key={n} className="hover:bg-muted/40">
                      <TableCell className="text-xs">{n}</TableCell>
                      <TableCell className="text-right">{fmtKES(Number(v))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-sm">Supplier Payments (AP)</CardTitle></CardHeader>
          <CardContent>
            {pvs.length === 0 ? <Empty msg="No payment vouchers" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>PV</TableHead><TableHead>Method</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pvs.slice(0, 25).map((p) => (
                    <TableRow key={p.pv_no} className="hover:bg-muted/40">
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

        <Card>
          <CardHeader><CardTitle className="text-sm">VAT Summary (Output VAT — KRA filing reference)</CardTitle></CardHeader>
          <CardContent>
            {vatByMonth.length === 0 ? <Empty msg="No VAT data" /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">VAT Collected</TableHead></TableRow></TableHeader>
                <TableBody>
                  {vatByMonth.map(([m, v]) => (
                    <TableRow key={m}><TableCell className="font-mono text-xs">{m}</TableCell><TableCell className="text-right">{fmtKES(Number(v))}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
