
-- ===== Enums & helpers =====
create type public.app_role as enum ('admin','cashier','storekeeper','buyer');
create type public.doc_status as enum ('draft','pending','approved','rejected','blocked','partial','completed','paid','void');

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read" on public.profiles for select to authenticated using (true);
create policy "profiles self update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  insert into public.user_roles (user_id, role)
  values (new.id, 'cashier');
  return new;
end;
$$;

-- ===== Roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "roles read all auth" on public.user_roles for select to authenticated using (true);
create policy "roles admin manage" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Settings =====
create table public.company_settings (
  id int primary key default 1,
  company_name text not null default 'Vintech Ltd',
  kra_pin text,
  vat_rate numeric not null default 16,
  low_stock_threshold int not null default 10,
  payment_voucher_dual_auth_threshold numeric not null default 100000,
  currency text not null default 'KES',
  address text,
  phone text,
  email text,
  constraint single_row check (id = 1)
);
insert into public.company_settings (id) values (1);
alter table public.company_settings enable row level security;
create policy "settings read auth" on public.company_settings for select to authenticated using (true);
create policy "settings admin write" on public.company_settings for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- ===== Doc counters =====
create table public.doc_counters (
  doc_type text primary key,
  last_no bigint not null default 0,
  prefix text not null default ''
);
insert into public.doc_counters (doc_type, prefix) values
 ('PR','PR'),('RFQ','RFQ'),('LPO','LPO'),('GRN','GRN'),('SDN','SDN'),
 ('RTN','RTN'),('DN-S','DBN'),('SINV','SINV'),('PV','PV'),('RA','RA'),
 ('QT','QT'),('SO','SO'),('PL','PL'),('PN','PN'),('DN','DN'),
 ('INV','INV'),('RCT','RCT'),('CN','CN'),('POS','POS'),('CLPO','CLPO');
alter table public.doc_counters enable row level security;
create policy "counters read auth" on public.doc_counters for select to authenticated using (true);

create or replace function public.next_doc_no(_doc_type text)
returns text language plpgsql security definer set search_path = public as $$
declare _next bigint; _prefix text;
begin
  update public.doc_counters set last_no = last_no + 1
   where doc_type = _doc_type
   returning last_no, prefix into _next, _prefix;
  return _prefix || '-' || lpad(_next::text, 5, '0');
end; $$;

-- ===== Categories / Products / Parties =====
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  barcode text,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  unit text default 'pcs',
  cost_price numeric not null default 0,
  selling_price numeric not null default 0,
  stock_qty numeric not null default 0,
  reorder_level numeric not null default 10,
  is_active boolean not null default true,
  created_at timestamptz default now()
);
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text, kra_pin text, phone text, email text, address text,
  created_at timestamptz default now()
);
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kra_pin text, phone text, email text, address text,
  credit_limit numeric default 0,
  created_at timestamptz default now()
);

-- ===== Procurement: PR =====
create table public.purchase_requisitions (
  id uuid primary key default gen_random_uuid(),
  pr_no text unique not null,
  department text, budget_code text, urgency text default 'normal',
  reason text,
  status public.doc_status not null default 'draft',
  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id), approved_at timestamptz,
  created_at timestamptz default now()
);
create table public.pr_items (
  id uuid primary key default gen_random_uuid(),
  pr_id uuid not null references public.purchase_requisitions(id) on delete cascade,
  description text not null, quantity numeric not null, unit text default 'pcs'
);

-- ===== RFQ + Quotes =====
create table public.rfqs (
  id uuid primary key default gen_random_uuid(),
  rfq_no text unique not null,
  pr_id uuid references public.purchase_requisitions(id) on delete set null,
  required_delivery date, payment_terms text,
  status public.doc_status not null default 'draft',
  created_at timestamptz default now()
);
create table public.rfq_suppliers (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id)
);
create table public.supplier_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  total numeric not null default 0,
  notes text, selected boolean default false,
  created_at timestamptz default now()
);

-- ===== LPO =====
create table public.lpos (
  id uuid primary key default gen_random_uuid(),
  lpo_no text unique not null,
  pr_id uuid references public.purchase_requisitions(id),
  rfq_id uuid references public.rfqs(id),
  supplier_id uuid not null references public.suppliers(id),
  delivery_date date, payment_terms text,
  subtotal numeric default 0, vat numeric default 0, total numeric default 0,
  signatory text, kra_pin text,
  status public.doc_status not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create table public.lpo_items (
  id uuid primary key default gen_random_uuid(),
  lpo_id uuid not null references public.lpos(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric not null,
  unit_price numeric not null
);
create table public.lpo_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  lpo_id uuid not null references public.lpos(id) on delete cascade,
  accepted boolean default true,
  deviations text,
  confirmed_delivery date,
  created_at timestamptz default now()
);
create table public.supplier_delivery_notes (
  id uuid primary key default gen_random_uuid(),
  sdn_no text unique not null,
  lpo_id uuid not null references public.lpos(id),
  driver_name text, vehicle_reg text,
  received_at timestamptz default now()
);

-- ===== GRN =====
create table public.grns (
  id uuid primary key default gen_random_uuid(),
  grn_no text unique not null,
  lpo_id uuid not null references public.lpos(id),
  sdn_id uuid references public.supplier_delivery_notes(id),
  received_by uuid references auth.users(id),
  supervisor_signature text,
  status public.doc_status not null default 'draft', -- draft / completed / partial
  created_at timestamptz default now()
);
create table public.grn_items (
  id uuid primary key default gen_random_uuid(),
  grn_id uuid not null references public.grns(id) on delete cascade,
  lpo_item_id uuid references public.lpo_items(id),
  product_id uuid references public.products(id),
  lpo_qty numeric, received_qty numeric,
  condition text, batch text, expiry date
);
create table public.return_notes (
  id uuid primary key default gen_random_uuid(),
  rtn_no text unique not null,
  grn_id uuid references public.grns(id),
  reason text, created_at timestamptz default now()
);
create table public.debit_notes (
  id uuid primary key default gen_random_uuid(),
  dn_no text unique not null,
  return_id uuid references public.return_notes(id),
  supplier_id uuid references public.suppliers(id),
  amount numeric not null default 0,
  created_at timestamptz default now()
);

-- ===== Supplier Invoice + 3-way match =====
create table public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null,
  lpo_id uuid not null references public.lpos(id),
  grn_id uuid references public.grns(id),
  amount numeric not null default 0,
  match_status text not null default 'pending', -- pending/matched/mismatch
  notes text,
  created_at timestamptz default now()
);

-- ===== Payment Voucher + Remittance =====
create table public.payment_vouchers (
  id uuid primary key default gen_random_uuid(),
  pv_no text unique not null,
  supplier_invoice_id uuid not null references public.supplier_invoices(id),
  amount numeric not null,
  method text not null default 'bank', -- bank/cheque/mpesa
  status public.doc_status not null default 'draft',
  authorised_by uuid references auth.users(id),
  secondary_auth_by uuid references auth.users(id),
  paid_at timestamptz,
  reference text,
  created_at timestamptz default now()
);
create table public.remittance_advice (
  id uuid primary key default gen_random_uuid(),
  ra_no text unique not null,
  payment_voucher_id uuid not null references public.payment_vouchers(id),
  reference text,
  created_at timestamptz default now()
);

-- ===== Sales: Customer LPO, Quotations =====
create table public.customer_lpos (
  id uuid primary key default gen_random_uuid(),
  clpo_no text unique not null, -- internal ref
  customer_id uuid not null references public.customers(id),
  customer_lpo_no text not null,
  notes text, created_at timestamptz default now()
);
create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quote_no text unique not null,
  customer_id uuid not null references public.customers(id),
  validity date,
  subtotal numeric default 0, vat numeric default 0, discount numeric default 0, total numeric default 0,
  payment_terms text, status public.doc_status not null default 'draft',
  created_at timestamptz default now()
);
create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  product_id uuid references public.products(id),
  description text, quantity numeric not null, unit_price numeric not null
);

-- ===== Sales Order chain =====
create table public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  so_no text unique not null,
  customer_id uuid not null references public.customers(id),
  quote_id uuid references public.quotations(id),
  customer_lpo_id uuid references public.customer_lpos(id),
  customer_lpo_no text,
  subtotal numeric default 0, vat numeric default 0, total numeric default 0,
  status public.doc_status not null default 'draft',
  created_at timestamptz default now()
);
create table public.so_items (
  id uuid primary key default gen_random_uuid(),
  so_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid references public.products(id),
  description text, quantity numeric not null, unit_price numeric not null
);
create table public.picking_lists (
  id uuid primary key default gen_random_uuid(),
  pl_no text unique not null,
  so_id uuid not null references public.sales_orders(id),
  picker text, status public.doc_status not null default 'draft',
  created_at timestamptz default now()
);
create table public.packing_notes (
  id uuid primary key default gen_random_uuid(),
  pn_no text unique not null,
  so_id uuid not null references public.sales_orders(id),
  cartons int default 1, weight numeric, condition_check text,
  created_at timestamptz default now()
);
create table public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  dn_no text unique not null,
  so_id uuid not null references public.sales_orders(id),
  delivery_address text, driver_name text, vehicle_reg text,
  signed boolean not null default false,
  customer_signature text, signed_at timestamptz,
  created_at timestamptz default now()
);

-- ===== Sales Invoice / Receipt / Credit Note =====
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique not null,
  so_id uuid references public.sales_orders(id),
  dn_id uuid references public.delivery_notes(id),
  customer_id uuid not null references public.customers(id),
  customer_lpo_no text,
  is_tax_invoice boolean not null default false,
  seller_kra_pin text, buyer_kra_pin text, etr_ref text,
  subtotal numeric default 0, vat numeric default 0, total numeric default 0,
  amount_paid numeric default 0,
  status public.doc_status not null default 'pending',
  due_date date,
  created_at timestamptz default now()
);
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid references public.products(id),
  description text, quantity numeric not null, unit_price numeric not null
);
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text unique not null,
  invoice_id uuid references public.invoices(id),
  customer_id uuid references public.customers(id),
  amount numeric not null,
  method text not null default 'cash',
  mpesa_code text,
  created_at timestamptz default now()
);
create table public.credit_notes (
  id uuid primary key default gen_random_uuid(),
  cn_no text unique not null,
  invoice_id uuid not null references public.invoices(id),
  reason text, amount numeric not null default 0,
  approved_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ===== POS =====
create table public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  sale_no text unique not null,
  cashier uuid references auth.users(id),
  customer_id uuid references public.customers(id),
  buyer_kra_pin text,
  is_tax_invoice boolean not null default false,
  subtotal numeric default 0, discount numeric default 0, vat numeric default 0, total numeric default 0,
  payment_method text not null default 'cash',
  mpesa_code text, cash_received numeric, change_due numeric,
  status text not null default 'completed', -- completed/voided/refunded
  created_at timestamptz default now()
);
create table public.pos_sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.pos_sales(id) on delete cascade,
  product_id uuid references public.products(id),
  description text, quantity numeric not null, unit_price numeric not null,
  line_total numeric not null
);

-- ===== Stock movements / Audit =====
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  qty_change numeric not null, -- positive=in, negative=out
  movement_type text not null, -- grn/sale/pos/return/adjustment/credit_note
  ref_doc_type text, ref_doc_id uuid,
  user_id uuid references auth.users(id),
  notes text,
  created_at timestamptz default now()
);
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null, record_id uuid,
  action text not null, -- insert/update/delete/void
  old_value jsonb, new_value jsonb,
  reason text,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ===== RLS policies (authenticated users CRUD on operational tables; admin-only delete) =====
do $$
declare t text;
begin
  for t in select unnest(array[
    'categories','products','suppliers','customers',
    'purchase_requisitions','pr_items','rfqs','rfq_suppliers','supplier_quotes',
    'lpos','lpo_items','lpo_acknowledgements','supplier_delivery_notes',
    'grns','grn_items','return_notes','debit_notes',
    'supplier_invoices','payment_vouchers','remittance_advice',
    'customer_lpos','quotations','quotation_items',
    'sales_orders','so_items','picking_lists','packing_notes','delivery_notes',
    'invoices','invoice_items','receipts','credit_notes',
    'pos_sales','pos_sale_items','stock_movements','audit_log'
  ]) loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('create policy %I on public.%I for select to authenticated using (true);', t||'_sel', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (true);', t||'_ins', t);
    execute format('create policy %I on public.%I for update to authenticated using (true);', t||'_upd', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_role(auth.uid(),''admin''));', t||'_del', t);
  end loop;
end $$;

-- ===== Stock helpers =====
create or replace function public.adjust_stock(_product_id uuid, _qty_change numeric, _type text, _ref_doc_type text, _ref_doc_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.products set stock_qty = stock_qty + _qty_change where id = _product_id;
  insert into public.stock_movements (product_id, qty_change, movement_type, ref_doc_type, ref_doc_id, user_id)
  values (_product_id, _qty_change, _type, _ref_doc_type, _ref_doc_id, auth.uid());
end; $$;

-- Trigger: when GRN status set to completed, increase stock from grn_items
create or replace function public.grn_post_stock()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if (new.status = 'completed' and (old.status is distinct from 'completed')) then
    for r in select * from public.grn_items where grn_id = new.id loop
      if r.product_id is not null and coalesce(r.received_qty,0) > 0 then
        perform public.adjust_stock(r.product_id, r.received_qty, 'grn', 'grn', new.id);
      end if;
    end loop;
  end if;
  return new;
end; $$;
create trigger trg_grn_post_stock after update on public.grns
  for each row execute function public.grn_post_stock();

-- Trigger: POS sale insert deducts stock
create or replace function public.pos_sale_deduct()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.product_id is not null then
    perform public.adjust_stock(new.product_id, -new.quantity, 'pos', 'pos_sale', new.sale_id);
  end if;
  return new;
end; $$;
create trigger trg_pos_sale_deduct after insert on public.pos_sale_items
  for each row execute function public.pos_sale_deduct();

-- Indexes
create index on public.products (sku);
create index on public.stock_movements (product_id, created_at);
create index on public.invoices (customer_id, status);
create index on public.pos_sales (created_at);
create index on public.lpos (status);
