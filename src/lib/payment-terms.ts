export const PAYMENT_TERMS = [
  "Due on Receipt",
  "Cash",
  "Credit (30 days)",
  "Credit (60 days)",
  "Cheque",
  "Mobile Money",
  "Bank Transfer",
] as const;
export type PaymentTerm = (typeof PAYMENT_TERMS)[number];
export const DEFAULT_PAYMENT_TERM: PaymentTerm = "Due on Receipt";
