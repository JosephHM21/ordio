-- ORDIO — Schema inicial
create extension if not exists "uuid-ossp";

create table public.restaurantes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  nombre text not null,
  descripcion text,
  whatsapp text not null,
  logo_url text,
  plan text default 'basico',
  config jsonb default '{"colores":{"primario":"#FFB800","fondo":"#0a0a0a"},"tiempo_entrega":15}'::jsonb,
  activo boolean default true,
  created_at timestamptz default now()
);

create table public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurante_id uuid references public.restaurantes(id),
  nombre text, email text,
  role text default 'admin',
  activo boolean default true,
  created_at timestamptz default now()
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid references public.restaurantes(id) on delete cascade,
  nombre text not null, orden int default 0, activo boolean default true
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid references public.restaurantes(id) on delete cascade,
  categoria_id uuid references public.categorias(id),
  nombre text not null, descripcion text,
  precio decimal(10,2) not null,
  tiempo_prep int default 15,
  ingredientes text[] default '{}',
  tiene_sabores boolean default false,
  imagen_url text, activo boolean default true, orden int default 0
);

create table public.pedidos (
  id uuid primary key default gen_random_uuid(),
  restaurante_id uuid references public.restaurantes(id),
  numero serial,
  cliente_nombre text not null, cliente_telefono text, cliente_direccion text,
  items jsonb not null default '[]',
  total decimal(10,2) not null,
  tiempo_estimado text,
  estado text default 'pendiente',
  notas text, tipo text default 'domicilio',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- RLS
alter table public.restaurantes enable row level security;
alter table public.usuarios enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;

create policy "pub_restaurantes" on public.restaurantes for select using (activo = true);
create policy "own_restaurantes" on public.restaurantes for all using (id in (select restaurante_id from public.usuarios where id = auth.uid()));
create policy "own_usuario" on public.usuarios for all using (id = auth.uid());
create policy "pub_categorias" on public.categorias for select using (activo = true);
create policy "own_categorias" on public.categorias for all using (restaurante_id in (select restaurante_id from public.usuarios where id = auth.uid()));
create policy "pub_productos" on public.productos for select using (activo = true);
create policy "own_productos" on public.productos for all using (restaurante_id in (select restaurante_id from public.usuarios where id = auth.uid()));
create policy "insert_pedidos" on public.pedidos for insert with check (true);
create policy "select_pedidos" on public.pedidos for select using (true);
create policy "own_update_pedidos" on public.pedidos for update using (restaurante_id in (select restaurante_id from public.usuarios where id = auth.uid()));

-- Seed Baggo's
insert into public.restaurantes (slug, nombre, descripcion, whatsapp, plan)
values ('baggos', 'Baggo''s Foodhouse', 'Hamburguesas, alitas, boneless y hot dogs.', '2961752094', 'premium');
