import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/_app/email-log")({ component: EmailLogPage });

function EmailLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Email Log</h1>
        <p className="text-sm text-muted-foreground">Outbound transactional emails (LPOs, Invoices, Receipts)</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Sent Emails</CardTitle></CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-1">No emails sent yet</p>
            <p className="text-xs">Email sending will appear here once configured.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
