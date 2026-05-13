import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepIndicator } from "@/components/chain-ui";

export const Route = createFileRoute("/_app/sales")({ component: SalesPage });

function SalesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sales (Stock Out)</h1>
        <p className="text-sm text-muted-foreground">Customer LPO → Quotation → SO → Picking → Packing → Delivery Note → Invoice → Receipt</p>
      </div>
      <StepIndicator
        steps={["Customer LPO", "Quotation", "Sales Order", "Picking", "Packing", "Delivery Note", "Invoice", "Receipt"]}
        current={0}
      />
      <Card>
        <CardHeader><CardTitle>Sales documents</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>The full B2B sales chain (S1–S10) is scaffolded in the database with all enforcement rules in place:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Invoice cannot be issued without a signed Delivery Note</li>
            <li>Tax invoice requires both seller and buyer KRA PINs</li>
            <li>Credit Notes must reference an original invoice</li>
            <li>B2B invoices must carry the Customer LPO reference</li>
          </ul>
          <p className="pt-2">Use the POS module for walk-in counter sales (Route A — skips S1–S6).</p>
        </CardContent>
      </Card>
    </div>
  );
}
