alter table public.reviews
  add column if not exists host_reply text,
  add column if not exists host_reply_at timestamptz;

-- L'hôte du logement concerné peut répondre (et modifier sa réponse),
-- jamais le contenu ni la note de l'avis lui-même.
create policy "L'hôte répond aux avis de ses logements"
  on public.reviews for update
  using (
    listing_id in (select id from public.listings where host_id = auth.uid())
  )
  with check (
    listing_id in (select id from public.listings where host_id = auth.uid())
  );

-- La policy ci-dessus autorise la mise à jour de la ligne, pas d'une colonne
-- précise : ce trigger empêche l'hôte de modifier la note ou le commentaire
-- du voyageur en passant par cette même route.
create or replace function public.prevent_review_content_edit_by_host()
returns trigger as $$
begin
  if auth.uid() <> old.guest_id and (
    new.rating <> old.rating or
    coalesce(new.comment, '') <> coalesce(old.comment, '') or
    new.guest_display_name <> old.guest_display_name
  ) then
    raise exception 'Seul l''auteur de l''avis peut modifier sa note ou son commentaire.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_update on public.reviews;
create trigger on_review_update
  before update on public.reviews
  for each row execute function public.prevent_review_content_edit_by_host();
