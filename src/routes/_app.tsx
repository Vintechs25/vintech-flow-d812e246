import { createFileRoute, Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Truck, BarChart3, Settings, LogOut, Boxes, Menu,
  Receipt, Wallet, Package, ArrowLeftRight, Users, Mail, ShieldCheck, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app")({ component: AppLayout });

type Item = { to: string; label: string; icon: any; exact?: boolean };
const SECTIONS: { label: string; items: Item[] }[] = [
  { label: "Overview", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  ]},
  { label: "Operations", items: [
    { to: "/procurement", label: "Procurement", icon: ClipboardList },
    { to: "/sales", label: "Sales", icon: Truck },
    { to: "/pos", label: "POS", icon: ShoppingCart },
  ]},
  { label: "Finance", items: [
    { to: "/invoices", label: "Invoices", icon: Receipt },
    { to: "/payments", label: "Payments", icon: Wallet },
  ]},
  { label: "Inventory", items: [
    { to: "/stock", label: "Stock Levels", icon: Package },
    { to: "/stock-movement", label: "Stock Movement", icon: ArrowLeftRight },
    { to: "/stock-requisitions", label: "Stock Requisitions", icon: ClipboardList },
    { to: "/suppliers", label: "Suppliers", icon: Truck },
    { to: "/items", label: "Items & Catalogue", icon: Boxes },
  ]},
  { label: "Analytics", items: [
    { to: "/reports", label: "Reports", icon: BarChart3 },
    { to: "/email-log", label: "Email Log", icon: Mail },
  ]},
  { label: "System", items: [
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/users", label: "Users & Roles", icon: ShieldCheck },
  ]},
];

function AppLayout() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    if (typeof window !== "undefined") navigate({ to: "/login" });
    return null;
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? path === to : path === to || path.startsWith(to + "/");

  const initials = (user.email ?? "?").split("@")[0].slice(0, 2).toUpperCase();
  const sidebarWidth = collapsed ? "w-[64px]" : "w-[220px]";

  return (
    <div className="min-h-screen flex w-full bg-background">
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-40 bg-sidebar border-r border-sidebar-border flex flex-col transition-all",
        sidebarWidth,
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="h-16 flex items-center justify-between gap-2 px-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-md bg-primary text-primary-foreground grid place-items-center">
              <Boxes className="h-4 w-4" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="text-sm font-semibold text-sidebar-foreground truncate">Vintech ERP</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Kenyan Edition</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:grid place-items-center h-7 w-7 rounded hover:bg-sidebar-accent text-muted-foreground"
            aria-label="Collapse sidebar"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {SECTIONS.map((sec) => (
            <div key={sec.label} className="mb-3">
              {!collapsed && (
                <div className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {sec.label}
                </div>
              )}
              <div className="px-2 space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to, item.exact);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors border-l-2",
                        active
                          ? "bg-primary/10 text-primary border-primary"
                          : "text-sidebar-foreground border-transparent hover:bg-sidebar-accent",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          {!collapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-semibold">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-sidebar-foreground truncate">{user.email}</div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(roles.length ? roles : ["user"]).map((r) => (
                      <span key={r} className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="w-full justify-start">
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 text-primary grid place-items-center text-xs font-semibold">
                {initials}
              </div>
              <button onClick={logout} className="h-8 w-8 grid place-items-center rounded hover:bg-sidebar-accent text-muted-foreground" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/40 backdrop-blur">
          <button
            className="lg:hidden h-9 w-9 grid place-items-center rounded-md hover:bg-muted"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm text-muted-foreground">
            {SECTIONS.flatMap((s) => s.items).find((n) => isActive(n.to, n.exact))?.label ?? "Vintech ERP"}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
