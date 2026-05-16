import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Printer, Paperclip, History, Undo2 } from "lucide-react";
import { PrintDialog, type DocPrintData } from "@/components/print-dialog";
import { ProofUpload } from "@/components/proof-upload";
import { AuditTab } from "@/components/audit-tab";
import { RevertDialog } from "@/components/revert-dialog";

interface Props {
  table: string;
  docId: string;
  docLabel: string;
  buildPrint?: () => DocPrintData | null;
  onReverted?: () => void;
  canRevert?: boolean;
}

/** One-stop row actions: Print · Proof · Audit · Revert (PIN-gated). */
export function DocActions({ table, docId, docLabel, buildPrint, onReverted, canRevert = true }: Props) {
  const [print, setPrint] = useState<DocPrintData | null>(null);
  const [proof, setProof] = useState(false);
  const [audit, setAudit] = useState(false);
  const [revert, setRevert] = useState(false);
  return (
    <>
      {buildPrint && (
        <Button size="sm" variant="ghost" title="Print" onClick={() => { const d = buildPrint(); if (d) setPrint(d); }}>
          <Printer className="h-3 w-3" />
        </Button>
      )}
      <Button size="sm" variant="ghost" title="Proof / attachments" onClick={() => setProof(true)}>
        <Paperclip className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" title="Audit log" onClick={() => setAudit(true)}>
        <History className="h-3 w-3" />
      </Button>
      {canRevert && (
        <Button size="sm" variant="ghost" title="Revert (PIN)" onClick={() => setRevert(true)}>
          <Undo2 className="h-3 w-3" />
        </Button>
      )}

      {print && <PrintDialog open={!!print} onOpenChange={(o) => !o && setPrint(null)} doc={print} />}

      <Dialog open={proof} onOpenChange={setProof}>
        <DialogContent>
          <DialogHeader><DialogTitle>Proof / Attachments — {docLabel}</DialogTitle></DialogHeader>
          <ProofUpload docType={table} docId={docId} />
        </DialogContent>
      </Dialog>

      <Dialog open={audit} onOpenChange={setAudit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Audit Log — {docLabel}</DialogTitle></DialogHeader>
          <AuditTab table={table} docId={docId} />
        </DialogContent>
      </Dialog>

      <RevertDialog open={revert} onOpenChange={setRevert} table={table} docId={docId} docLabel={docLabel} onReverted={onReverted} />
    </>
  );
}
