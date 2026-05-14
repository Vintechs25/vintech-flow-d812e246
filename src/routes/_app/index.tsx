import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import {
  TrendingUp, Receipt, AlertTriangle, FileWarning, ArrowUpRight, ArrowDownRight, Package, Plus, Inbox, ClipboardList as ClipboardListIcon,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

function fmtKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0);
}
function fmtTime(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-KE", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
}

function MethodBadge({ m }: { m?: string }) {
  const s = (m ?? "cash").toLowerCase();
  const cls =
    s === "mpesa" ? "bg-success/15 text-success border-success/30"
    : s === "bank" ? "bg-info/15 text-info border-info/30"
    : "bg-muted text-muted-foreground border-border";
  return <Badge variant="outline" className={cls}>{s.toUpperCase()}</Badge>;
}

function Empty({ icon: Icon, message, action }: { icon: any; message: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm mb-3">{message}</p>
      {action}
    </div>
  );
}

function KpiCard({
  icon: Icon, label, value, delta, deltaTone, sub,
}: { icon: any; label: string; value: string; delta?: string; deltaTone?: "up" | "down" | "warn"; sub?: React.ReactNode }) {
  const deltaCls =
    deltaTone === "up" ? "bg-success/15 text-success"
    : deltaTone === "down" ? "bg-destructive/15 text-destructive"
    : deltaTone === "warn" ? "bg-warning/15 text-warning"
    : "bg-muted text-muted-foreground";
  const DeltaIcon = deltaTone === "down" ? ArrowDownRight : ArrowUpRight;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</CardTitle>
        <div className="h-8 w-8 rounded-md grid place-items-center bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {delta && (
            <span className={`text-[11px] inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded ${deltaCls}`}>
              <DeltaIcon className="h-3 w-3" /> {delta}
            </span>
          )}
          {sub}
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [revenueToday, setRevenueToday] = useState(0);
  const [revenueYday, setRevenueYday] = useState(0);
  const [outstanding, setOutstanding] = useState({ total: 0, count: 0, overdue: 0 });
  const [lowStockCount, setLowStockCount] = useState(0);
  const [pending, setPending] = useState(0);
  const [monthDaily, setMonthDaily] = useState<{ day: string; revenue: number }[]>([]);
  const [topItems, setTopItems] = useState<{ name: string; revenue: number }[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [ageing, setAgeing] = useState({ current: 0, b30: 0, b60: 0, b90: 0 });
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
      const startYday = new Date(startToday); startYday.setDate(startYday.getDate() - 1);
      const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [posToday, posYday, posMonth, products, invs, prs, pvs, sales] = await Promise.all([
        supabase.from("pos_sales").select("total, status").gte("created_at", startToday.toISOString()),
        supabase.from("pos_sales").select("total, status").gte("created_at", startYday.toISOString()).lt("created_at", startToday.toISOString()),
        supabase.from("pos_sales").select("total, status, created_at").gte("created_at", startMonth.toISOString()),
        supabase.from("products").select("id, name, sku, stock_qty, reorder_level, category_id"),
        supabase.from("invoices").select("id, total, amount_paid, status, due_date, created_at"),
        supabase.from("purchase_requisitions").select("id, pr_no, status, created_at"),
        supabase.from("payment_vouchers").select("id, amount, status"),
        supabase.from("pos_sale_items").select("description, quantity, line_total, product_id, sale_id"),
      ]);

      setRevenueToday((posToday.data ?? []).filter((s: any) => s.status === "completed").reduce((a: number, b: any) => a + Number(b.total ?? 0), 0));
      setRevenueYday((posYday.data ?? []).filter((s: any) => s.status === "completed").reduce((a: number, b: any) => a + Number(b.total ?? 0), 0));

      // outstanding
      const open = (invs.data ?? []).filter((i: any) => i.status !== "paid");
      const totalOut = open.reduce((a: number, i: any) => a + (Number(i.total) - Number(i.amount_paid ?? 0)), 0);
      const overdueCount = open.filter((i: any) => i.due_date && new Date(i.due_date) < now).length;
      setOutstanding({ total: totalOut, count: open.length, overdue: overdueCount });

      // low stock
      const lows = (products.data ?? []).filter((p: any) => Number(p.stock_qty) <= Number(p.reorder_level));
      setLowStockCount(lows.length);

      // pending approvals = pending PRs + draft/pending PVs
      const pendCount = (prs.data ?? []).filter((p: any) => p.status === "pending" || p.status === "draft").length
        + (pvs.data ?? []).filter((p: any) => p.status === "pending" || p.status === "draft").length;
      setPending(pendCount);

      // monthly daily revenue
      const byDay: Record<string, number> = {};
      const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysIn; d++) byDay[String(d).padStart(2, "0")] = 0;
      (posMonth.data ?? []).filter((s: any) => s.status === "completed").forEach((s: any) => {
        const d = new Date(s.created_at).getDate();
        byDay[String(d).padStart(2, "0")] += Number(s.total ?? 0);
      });
      setMonthDaily(Object.entries(byDay).map(([day, revenue]) => ({ day, revenue })));

      // top items
      const prodMap = new Map((products.data ?? []).map((p: any) => [p.id, p.name]));
      const itemAgg: Record<string, { name: string; revenue: number }> = {};
      (sales.data ?? []).forEach((it: any) => {
        const name = (it.product_id && prodMap.get(it.product_id)) || it.description || "Unknown";
        if (!itemAgg[name]) itemAgg[name] = { name, revenue: 0 };
        itemAgg[name].revenue += Number(it.line_total ?? 0);
      });
      setTopItems(Object.values(itemAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 10));

      // recent transactions
      const recentTx = await supabase
        .from("pos_sales")
        .select("sale_no, total, payment_method, created_at, customer_id")
        .order("created_at", { ascending: false }).limit(10);
      setRecent(recentTx.data ?? []);

      // procurement pipeline: open PRs/LPOs
      const [prsOpen, lpos, grns] = await Promise.all([
        supabase.from("purchase_requisitions").select("id, pr_no, status, created_at").neq("status", "completed").order("created_at", { ascending: false }).limit(20),
        supabase.from("lpos").select("id, lpo_no, supplier_id, total, status, pr_id, created_at"),
        supabase.from("grns").select("lpo_id"),
      ]);
      const lpoByPr = new Map<string, any>();
      (lpos.data ?? []).forEach((l: any) => { if (l.pr_id) lpoByPr.set(l.pr_id, l); });
      const grnLpoSet = new Set((grns.data ?? []).map((g: any) => g.lpo_id));
      const supRes = await supabase.from("suppliers").select("id, name");
      const supMap = new Map((supRes.data ?? []).map((s: any) => [s.id, s.name]));
      const pipe = (prsOpen.data ?? []).slice(0, 8).map((pr: any) => {
        const lpo = lpoByPr.get(pr.id);
        let stage = "PR";
        if (pr.status === "approved") stage = "RFQ";
        if (lpo) stage = grnLpoSet.has(lpo.id) ? "GRN" : "LPO";
        return {
          pr_no: pr.pr_no,
          supplier: lpo ? supMap.get(lpo.supplier_id) ?? "—" : "—",
          value: lpo ? Number(lpo.total ?? 0) : 0,
          stage,
        };
      });
      setPipeline(pipe);

      // invoice ageing
      const ag = { current: 0, b30: 0, b60: 0, b90: 0 };
      open.forEach((i: any) => {
        const out = Number(i.total) - Number(i.amount_paid ?? 0);
        if (!i.due_date) { ag.current += out; return; }
        const days = Math.floor((now.getTime() - new Date(i.due_date).getTime()) / (24 * 3600 * 1000));
        if (days <= 0) ag.current += out;
        else if (days <= 30) ag.b30 += out;
        else if (days <= 60) ag.b60 += out;
        else ag.b90 += out;
      });
      setAgeing(ag);

      // low stock with supplier - approximate via last GRN supplier
      setLowStock(lows.slice(0, 10).map((p: any) => ({ ...p, supplier: "—", lastReceived: null })));
    })();
  }, []);

  const delta = useMemo(() => {
    if (!revenueYday) return revenueToday > 0 ? "+100%" : "0%";
    const d = ((revenueToday - revenueYday) / revenueYday) * 100;
    return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
  }, [revenueToday, revenueYday]);

  const ageingTotal = ageing.current + ageing.b30 + ageing.b60 + ageing.b90;
  const pct = (n: number) => (ageingTotal ? (n / ageingTotal) * 100 : 0);

  async function raisePr(productId: string, name: string) {
    const u = await supabase.auth.getUser();
    const counter = await supabase.rpc("next_doc_no" as any, { p_doc_type: "PR" });
    const pr_no = (counter.data as any) || `PR-${Date.now()}`;
    const { data: pr, error } = await supabase.from("purchase_requisitions")
      .insert({ pr_no, status: "draft", reason: `Auto: low stock — ${name}`, created_by: u.data.user?.id ?? null })
      .select().single();
    if (error || !pr) return;
    await supabase.from("pr_items").insert({ pr_id: pr.id, description: name, quantity: 10 });
    navigate({ to: "/procurement" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live business pulse · PR → RFQ → LPO → GRN → 3-Way Match → Payment</p>
      </div>

      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Receipt} label="Today's Revenue" value={fmtKES(revenueToday)}
          delta={`${delta} vs yesterday`} deltaTone={revenueToday >= revenueYday ? "up" : "down"}
        />
        <KpiCard
          icon={FileWarning} label="Outstanding Invoices" value={fmtKES(outstanding.total)}
          sub={
            <span className="text-[11px] text-muted-foreground">
              {outstanding.count} open ·{" "}
              {outstanding.overdue > 0 && <span className="text-destructive font-medium">{outstanding.overdue} overdue</span>}
            </span>
          }
        />
        <KpiCard
          icon={AlertTriangle} label="Stock Alerts" value={String(lowStockCount)}
          sub={<Link to="/stock" className="text-[11px] text-primary hover:underline">View stock →</Link>}
        />
        <KpiCard
          icon={TrendingUp} label="Pending Approvals" value={String(pending)}
          delta={pending > 0 ? "Needs action" : "All clear"} deltaTone={pending > 0 ? "warn" : "up"}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue This Month</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer>
                <BarChart data={monthDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="currentColor" />
                  <YAxis tick={{ fontSize: 10 }} stroke="currentColor" tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                    formatter={(v: any) => fmtKES(Number(v))}
                  />
                  <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Top 10 Selling Items</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {topItems.length === 0 ? (
                <Empty icon={Inbox} message="No sales recorded yet" />
              ) : (
                <ResponsiveContainer>
                  <BarChart data={topItems} layout="vertical" margin={{ left: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="currentColor" tickFormatter={(v) => `${v / 1000}k`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="currentColor" width={100} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                      formatter={(v: any) => fmtKES(Number(v))}
                    />
                    <Bar dataKey="revenue" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: 3 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <Empty icon={Receipt} message="No transactions today" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((r) => (
                      <TableRow key={r.sale_no} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{r.sale_no}</TableCell>
                        <TableCell className="text-right">{fmtKES(Number(r.total))}</TableCell>
                        <TableCell><MethodBadge m={r.payment_method} /></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtTime(r.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Procurement Pipeline</CardTitle></CardHeader>
          <CardContent>
            {pipeline.length === 0 ? (
              <Empty icon={ClipboardListIcon} message="No open requisitions"
                action={<Button size="sm" onClick={() => navigate({ to: "/procurement" })}>Open Procurement</Button>} />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PR No</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead>Stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pipeline.map((p) => (
                      <TableRow key={p.pr_no} className="hover:bg-muted/40">
                        <TableCell className="font-mono text-xs">{p.pr_no}</TableCell>
                        <TableCell className="text-xs">{p.supplier}</TableCell>
                        <TableCell className="text-right text-xs">{p.value ? fmtKES(p.value) : "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{p.stage}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Ageing</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Current", val: ageing.current, color: "var(--color-success)" },
              { label: "1–30 days", val: ageing.b30, color: "var(--color-warning)" },
              { label: "31–60 days", val: ageing.b60, color: "var(--color-info)" },
              { label: "60+ days", val: ageing.b90, color: "var(--color-destructive)" },
            ].map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium">{fmtKES(b.val)}</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div style={{ width: `${pct(b.val)}%`, background: b.color }} className="h-full transition-all" />
                </div>
              </div>
            ))}
            {ageingTotal === 0 && <Empty icon={FileWarning} message="No outstanding invoices" />}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Low Stock Watchlist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Low Stock Watchlist</span>
            <Link to="/stock" className="text-xs text-primary hover:underline">View all stock →</Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <Empty icon={Package} message="All items above reorder level" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Current</TableHead>
                    <TableHead className="text-right">Reorder</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40 group">
                      <TableCell className="text-sm">{p.name}</TableCell>
                      <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="text-right">
                        <StatusBadge status={Number(p.stock_qty) === 0 ? "blocked" : "pending"} />
                        <span className="ml-2 text-xs">{p.stock_qty}</span>
                      </TableCell>
                      <TableCell className="text-right text-xs">{p.reorder_level}</TableCell>
                      <TableCell className="text-xs">{p.supplier}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" className="opacity-70 group-hover:opacity-100" onClick={() => raisePr(p.id, p.name)}>
                          <Plus className="h-3 w-3 mr-1" /> Raise PR
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// local fallback icon import to keep tree-shaking simple
import { ClipboardList as ClipboardListIcon } from "lucide-react";
