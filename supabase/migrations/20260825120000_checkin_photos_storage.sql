-- Fotos de check-in: coluna photo_url + bucket público checkin-photos

alter table public.checkins
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checkin-photos',
  'checkin-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "checkin_photos_public_read" on storage.objects;
create policy "checkin_photos_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'checkin-photos');

drop policy if exists "checkin_photos_insert_own" on storage.objects;
create policy "checkin_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "checkin_photos_update_own" on storage.objects;
create policy "checkin_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "checkin_photos_delete_own" on storage.objects;
create policy "checkin_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'checkin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
