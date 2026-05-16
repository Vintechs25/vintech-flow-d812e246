import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  table: string;
  docId: string;
  docLabel: string;
  onReverted?: () => void;
}

/** Revert any posted document — reason ≥ 20 chars + PIN. */
export function RevertDialog({ open, onOpenChange, table, docId, docLabel, onReverted }: Props) {
  const [reason, setReason] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (reason.trim().length < 20) return toast.error("Reason must be at least 20 characters");
    if (pin.length < 4) return toast.error("Enter your PIN");
    setBusy(true);
    try {
      const { data: ok, error: pinErr } = await supabase.rpc("verify_my_pin", { _pin: pin });
      if (pinErr) throw pinErr;
      if (!ok) return toast.error("Incorrect PIN");
      const { error } = await supabase.rpc("revert_document", { _table: table, _doc_id: docId, _reason: reason });
      if (error) throw error;
      toast.success("Document reverted");
      onReverted?.();
      onOpenChange(false);
      setReason(""); setPin("");
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" /> Revert {docLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium">Reason (min 20 characters)</label>
            <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            <div className="text-[10px] text-muted-foreground mt-1">{reason.length}/20</div>
          </div>
          <div>
            <label className="text-xs font-medium">Approval PIN</label>
            <div className="mt-1"><InputOTP maxLength={6} value={pin} onChange={setPin}>
              <InputOTPGroup>{[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
            </InputOTP></div>
          </div>
          <div className="rounded-md bg-destructive/10 text-destructive text-xs p-2">
            ⚠ This action cannot be undone. The original document will be preserved with status CANCELLED.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="destructive" onClick={submit} disabled={busy}>Confirm Revert</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
