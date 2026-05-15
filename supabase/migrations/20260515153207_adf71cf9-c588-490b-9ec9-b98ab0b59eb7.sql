
-- pgcrypto for PIN hashing
create extension if not exists pgcrypto;

-- 1. Profiles: PIN
alter table public.profiles
  add column if not exists approval_pin_hash text,
  add column if not exists pin_attempts int not null default 0,
  add column if not exists pin_locked_until timestamptz;

-- 2. Company settings: branding + payment details
alter table public.company_settings
  add column if not exists logo_url text,
  add column if not exists bank_name text,
  add column if not exists bank_account text,
  add column if not exists bank_branch text,
  add column if not exists bank_swift text,
  add column if not exists mpesa_paybill text,
  add column if not exists mpesa_till text,
  add column if not exists mpesa_account text;

-- 3. Document attachments (proof uploads)
create table if not exists public.document_attachments (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null,
  doc_id uuid not null,
  label text,
  file_path text not null,
  mime_type text,
  uploaded_by uuid,
  created_at timestamptz not null default now()
);
alter table public.document_attachments enable row level security;
create policy "att_sel" on public.document_attachments for select to authenticated using (true);
create policy "att_ins" on public.document_attachments for insert to authenticated with check (true);
create policy "att_del" on public.document_attachments for delete to authenticated using (public.has_role(auth.uid(),'admin') or uploaded_by = auth.uid());
create index if not exists idx_doc_att on public.document_attachments(doc_type, doc_id);

-- 4. Correction requests
create table if not exists public.correction_requests (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null,
  doc_id uuid not null,
  reason text not null,
  requested_by uuid,
  approved_by uuid,
  status text not null default 'pending', -- pending, approved, rejected
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
alter table public.correction_requests enable row level security;
create policy "cr_sel" on public.correction_requests for select to authenticated using (true);
create policy "cr_ins" on public.correction_requests for insert to authenticated with check (true);
create policy "cr_upd" on public.correction_requests for update to authenticated using (true);

-- 5. PIN RPCs
create or replace function public.set_my_pin(_pin text)
returns void language plpgsql security definer set search_path=public as $$
begin
  if _pin !~ '^[0-9]{4,6}$' then raise exception 'PIN must be 4-6 digits'; end if;
  update public.profiles
    set approval_pin_hash = crypt(_pin, gen_salt('bf')),
        pin_attempts = 0, pin_locked_until = null
    where id = auth.uid();
end; $$;

create or replace function public.verify_my_pin(_pin text)
returns boolean language plpgsql security definer set search_path=public as $$
declare _hash text; _locked timestamptz; _att int;
begin
  select approval_pin_hash, pin_locked_until, pin_attempts
    into _hash, _locked, _att
    from public.profiles where id = auth.uid();
  if _hash is null then raise exception 'No PIN set. Set one in your profile.'; end if;
  if _locked is not null and _locked > now() then raise exception 'PIN locked until %', _locked; end if;
  if crypt(_pin, _hash) = _hash then
    update public.profiles set pin_attempts = 0, pin_locked_until = null where id = auth.uid();
    return true;
  else
    update public.profiles
      set pin_attempts = coalesce(pin_attempts,0) + 1,
          pin_locked_until = case when coalesce(pin_attempts,0) + 1 >= 3 then now() + interval '10 minutes' else null end
      where id = auth.uid();
    return false;
  end if;
end; $$;

-- 6. Storage bucket for attachments
insert into storage.buckets (id, name, public)
values ('attachments','attachments', true)
on conflict (id) do nothing;

create policy "att_storage_read" on storage.objects for select using (bucket_id = 'attachments');
create policy "att_storage_ins" on storage.objects for insert to authenticated with check (bucket_id = 'attachments');
create policy "att_storage_del" on storage.objects for delete to authenticated using (bucket_id = 'attachments');
