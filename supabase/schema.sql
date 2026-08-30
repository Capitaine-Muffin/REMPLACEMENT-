-- =============================================================================
-- Schema Supabase pour REMPLACEMENT (sages-femmes remplaçantes)
--
-- A executer dans le SQL Editor d'un projet Supabase heberge en region EU.
--
-- Aucune donnee de santé n'est stockee : uniquement des cotations, des
-- quantites, des montants et des noms de contrats. L'hebergement HDS n'est
-- donc pas requis, mais le projet doit rester en region europeenne (RGPD).
-- =============================================================================

create extension if not exists "pgcrypto";

-- Réglages generaux de l'utilisatrice ------------------------------------------
create table if not exists public.profils (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  version    integer not null default 2,
  reglages   jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Lettres cles de la NGAP (SF, SP...) ------------------------------------------
-- Leur valeur est fixee par la convention et change a chaque revalorisation :
-- c'est le seul chiffre a mettre a jour pour que tous les actes cotes au
-- coefficient suivent.
create table if not exists public.lettres_cles (
  id         text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  code       text not null,
  libelle    text not null default '',
  valeur     numeric(10, 2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- Contrats de remplacement -----------------------------------------------------
create table if not exists public.contrats (
  id                text not null,
  user_id           uuid not null references auth.users (id) on delete cascade,
  nom               text not null,
  couleur           text not null default '#0f766e',
  taux_retrocession numeric(5, 4) not null default 0.30
                    check (taux_retrocession >= 0 and taux_retrocession <= 1),
  -- { "majorations": bool, "id": bool, "ik": bool }
  assiette          jsonb not null default '{"majorations":false,"id":false,"ik":false}'::jsonb,
  -- Dépassements d'honoraires : { "<acteId>": montant }
  tarifs            jsonb not null default '{}'::jsonb,
  actif             boolean not null default true,
  date_debut        date,
  date_fin          date,
  notes             text,
  updated_at        timestamptz not null default now(),
  primary key (user_id, id)
);

-- Catalogue d'actes, majorations et indemnités ---------------------------------
create table if not exists public.actes (
  id           text not null,
  user_id      uuid not null references auth.users (id) on delete cascade,
  code         text not null,
  libelle      text not null,
  categorie    text not null check (categorie in ('acte', 'majoration', 'id', 'ik')),
  -- 'coefficient' : lettre cle x coefficient. 'forfait' : montant fixe.
  tarification text not null default 'forfait'
               check (tarification in ('coefficient', 'forfait')),
  lettre_cle_id text,
  coefficient   numeric(10, 3),
  tarif        numeric(10, 2) not null default 0,
  -- Une cotation au coefficient doit designer une lettre cle, un forfait non.
  constraint actes_cotation_coherente check (
    (tarification = 'coefficient' and lettre_cle_id is not null and coefficient is not null)
    or tarification = 'forfait'
  ),
  foreign key (user_id, lettre_cle_id)
    references public.lettres_cles (user_id, id) on delete set null,
  unite        text not null default 'acte' check (unite in ('acte', 'km')),
  favori       boolean not null default false,
  archive      boolean not null default false,
  personnalise boolean not null default true,
  note         text,
  updated_at   timestamptz not null default now(),
  primary key (user_id, id)
);

-- Feuilles journalieres --------------------------------------------------------
-- Les lignes sont stockees en JSONB : elles n'existent jamais sans leur
-- journée et ne sont jamais requetees independamment.
create table if not exists public.journees (
  id         text not null,
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  contrat_id text not null,
  lignes     jsonb not null default '[]'::jsonb,
  notes      text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, contrat_id) references public.contrats (user_id, id) on delete cascade
);

create index if not exists journees_user_date_idx on public.journees (user_id, date);

-- Cloisonnement par utilisatrice (RLS) -----------------------------------------
alter table public.profils  enable row level security;
alter table public.contrats enable row level security;
alter table public.actes    enable row level security;
alter table public.journees enable row level security;

do $$
declare t text;
begin
  foreach t in array array['profils', 'lettres_cles', 'contrats', 'actes', 'journees'] loop
    execute format('drop policy if exists "acces proprietaire" on public.%I', t);
    execute format(
      'create policy "acces proprietaire" on public.%I
         for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- Horodatage automatique -------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profils', 'lettres_cles', 'contrats', 'actes', 'journees'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format(
      'create trigger touch_%1$s before insert or update on public.%1$I
         for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;
