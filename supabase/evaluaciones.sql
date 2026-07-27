-- ============================================================
-- MOVIMENTE — Tablas de evaluaciones (antropométricas + funcionales)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar → Run
-- ============================================================

-- 1. Evaluaciones antropométricas
create table if not exists evaluaciones_antropometricas (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references profiles(id) on delete cascade,
  evaluador_id uuid references profiles(id),
  fecha timestamptz not null default now(),

  -- Básicas
  peso_kg numeric(5,1),
  altura_cm numeric(5,1),

  -- Composición corporal (bioimpedancia)
  grasa_pct numeric(4,1),
  masa_muscular_kg numeric(5,1),

  -- Perímetros (cm)
  per_pecho_cm numeric(5,1),
  per_cintura_cm numeric(5,1),
  per_cadera_cm numeric(5,1),
  per_brazo_cm numeric(4,1),
  per_muslo_cm numeric(5,1),
  per_pantorrilla_cm numeric(4,1),

  -- Pliegues cutáneos (mm)
  pliegue_tricipital_mm numeric(4,1),
  pliegue_subescapular_mm numeric(4,1),
  pliegue_suprailiaco_mm numeric(4,1),
  pliegue_abdominal_mm numeric(4,1),

  notas text
);

-- 2. Evaluaciones funcionales
create table if not exists evaluaciones_funcionales (
  id uuid primary key default gen_random_uuid(),
  socio_id uuid not null references profiles(id) on delete cascade,
  evaluador_id uuid references profiles(id),
  fecha timestamptz not null default now(),

  tipo text not null,          -- nombre del test (ej: 'Flexiones máximas')
  resultado numeric(7,1) not null,
  unidad text not null,        -- 'reps' | 'seg' | 'cm' | 'm'
  notas text
);

-- Índices para consultas por socio
create index if not exists idx_eval_antro_socio on evaluaciones_antropometricas(socio_id, fecha desc);
create index if not exists idx_eval_func_socio on evaluaciones_funcionales(socio_id, fecha desc);

-- ============================================================
-- RLS (seguridad por fila) — mismo criterio que el resto de la app
-- ============================================================
alter table evaluaciones_antropometricas enable row level security;
alter table evaluaciones_funcionales enable row level security;

-- Entrenadores y admins: acceso total
create policy "entrenadores gestionan evaluaciones antro"
  on evaluaciones_antropometricas for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.rol in ('entrenador', 'admin')
    )
  );

create policy "entrenadores gestionan evaluaciones func"
  on evaluaciones_funcionales for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.rol in ('entrenador', 'admin')
    )
  );

-- Socios: solo leen sus propias evaluaciones
create policy "socios leen sus evaluaciones antro"
  on evaluaciones_antropometricas for select
  using (socio_id = auth.uid());

create policy "socios leen sus evaluaciones func"
  on evaluaciones_funcionales for select
  using (socio_id = auth.uid());
