-- ART Sprint 6 - Artiesten relatie-inzicht, gewicht en favorieten
-- Adds a simple favorite flag used by the Artiesten-app list, filter and sorting controls.

ALTER TABLE public.artist
  ADD COLUMN IF NOT EXISTS ar_is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_artist_is_favorite
  ON public.artist (ar_is_favorite, ar_artist_name);

COMMENT ON COLUMN public.artist.ar_is_favorite IS
  'Artiesten-app favorite marker used for filtering and favorite-first sorting.';
