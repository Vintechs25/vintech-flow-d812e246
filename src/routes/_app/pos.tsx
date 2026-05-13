import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { nextDocNo } from "@/hooks/use-table";

export const Route = createFileRoute("/_app/pos")({ component: PosPage });

type Line = { product_id: string; description: string; quantity: number; unit_price: number };

function PosPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [method, setMethod] = useState("cash");
  const [mpesa, setMpesa] = useState("");
  const [kraPin, setKraPin] = useState("");
  const [cashReceived, setCashReceived] = useState(0);

  useEffect(() => {
    supabase.from("products").select("*").eq("is_active", true).then(({ data }) => setProducts(data ?? []));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => !q || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.barcode === search);
  }, [products, search]);

  function addProduct(p: any) {
    setCart((c) => {
      const existing = c.find((l) => l.product_id === p.id);
      if (existing) return c.map((l) => l === existing ? { ...l, quantity: l.quantity + 1 } : l);
      return [...c, { product_id: p.id, description: p.name, quantity: 1, unit_price: Number(p.selling_price) }];
    });
  }
  function setQty(i: number, q: number) {
    setCart((c) => c.map((l, idx) => idx === i ? { ...l, quantity: Math.max(1, q) } : l));
  }

  const subtotal = cart.reduce((a, l) => a + l.quantity * l.unit_price, 0);
  const isTax = !!kraPin.trim();
  const vat = isTax ? (subtotal - discount) * 0.16 / 1.16 : 0;
  const total = Math.max(0, subtotal - discount);
  const change = method === "cash" ? Math.max(0, cashReceived - total) : 0;

  async function checkout() {
    if (!cart.length) return toast.error("Cart is empty");
    if (method === "mpesa" && !mpesa.trim()) return toast.error("Enter Mpesa confirmation code");
    if (method === "cash" && cashReceived < total) return toast.error("Cash received is less than total");
    try {
      const sale_no = await nextDocNo("POS");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: sale, error } = await supabase.from("pos_sales").insert({
        sale_no, cashier: user?.id, buyer_kra_pin: kraPin || null, is_tax_invoice: isTax,
        subtotal, discount, vat, total, payment_method: method,
        mpesa_code: method === "mpesa" ? mpesa : null,
        cash_received: method === "cash" ? cashReceived : null,
        change_due: method === "cash" ? change : null, status: "completed",
      }).select("id").single();
      if (error) throw error;
      const { error: e2 } = await supabase.from("pos_sale_items").insert(cart.map((l) => ({
        sale_id: sale.id, product_id: l.product_id, description: l.description,
        quantity: l.quantity, unit_price: l.unit_price, line_total: l.quantity * l.unit_price,
      })));
      if (e2) throw e2;
      toast.success(`Receipt ${sale_no} issued`);
      setCart([]); setDiscount(0); setMpesa(""); setKraPin(""); setCashReceived(0);
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Point of Sale</h1>
        <p className="text-sm text-muted-foreground">Walk-in counter sales · stock deducts instantly</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Products</CardTitle></CardHeader>
          <CardContent>
            <Input placeholder="Search by name, SKU or scan barcode…" value={search} onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && filtered.length === 1) { addProduct(filtered[0]); setSearch(""); } }} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 max-h-[60vh] overflow-auto">
              {filtered.length === 0 && <div className="col-span-full text-sm text-muted-foreground p-3">No products. Add some in Settings.</div>}
              {filtered.map((p) => (
                <button key={p.id} onClick={() => addProduct(p)}
                  className="text-left rounded-md border border-border p-3 hover:bg-muted hover:border-primary/40 transition-colors min-h-[72px]">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.sku} · stock {p.stock_qty}</div>
                  <div className="text-sm text-primary mt-1">KES {Number(p.selling_price).toLocaleString()}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? <p className="text-sm text-muted-foreground">Cart is empty</p>
              : cart.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="flex-1 truncate">{l.description}</div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, l.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                  <span className="w-6 text-center">{l.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setQty(i, l.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                  <span className="w-20 text-right font-mono">{(l.quantity * l.unit_price).toFixed(0)}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setCart((c) => c.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span className="font-mono">{subtotal.toFixed(2)}</span></div>
              <div className="flex items-center gap-2">
                <Label className="text-xs flex-1">Discount</Label>
                <Input className="w-24 h-8" type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
              </div>
              {isTax && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>VAT (16%)</span><span className="font-mono">{vat.toFixed(2)}</span></div>}
              <div className="flex items-center justify-between font-semibold"><span>Total KES</span><span className="font-mono">{total.toFixed(2)}</span></div>
            </div>
            <div>
              <Label className="text-xs">Buyer KRA PIN (optional · issues tax invoice)</Label>
              <Input value={kraPin} onChange={(e) => setKraPin(e.target.value)} placeholder="P051..." />
            </div>
            <div>
              <Label className="text-xs">Payment method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">Mpesa</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {method === "mpesa" && <div><Label className="text-xs">Mpesa code</Label><Input value={mpesa} onChange={(e) => setMpesa(e.target.value)} /></div>}
            {method === "cash" && (
              <div>
                <Label className="text-xs">Cash received</Label>
                <Input type="number" value={cashReceived} onChange={(e) => setCashReceived(Number(e.target.value))} />
                {cashReceived > 0 && <div className="text-xs text-muted-foreground mt-1">Change: KES {change.toFixed(2)}</div>}
              </div>
            )}
            <Button className="w-full h-12" onClick={checkout} disabled={!cart.length}>Complete sale &amp; issue receipt</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
