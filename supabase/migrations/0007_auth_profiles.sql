-- Authentification : chaque compte auth.users a un profil Escale associé,
-- avec un rôle. "hote" et "voyageur" ne sont pas exclusifs dans les faits
-- (un voyageur peut devenir hôte) : le rôle par défaut est "voyageur", et
-- devenir hôte se fait en publiant une première annonce, pas via un champ
-- séparé. "admin" reste un rôle distinct, attribué manuellement.

create type user_role as enum ('voyageur', 'hote', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role user_role not null default 'voyageur',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Chacun consulte son propre profil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Chacun modifie son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Création automatique du profil à l'inscription (déclenché sur auth.users,
-- géré par Supabase — aucune écriture manuelle nécessaire côté application)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'voyageur')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Empêche un utilisateur de modifier son propre rôle (donc de s'attribuer
-- "admin") via la policy d'update ci-dessus, qui autorise la mise à jour de
-- la ligne mais pas le contournement de cette règle métier.
create or replace function public.prevent_role_self_escalation()
returns trigger as $$
begin
  if new.role <> old.role and auth.uid() = old.id then
    raise exception 'Le rôle ne peut pas être modifié par l''utilisateur lui-même.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_role_change on public.profiles;
create trigger on_profile_role_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

