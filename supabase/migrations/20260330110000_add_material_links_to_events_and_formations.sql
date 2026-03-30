alter table public.events
add column if not exists material_links jsonb not null default '[]'::jsonb;

alter table public.formations
add column if not exists material_links jsonb not null default '[]'::jsonb;
