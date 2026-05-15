import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export type DocLine = {
  description: string;
  quantity: number;
  unit?: string | null;
  unit_price: number;
  vat_rate?: number; // % e.g. 16
};

export type DocParty = {
  name: string;
  kra_pin?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type DocPrintData = {
  docType: string;            // "TAX INVOICE", "QUOTATION", "DELIVERY NOTE"…
  docNo: string;
  date?: string;
  dueDate?: string;
  terms?: string;
  billTo: DocParty;
  shipTo?: DocParty;
  lines: DocLine[];
  notes?: string;
  reference?: string;          // lineage chain "QT-001 → SO-001"
  signoff?: string;
};

type Company = {
  company_name: string; address?: string | null; phone?: string | null; email?: string | null;
  kra_pin?: string | null; logo_url?: string | null; vat_rate: number;
  bank_name?: string | null; bank_account?: string | null; bank_branch?: string | null; bank_swift?: string | null;
  mpesa_paybill?: string | null; mpesa_till?: string | null; mpesa_account?: string | null;
};

function fmt(n: number) { return n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export function PrintDialog({ open, onOpenChange, doc, children }: { open: boolean; onOpenChange: (o: boolean) => void; doc: DocPrintData; children?: ReactNode }) {
  const [co, setCo] = useState<Company | null>(null);
  useEffect(() => {
    if (!open) return;
    supabase.from("company_settings").select("*").eq("id", 1).single().then(({ data }) => setCo(data as any));
  }, [open]);

  const totals = (() => {
    let sub = 0, zero = 0, std = 0;
    for (const l of doc.lines) {
      const line = Number(l.quantity) * Number(l.unit_price);
      sub += line;
      const r = l.vat_rate ?? co?.vat_rate ?? 16;
      if (r === 0) zero += line; else std += line * (r / 100);
    }
    return { sub, zero, std, total: sub + std };
  })();

  function doPrint() { window.print(); }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-0">
        <div className="flex items-center justify-between px-4 py-2 border-b print:hidden">
          <div className="text-sm font-medium">Print preview · {doc.docType} {doc.docNo}</div>
          <div className="flex gap-2">
            {children}
            <Button size="sm" variant="outline" onClick={doPrint}><Download className="h-3 w-3 mr-1" />PDF</Button>
            <Button size="sm" onClick={doPrint}><Printer className="h-3 w-3 mr-1" />Print</Button>
          </div>
        </div>
        <div id="print-area" className="bg-white text-black p-8 text-[12px] leading-snug">
          {/* HEADER */}
          <div className="flex justify-between items-start border-b-2 border-black pb-3">
            <div className="flex gap-3">
              {co?.logo_url && <img src={co.logo_url} alt="logo" className="h-14 object-contain" />}
              <div>
                <div className="text-base font-bold">{co?.company_name ?? "Company"}</div>
                {co?.address && <div className="whitespace-pre-line">{co.address}</div>}
                <div>{[co?.phone, co?.email].filter(Boolean).join(" · ")}</div>
                {co?.kra_pin && <div>PIN: {co.kra_pin}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold uppercase tracking-wide">{doc.docType}</div>
              <div className="font-mono text-sm mt-1">No. {doc.docNo}</div>
              {doc.reference && <div className="text-[10px] text-gray-600 mt-1">{doc.reference}</div>}
            </div>
          </div>

          {/* META + BILL/SHIP */}
          <div className="grid grid-cols-3 gap-4 my-4">
            <div>
              <div className="text-[10px] uppercase font-semibold text-gray-600">Bill To</div>
              <div className="font-semibold">{doc.billTo.name}</div>
              {doc.billTo.address && <div className="whitespace-pre-line">{doc.billTo.address}</div>}
              {doc.billTo.kra_pin && <div>PIN: {doc.billTo.kra_pin}</div>}
              {doc.billTo.phone && <div>{doc.billTo.phone}</div>}
            </div>
            {doc.shipTo && (
              <div>
                <div className="text-[10px] uppercase font-semibold text-gray-600">Ship To</div>
                <div className="font-semibold">{doc.shipTo.name}</div>
                {doc.shipTo.address && <div className="whitespace-pre-line">{doc.shipTo.address}</div>}
              </div>
            )}
            <div className="text-right space-y-0.5">
              {doc.date && <div><span className="text-gray-600">Date: </span>{doc.date}</div>}
              {doc.dueDate && <div><span className="text-gray-600">Due: </span>{doc.dueDate}</div>}
              {doc.terms && <div><span className="text-gray-600">Terms: </span>{doc.terms}</div>}
            </div>
          </div>

          {/* LINES */}
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border px-2 py-1.5 w-8">#</th>
                <th className="border px-2 py-1.5">Item &amp; Description</th>
                <th className="border px-2 py-1.5 text-right w-16">Qty</th>
                <th className="border px-2 py-1.5 w-14">Unit</th>
                <th className="border px-2 py-1.5 text-right w-24">Rate</th>
                <th className="border px-2 py-1.5 text-right w-14">VAT</th>
                <th className="border px-2 py-1.5 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((l, i) => {
                const amt = Number(l.quantity) * Number(l.unit_price);
                return (
                  <tr key={i}>
                    <td className="border px-2 py-1">{i + 1}</td>
                    <td className="border px-2 py-1">{l.description}</td>
                    <td className="border px-2 py-1 text-right">{Number(l.quantity)}</td>
                    <td className="border px-2 py-1">{l.unit ?? "pcs"}</td>
                    <td className="border px-2 py-1 text-right">{fmt(Number(l.unit_price))}</td>
                    <td className="border px-2 py-1 text-right">{(l.vat_rate ?? co?.vat_rate ?? 16)}%</td>
                    <td className="border px-2 py-1 text-right">{fmt(amt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* TOTALS */}
          <div className="flex justify-end mt-3">
            <div className="w-72 text-sm">
              <div className="flex justify-between py-1"><span>Sub Total</span><span>{fmt(totals.sub)}</span></div>
              <div className="flex justify-between py-1"><span>Zero Rate (0%)</span><span>{fmt(totals.zero)}</span></div>
              <div className="flex justify-between py-1"><span>VAT (16%)</span><span>{fmt(totals.std)}</span></div>
              <div className="flex justify-between py-2 border-t-2 border-black font-bold text-base"><span>TOTAL (KES)</span><span>{fmt(totals.total)}</span></div>
            </div>
          </div>

          {doc.notes && (
            <div className="mt-4">
              <div className="text-[10px] uppercase font-semibold text-gray-600">Notes</div>
              <div className="whitespace-pre-line">{doc.notes}</div>
            </div>
          )}

          {/* PAYMENT DETAILS FOOTER */}
          <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-3 text-[11px]">
            <div>
              <div className="font-semibold mb-1">Bank Details</div>
              {co?.bank_name && <div>Bank: {co.bank_name}</div>}
              {co?.bank_branch && <div>Branch: {co.bank_branch}</div>}
              {co?.bank_account && <div>A/C: {co.bank_account}</div>}
              {co?.bank_swift && <div>SWIFT: {co.bank_swift}</div>}
            </div>
            <div>
              <div className="font-semibold mb-1">Mobile Money (M-Pesa)</div>
              {co?.mpesa_paybill && <div>Paybill: {co.mpesa_paybill}</div>}
              {co?.mpesa_till && <div>Till: {co.mpesa_till}</div>}
              {co?.mpesa_account && <div>Account: {co.mpesa_account}</div>}
            </div>
          </div>

          {doc.signoff && <div className="mt-6 text-[11px] text-gray-700">{doc.signoff}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* Print stylesheet helper — inject once */
export function PrintStyles() {
  return (
    <style>{`
      @media print {
        body * { visibility: hidden !important; }
        #print-area, #print-area * { visibility: visible !important; }
        #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        @page { size: A4; margin: 12mm; }
      }
    `}</style>
  );
}
