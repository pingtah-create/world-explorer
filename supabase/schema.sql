-- Run this in the Supabase SQL editor to set up the database

-- Visited map tiles
create table if not exists visited_tiles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users on delete cascade not null,
  tile_key    text not null,
  visited_at  timestamptz default now(),
  unique(user_id, tile_key)
);

alter table visited_tiles enable row level security;

create policy "Users can read own tiles"
  on visited_tiles for select using (auth.uid() = user_id);

create policy "Users can insert own tiles"
  on visited_tiles for insert with check (auth.uid() = user_id);

create policy "Users can upsert own tiles"
  on visited_tiles for update using (auth.uid() = user_id);

-- Animal sightings
create table if not exists animal_sightings (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users on delete cascade not null,
  taxon_id           int default 0,
  common_name        text not null,
  scientific_name    text not null,
  photo_url          text default '',
  inaturalist_photo  text default '',
  spotted_at         timestamptz default now(),
  lat                float default 0,
  lng                float default 0
);

alter table animal_sightings enable row level security;

create policy "Users can read own sightings"
  on animal_sightings for select using (auth.uid() = user_id);

create policy "Users can insert own sightings"
  on animal_sightings for insert with check (auth.uid() = user_id);

-- Storage bucket for user animal photos
insert into storage.buckets (id, name, public)
values ('animal-photos', 'animal-photos', true)
on conflict do nothing;

create policy "Users can upload their own photos"
  on storage.objects for insert
  with check (bucket_id = 'animal-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Anyone can view animal photos"
  on storage.objects for select
  using (bucket_id = 'animal-photos');
