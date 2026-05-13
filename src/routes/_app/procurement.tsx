import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PurchaseRequisitions } from "./procurement/-pr";
import { Rfqs } from "./procurement/-rfq";
import { Lpos } from "./procurement/-lpo";
import { Grns } from "./procurement/-grn";
import { SupplierInvoices } from "./procurement/-sinv";
import { PaymentVouchers } from "./procurement/-pv";
import { StepIndicator } from "@/components/chain-ui";

export const Route = createFileRoute("/_app/procurement")({ component: ProcurementPage });

const STEPS = ["PR", "RFQ", "LPO", "GRN", "3-Way Match", "Payment Voucher", "Remittance"];

function ProcurementPage() {
  const [tab, setTab] = useState("pr");
  const stepIndex = ["pr", "rfq", "lpo", "grn", "sinv", "pv", "pv"].indexOf(tab);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Procurement (Stock In)</h1>
        <p className="text-sm text-muted-foreground">Document chain: PR → RFQ → LPO → GRN → 3-Way Match → Payment Voucher → Remittance</p>
      </div>
      <StepIndicator steps={STEPS} current={Math.max(0, stepIndex)} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="pr">Purchase Requisitions</TabsTrigger>
          <TabsTrigger value="rfq">RFQs &amp; Quotes</TabsTrigger>
          <TabsTrigger value="lpo">LPOs</TabsTrigger>
          <TabsTrigger value="grn">GRNs</TabsTrigger>
          <TabsTrigger value="sinv">Supplier Invoices</TabsTrigger>
          <TabsTrigger value="pv">Payment Vouchers</TabsTrigger>
        </TabsList>
        <TabsContent value="pr"><PurchaseRequisitions /></TabsContent>
        <TabsContent value="rfq"><Rfqs /></TabsContent>
        <TabsContent value="lpo"><Lpos /></TabsContent>
        <TabsContent value="grn"><Grns /></TabsContent>
        <TabsContent value="sinv"><SupplierInvoices /></TabsContent>
        <TabsContent value="pv"><PaymentVouchers /></TabsContent>
      </Tabs>
    </div>
  );
}
