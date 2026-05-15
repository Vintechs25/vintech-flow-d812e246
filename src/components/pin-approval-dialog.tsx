import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PinApprovalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  description?: string;
  onApproved: () => Promise<void> | void;
}

/** Reusable PIN modal. Calls verify_my_pin RPC, then runs onApproved. */
export function PinApprovalDialog({ open, onOpenChange, title = "Enter Approval PIN", description, onApproved }: PinApprovalProps) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (pin.length < 4) return toast.error("Enter your 4-6 digit PIN");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("verify_my_pin", { _pin: pin });
      if (error) throw error;
      if (!data) return toast.error("Incorrect PIN");
      await onApproved();
      onOpenChange(false);
      setPin("");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{title}</DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        <div className="flex justify-center py-4">
          <InputOTP maxLength={6} value={pin} onChange={setPin}>
            <InputOTPGroup>
              {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>Authorize</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
