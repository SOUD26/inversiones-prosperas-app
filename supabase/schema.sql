-- =====================================================================
-- Inversiones Prósperas · Esquema base: usuarios, roles y permisos
-- Pegar completo en Supabase > SQL Editor > New query > Run
-- =====================================================================

-- 1) Perfiles (uno por usuario de Supabase Auth)
create table if not exists public.profiles (
  id        uuid primary key references auth.users(id) on delete cascade,
  email     text,
  nombre    text,
  activo    boolean not null default false,   -- nadie entra hasta que un admin lo active
  es_admin  boolean not null default false,
  creado    timestamptz not null default now()
);

-- 2) Catálogo de permisos (cada permiso = una casilla del checklist)
create table if not exists public.permisos (
  clave        text primary key,              -- ej: 'caja_chica.ver'
  modulo       text not null,                 -- ej: 'caja_chica'
  descripcion  text not null
);

-- 3) Permisos asignados a cada usuario
create table if not exists public.usuario_permisos (
  user_id  uuid not null references public.profiles(id) on delete cascade,
  permiso  text not null references public.permisos(clave) on delete cascade,
  primary key (user_id, permiso)
);

-- 4) Permisos iniciales: uno por botón del menú
insert into public.permisos (clave, modulo, descripcion) values
  ('caja_chica.ver', 'caja_chica', 'Ver Caja chica'),
  ('personal.ver',   'personal',   'Ver Personal'),
  ('planilla.ver',   'planilla',   'Ver Planilla'),
  ('compras.ver',    'compras',    'Ver Compras'),
  ('bitacora.ver',   'bitacora',   'Ver Bitácora'),
  ('eventos.ver',    'eventos',    'Ver Eventos'),
  ('pendientes.ver', 'pendientes', 'Ver Pendientes')
on conflict (clave) do nothing;

-- 5) Al registrarse alguien (Google o correo) se crea su perfil, INACTIVO y sin permisos
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',
             new.raw_user_meta_data->>'name',
             split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6) Funciones de apoyo (las usarán TODAS las tablas futuras en sus políticas)
create or replace function public.es_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select p.es_admin and p.activo from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

create or replace function public.tiene_permiso(p text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.activo
      and (
        pr.es_admin
        or exists (
          select 1 from public.usuario_permisos up
          where up.user_id = pr.id and up.permiso = p
        )
      )
  );
$$;

-- 7) Seguridad a nivel de fila (RLS): lo que de verdad protege los datos
alter table public.profiles          enable row level security;
alter table public.permisos          enable row level security;
alter table public.usuario_permisos  enable row level security;

drop policy if exists "perfil: ver propio o admin"   on public.profiles;
drop policy if exists "perfil: admin edita"          on public.profiles;
drop policy if exists "permisos: ver catalogo"       on public.permisos;
drop policy if exists "usuario_permisos: ver"        on public.usuario_permisos;
drop policy if exists "usuario_permisos: admin alta" on public.usuario_permisos;
drop policy if exists "usuario_permisos: admin baja" on public.usuario_permisos;

create policy "perfil: ver propio o admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.es_admin());

create policy "perfil: admin edita"
  on public.profiles for update to authenticated
  using (public.es_admin()) with check (public.es_admin());

create policy "permisos: ver catalogo"
  on public.permisos for select to authenticated
  using (true);

create policy "usuario_permisos: ver"
  on public.usuario_permisos for select to authenticated
  using (user_id = auth.uid() or public.es_admin());

create policy "usuario_permisos: admin alta"
  on public.usuario_permisos for insert to authenticated
  with check (public.es_admin());

create policy "usuario_permisos: admin baja"
  on public.usuario_permisos for delete to authenticated
  using (public.es_admin());

-- 9) Endurecimiento (avisos del linter de Supabase)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.es_admin() from public, anon;
revoke execute on function public.tiene_permiso(text) from public, anon;
grant  execute on function public.es_admin() to authenticated;
grant  execute on function public.tiene_permiso(text) to authenticated;

-- 8) PRIMER ADMINISTRADOR
-- Inicia sesión una vez en la app con tu correo (quedarás "pendiente") y luego
-- ejecuta esto, cambiando el correo:
--
-- update public.profiles
--    set es_admin = true, activo = true
--  where email = 'TU_CORREO@gmail.com';
--
-- Regla para las tablas futuras (ejemplo, cuando hagamos Caja chica):
--   create policy "caja_chica: ver" on public.caja_chica for select to authenticated
--     using (public.tiene_permiso('caja_chica.ver'));
