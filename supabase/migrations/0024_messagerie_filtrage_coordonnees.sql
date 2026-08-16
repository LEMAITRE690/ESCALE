-- Messagerie réelle entre hôte et voyageur, liée à une réservation. La
-- "Messagerie voyageurs" visible dans le tableau de bord hôte était jusqu'ici
-- entièrement fictive (aucune table, aucune route) — cette migration la rend
-- réelle, avec un filtrage automatique des coordonnées personnelles pour
-- limiter les réservations organisées en direct, hors d'Escale.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  host_id uuid not null references public.profiles(id),
  guest_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (reservation_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),

  -- Contenu réellement affiché aux deux parties, coordonnées masquées.
  content text not null,
  -- Contenu original, jamais affiché à l'autre partie : conservé uniquement
  -- pour permettre à un administrateur d'instruire un signalement en cas de
  -- contournement répété — accès exclusivement via route service_role.
  content_original text not null,
  contains_contact_info boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Les deux parties d'une conversation la consultent"
  on public.conversations for select
  using (host_id = auth.uid() or guest_id = auth.uid());

create policy "Les deux parties d'une conversation lisent les messages"
  on public.messages for select
  using (
    conversation_id in (
      select id from public.conversations where host_id = auth.uid() or guest_id = auth.uid()
    )
  );

-- Aucune policy INSERT côté client : l'envoi passe exclusivement par
-- POST /api/messages (clé service_role), pour garantir que le filtrage des
-- coordonnées est TOUJOURS appliqué avant écriture, jamais contournable en
-- insérant directement depuis le client.

comment on column public.messages.content_original is
  'Contenu non filtré, jamais exposé au client — consultation admin uniquement, en cas de signalement pour contournement répété de la plateforme.';
