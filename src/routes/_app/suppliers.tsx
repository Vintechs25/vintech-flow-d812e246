import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inbox, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/suppliers")({ component: SuppliersPage });

function SuppliersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { supabase.from("suppliers").select("*").order("name").then(({ data }) => setRows(data ?? [])); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <p className="text-sm text-muted-foreground">Vendor master · KRA PIN, contact, address</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center justify-between">All Suppliers <Link to="/settings" className="text-xs text-primary hover:underline">Manage in Settings →</Link></CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No suppliers yet</p>
              <Button asChild size="sm"><Link to="/settings">Add Supplier</Link></Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Phone</TableHead><TableHead>Email</TableHead><TableHead>KRA PIN</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/40">
                      <TableCell className="text-sm">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.contact_person ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.phone ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.email ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.kra_pin ?? "—"}</TableCell>
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
void Truck;
