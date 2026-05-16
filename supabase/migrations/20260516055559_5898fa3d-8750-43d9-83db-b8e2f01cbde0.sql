
-- STOCK REQUISITIONS
create table if not exists public.stock_requisitions (
  id uuid primary key default gen_random_uuid(),
  sr_no text not null,
  department text,
  reason text,
  urgency text default 'normal',
  status doc_status not null default 'draft',
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz default now()
);
alter table public.stock_requisitions enable row level security;
create policy sr_sel on public.stock_requisitions for select to authenticated using (true);
create policy sr_ins on public.stock_requisitions for insert to authenticated with check (true);
create policy sr_upd on public.stock_requisitions for update to authenticated using (true);
create policy sr_del on public.stock_requisitions for delete to authenticated using (has_role(auth.uid(),'admin'));

create table if not exists public.stock_requisition_items (
  id uuid primary key default gen_random_uuid(),
  sr_id uuid not null references public.stock_requisitions(id) on delete cascade,
  product_id uuid,
  description text not null,
  quantity numeric not null,
  unit text default 'pcs'
);
alter table public.stock_requisition_items enable row level security;
create policy sri_sel on public.stock_requisition_items for select to authenticated using (true);
create policy sri_ins on public.stock_requisition_items for insert to authenticated with check (true);
create policy sri_upd on public.stock_requisition_items for update to authenticated using (true);
create policy sri_del on public.stock_requisition_items for delete to authenticated using (has_role(auth.uid(),'admin'));

-- Seed doc counter
insert into public.doc_counters (doc_type, prefix, last_no) values ('stock_requisition','SR',0)
on conflict (doc_type) do nothing;

-- AUDIT LOG helper
create or replace function public.log_audit(
  _table text, _record_id uuid, _action text,
  _old jsonb default null, _new jsonb default null, _reason text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_log(table_name, record_id, action, old_value, new_value, reason, user_id)
  values (_table, _record_id, _action, _old, _new, _reason, auth.uid());
end; $$;

-- REVERT
create or replace function public.revert_document(
  _table text, _doc_id uuid, _reason text
) returns void
language plpgsql security definer set search_path = public as $$
declare _old jsonb;
begin
  if length(coalesce(_reason,'')) < 20 then
    raise exception 'Reason must be at least 20 characters';
  end if;
  execute format('select to_jsonb(t) from public.%I t where id = $1', _table)
    into _old using _doc_id;
  if _old is null then raise exception 'Document not found'; end if;
  execute format('update public.%I set status = ''cancelled'' where id = $1', _table)
    using _doc_id;
  perform public.log_audit(_table, _doc_id, 'revert', _old, null, _reason);
end; $$;
