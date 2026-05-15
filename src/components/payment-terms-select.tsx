import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PAYMENT_TERMS, DEFAULT_PAYMENT_TERM } from "@/lib/payment-terms";

export function PaymentTermsSelect({ value, onChange }: { value?: string | null; onChange: (v: string) => void }) {
  return (
    <Select value={value ?? DEFAULT_PAYMENT_TERM} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select terms" /></SelectTrigger>
      <SelectContent>
        {PAYMENT_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
