-- ============================================================
-- MOVIMENTE — Bucket de imágenes de ejercicios
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- Crear el bucket público (las imágenes de ejercicios no son datos sensibles)
insert into storage.buckets (id, name, public)
values ('ejercicios', 'ejercicios', true)
on conflict (id) do nothing;

-- Cualquiera puede VER las imágenes (bucket público)
create policy "lectura publica imagenes ejercicios"
  on storage.objects for select
  using (bucket_id = 'ejercicios');

-- Solo entrenadores/admins pueden SUBIR imágenes
create policy "entrenadores suben imagenes ejercicios"
  on storage.objects for insert
  with check (
    bucket_id = 'ejercicios'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.rol in ('entrenador', 'admin')
    )
  );

-- Solo entrenadores/admins pueden BORRAR imágenes
create policy "entrenadores borran imagenes ejercicios"
  on storage.objects for delete
  using (
    bucket_id = 'ejercicios'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.rol in ('entrenador', 'admin')
    )
  );
