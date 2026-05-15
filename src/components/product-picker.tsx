import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductLite = {
  id: string; sku: string; name: string; unit: string | null;
  selling_price: number; cost_price: number; stock_qty: number;
};

interface Props {
  value?: ProductLite | null;
  onSelect: (p: ProductLite) => void;
  placeholder?: string;
}

export function ProductPicker({ value, onSelect, placeholder = "Search product…" }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ProductLite[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    const term = q.trim();
    let qb = supabase.from("products")
      .select("id,sku,name,unit,selling_price,cost_price,stock_qty")
      .eq("is_active", true).order("name").limit(25);
    if (term) qb = qb.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
    qb.then(({ data }) => { if (active) setItems(data ?? []); });
    return () => { active = false; };
  }, [q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className="truncate flex items-center gap-2">
            <Search className="h-3 w-3 opacity-60" />
            {value ? `${value.name} · ${value.sku}` : placeholder}
          </span>
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[360px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={q} onValueChange={setQ} placeholder="Search by name or SKU…" />
          <CommandList>
            <CommandEmpty>No products. Contact admin to add.</CommandEmpty>
            <CommandGroup>
              {items.map((p) => (
                <CommandItem key={p.id} value={p.id} onSelect={() => { onSelect(p); setOpen(false); }}>
                  <Check className={cn("mr-2 h-4 w-4", value?.id === p.id ? "opacity-100" : "opacity-0")} />
                  <div className="flex-1">
                    <div className="text-sm">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sku} · {p.unit ?? "pcs"} · stock {Number(p.stock_qty)}</div>
                  </div>
                  <div className="text-xs">KES {Number(p.selling_price).toLocaleString()}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
