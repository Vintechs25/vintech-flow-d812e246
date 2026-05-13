import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({ component: SettingsPage });

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Company, products, suppliers, customers, users</p>
      </div>
      <Tabs defaultValue="company">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="users">Users &amp; Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="company"><CompanyTab /></TabsContent>
        <TabsContent value="products"><CrudTab table="products" fields={[
          { k: "sku", l: "SKU" }, { k: "name", l: "Name" }, { k: "selling_price", l: "Selling price", t: "number" },
          { k: "cost_price", l: "Cost price", t: "number" }, { k: "stock_qty", l: "Stock", t: "number" },
          { k: "reorder_level", l: "Reorder", t: "number" },
        ]} /></TabsContent>
        <TabsContent value="suppliers"><CrudTab table="suppliers" fields={[
          { k: "name", l: "Name" }, { k: "kra_pin", l: "KRA PIN" }, { k: "phone", l: "Phone" }, { k: "email", l: "Email" },
        ]} /></TabsContent>
        <TabsContent value="customers"><CrudTab table="customers" fields={[
          { k: "name", l: "Name" }, { k: "kra_pin", l: "KRA PIN" }, { k: "phone", l: "Phone" }, { k: "email", l: "Email" },
        ]} /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function CompanyTab() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { supabase.from("company_settings").select("*").eq("id", 1).single().then(({ data }) => setS(data)); }, []);
  async function save() {
    const { error } = await supabase.from("company_settings").update({
      company_name: s.company_name, kra_pin: s.kra_pin, vat_rate: s.vat_rate,
      low_stock_threshold: s.low_stock_threshold, address: s.address, phone: s.phone, email: s.email,
    }).eq("id", 1);
    if (error) toast.error(error.message); else toast.success("Settings saved");
  }
  if (!s) return <p className="text-sm text-muted-foreground p-4">Loading…</p>;
  return (
    <Card><CardHeader><CardTitle className="text-base">Company</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {["company_name", "kra_pin", "vat_rate", "low_stock_threshold", "address", "phone", "email"].map((k) => (
          <div key={k}><Label className="capitalize">{k.replace(/_/g, " ")}</Label>
            <Input value={s[k] ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></div>
        ))}
        <div className="col-span-2"><Button onClick={save}>Save</Button></div>
      </CardContent>
    </Card>
  );
}

function CrudTab({ table, fields }: { table: string; fields: { k: string; l: string; t?: string }[] }) {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState<any>({});

  async function refresh() {
    const { data } = await (supabase as any).from(table).select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { refresh(); }, []); // eslint-disable-line

  async function add() {
    if (fields.some((f) => !form[f.k])) return toast.error("All fields required");
    const payload: any = {};
    fields.forEach((f) => { payload[f.k] = f.t === "number" ? Number(form[f.k]) : form[f.k]; });
    const { error } = await (supabase as any).from(table).insert(payload);
    if (error) return toast.error(error.message);
    setForm({}); refresh(); toast.success("Added");
  }

  return (
    <div className="space-y-4">
      <Card><CardHeader><CardTitle className="text-base capitalize">Add {table.slice(0, -1)}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {fields.map((f) => (
            <div key={f.k}><Label>{f.l}</Label>
              <Input type={f.t ?? "text"} value={form[f.k] ?? ""} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} /></div>
          ))}
          <div className="flex items-end"><Button onClick={add}><Plus className="h-3 w-3 mr-1" />Add</Button></div>
        </CardContent>
      </Card>
      <div className="rounded-md border">
        <Table>
          <TableHeader><TableRow>{fields.map((f) => <TableHead key={f.k}>{f.l}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={fields.length} className="text-muted-foreground">No records</TableCell></TableRow>
              : rows.map((r) => (
                <TableRow key={r.id}>{fields.map((f) => <TableCell key={f.k}>{String(r[f.k] ?? "—")}</TableCell>)}</TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function UsersTab() {
  const [rows, setRows] = useState<any[]>([]);

  async function refresh() {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    setRows((profiles ?? []).map((p) => ({ ...p, roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role) })));
  }
  useEffect(() => { refresh(); }, []);

  async function toggleRole(uid: string, role: string, has: boolean) {
    if (has) {
      await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role as any);
    } else {
      await supabase.from("user_roles").insert({ user_id: uid, role: role as any });
    }
    refresh();
  }

  return (
    <Card><CardHeader><CardTitle className="text-base">Users &amp; Roles</CardTitle></CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">Only Admins can change roles. New signups default to Cashier.</p>
        <div className="rounded-md border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Email</TableHead><TableHead>Name</TableHead>
              {["admin", "buyer", "storekeeper", "cashier"].map((r) => <TableHead key={r} className="capitalize">{r}</TableHead>)}
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>{u.full_name}</TableCell>
                  {["admin", "buyer", "storekeeper", "cashier"].map((r) => {
                    const has = u.roles.includes(r);
                    return <TableCell key={r}>
                      <input type="checkbox" checked={has} onChange={() => toggleRole(u.id, r, has)} />
                    </TableCell>;
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
