import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Receipt, AlertTriangle, Truck, FileWarning, Percent } from "lucide-react";

export const Route = createFileRoute("/_app/")({ component: Dashboard });

function fmtKES(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n || 0);
}

type Kpi = {
  todayRevenue: number;
  todayTxns: number;
  lowStock: number;
  pendingDeliveries: number;
  overdueInvoices: number;
  grossMargin: number;
};

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</CardTitle>
        <div className={"h-8 w-8 rounded-md grid place-items-center bg-primary/15 text-primary " + (accent ?? "")}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const [k, setK] = useState<Kpi | null>(null);

  useEffect(() => {
    (async () => {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const iso = startOfDay.toISOString();
      const thirtyAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

      const [pos, products, deliveries, overdue, invoices] = await Promise.all([
        supabase.from("pos_sales").select("total, status, subtotal").gte("created_at", iso),
        supabase.from("products").select("id, stock_qty, reorder_level, cost_price, selling_price"),
        supabase.from("delivery_notes").select("id, signed").eq("signed", false),
        supabase.from("invoices").select("id, total, amount_paid, status, created_at").lt("created_at", thirtyAgo).neq("status", "paid"),
        supabase.from("pos_sales").select("subtotal").gte("created_at", iso),
      ]);

      const todayRevenue = (pos.data ?? []).filter((s) => s.status === "completed").reduce((a, b) => a + Number(b.total ?? 0), 0);
      const todayTxns = (pos.data ?? []).filter((s) => s.status === "completed").length;
      const lowStock = (products.data ?? []).filter((p) => Number(p.stock_qty) <= Number(p.reorder_level)).length;
      const pendingDeliveries = (deliveries.data ?? []).length;
      const overdueInvoices = (overdue.data ?? []).reduce((a, b) => a + (Number(b.total) - Number(b.amount_paid ?? 0)), 0);

      // gross margin estimate = (selling - cost) / selling avg from products with stock
      const margin = (() => {
        const list = (products.data ?? []).filter((p) => Number(p.selling_price) > 0);
        if (!list.length) return 0;
        const m = list.reduce((a, p) => a + (Number(p.selling_price) - Number(p.cost_price)) / Number(p.selling_price), 0) / list.length;
        return m * 100;
      })();

      setK({ todayRevenue, todayTxns, lowStock, pendingDeliveries, overdueInvoices, grossMargin: margin });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live business pulse</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat icon={Receipt} label="Today's Revenue" value={fmtKES(k?.todayRevenue ?? 0)} />
        <Stat icon={TrendingUp} label="Today's Transactions" value={String(k?.todayTxns ?? 0)} />
        <Stat icon={AlertTriangle} label="Low Stock Alerts" value={String(k?.lowStock ?? 0)} />
        <Stat icon={Truck} label="Pending Deliveries" value={String(k?.pendingDeliveries ?? 0)} />
        <Stat icon={FileWarning} label="Outstanding Invoices > 30d" value={fmtKES(k?.overdueInvoices ?? 0)} />
        <Stat icon={Percent} label="Gross Margin Estimate" value={`${(k?.grossMargin ?? 0).toFixed(1)}%`} />
      </div>

      <Card>
        <CardHeader><CardTitle>Welcome to Vintech ERP</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Use the sidebar to navigate Procurement, Sales, POS, Reports and Settings.</p>
          <p>The system enforces full document chains: PR → RFQ → LPO → GRN → Payment, and Customer LPO → Quote → SO → Delivery Note → Invoice → Receipt.</p>
        </CardContent>
      </Card>
    </div>
  );
}
