-- Facturation de la commission Escale.
--
-- Escale est assujettie à la TVA : chaque commission prélevée sur un hôte
-- doit donner lieu à une facture faisant apparaître la ventilation
-- hors taxes / TVA / toutes taxes comprises.
--
-- La facture porte sur la commission TOTALE supportée par l'hôte, soit
-- platform_fee + partner_fee : la rétrocommission éventuellement reversée à
-- une conciergerie est une répartition interne à Escale, sans effet sur ce
-- que l'hôte supporte (voir CGU, article 12).

create table if not exists public.invoice_counters (
  year        integer primary key,
  last_number integer not null default 0
);

comment on table public.invoice_counters is
  'Compteur de numérotation des factures, un rang par année. Le verrou de rang '
  'obtenu par allouer_numero_facture() garantit une séquence continue.';

create table if not exists public.commission_invoices (
  id             uuid primary key default gen_random_uuid(),
  payment_id     uuid not null unique references public.payments(id) on delete restrict,
  host_id        uuid not null references public.profiles(id),
  invoice_number text not null unique,
  issued_at      timestamptz not null default now(),

  -- Ventilation, en centimes. amount_ht + vat_amount = amount_ttc, toujours.
  amount_ttc     integer not null,
  amount_ht      integer not null,
  vat_amount     integer not null,
  vat_rate       numeric(5,4) not null,

  -- Répartition interne, conservée à titre de traçabilité comptable.
  platform_fee   integer not null,
  partner_fee    integer not null default 0,

  currency       text not null default 'eur',
  created_at     timestamptz not null default now(),

  constraint ventilation_coherente check (amount_ht + vat_amount = amount_ttc),
  constraint montants_positifs check (amount_ttc >= 0 and amount_ht >= 0 and vat_amount >= 0)
);

comment on table public.commission_invoices is
  'Factures de commission émises par Escale à ses hôtes. Une facture au plus '
  'par paiement (contrainte d''unicité sur payment_id), émise au moment du '
  'reversement des fonds à l''hôte.';

create index if not exists idx_commission_invoices_host
  on public.commission_invoices (host_id, issued_at desc);

-- Allocation atomique d'un numéro. L'upsert prend un verrou sur le rang de
-- l'année : deux appels concurrents sont sérialisés, aucun numéro n'est
-- attribué deux fois ni sauté.
create or replace function public.allouer_numero_facture(p_year integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_num integer;
begin
  insert into public.invoice_counters (year, last_number)
  values (p_year, 1)
  on conflict (year)
    do update set last_number = invoice_counters.last_number + 1
  returning last_number into v_num;

  return 'ESC-' || p_year::text || '-' || lpad(v_num::text, 5, '0');
end;
$$;

-- Émet la facture d'un paiement, ou renvoie celle qui existe déjà.
--
-- L'idempotence est indispensable : le cron de reversement peut rejouer un
-- paiement après une erreur réseau, et un numéro consommé pour rien créerait
-- un trou dans la séquence.
--
-- Le taux de TVA est passé en paramètre plutôt que codé ici : lib/pricing.json
-- reste la seule source de vérité, côté application comme côté documents.
create or replace function public.creer_facture_commission(
  p_payment_id uuid,
  p_vat_rate   numeric
)
returns public.commission_invoices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paiement public.payments%rowtype;
  v_existante public.commission_invoices%rowtype;
  v_ttc integer;
  v_ht  integer;
  v_facture public.commission_invoices%rowtype;
begin
  select * into v_existante
  from public.commission_invoices
  where payment_id = p_payment_id;

  if found then
    return v_existante;
  end if;

  select * into v_paiement from public.payments where id = p_payment_id;
  if not found then
    raise exception 'Paiement % introuvable', p_payment_id;
  end if;

  v_ttc := v_paiement.platform_fee + coalesce(v_paiement.partner_fee, 0);
  v_ht  := round(v_ttc / (1 + p_vat_rate))::integer;

  insert into public.commission_invoices (
    payment_id, host_id, invoice_number,
    amount_ttc, amount_ht, vat_amount, vat_rate,
    platform_fee, partner_fee, currency
  )
  values (
    p_payment_id,
    v_paiement.host_id,
    public.allouer_numero_facture(extract(year from now())::integer),
    v_ttc, v_ht, v_ttc - v_ht, p_vat_rate,
    v_paiement.platform_fee, coalesce(v_paiement.partner_fee, 0), v_paiement.currency
  )
  returning * into v_facture;

  return v_facture;
end;
$$;

alter table public.commission_invoices enable row level security;
alter table public.invoice_counters enable row level security;

drop policy if exists "Hôte consulte ses propres factures" on public.commission_invoices;
create policy "Hôte consulte ses propres factures"
  on public.commission_invoices for select
  using (host_id = auth.uid());

-- Aucune policy sur invoice_counters ni d'écriture sur commission_invoices :
-- l'émission passe exclusivement par creer_facture_commission(), appelée avec
-- la clé service_role depuis le cron de reversement. Une facture ne doit être
-- ni modifiée ni supprimée après émission.
