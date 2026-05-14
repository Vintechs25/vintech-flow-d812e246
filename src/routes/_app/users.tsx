import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

function UsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const [profiles, roles] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles.data ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role); roleMap.set(r.user_id, arr);
      });
      setRows((profiles.data ?? []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) ?? [] })));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users & Roles</h1>
        <p className="text-sm text-muted-foreground">Admin · Buyer · Storekeeper · Cashier — manage permissions in Settings</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center justify-between">All Users <Link to="/settings" className="text-xs text-primary hover:underline">Manage roles →</Link></CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No users yet</p>
              <Button asChild size="sm"><Link to="/settings">Open Settings</Link></Button>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40">
                    <TableCell className="text-sm">{r.full_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{r.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.roles.length === 0 ? <span className="text-xs text-muted-foreground">No role</span> :
                          r.roles.map((role: string) => (
                            <Badge key={role} variant="outline" className="bg-primary/15 text-primary border-primary/30 uppercase text-[10px]">{role}</Badge>
                          ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
void ShieldCheck;
