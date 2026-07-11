-- ART-013A - One-way artist -> musician sync for linked person artists
--
-- Design decisions:
-- - Synchronization is one-way only: artist -> musician.
-- - Synchronization runs only on UPDATE of an existing artist.
-- - No musician records are created automatically.
-- - DELETE / merge / deactivate of an artist never deletes or changes musician rows.
-- - Only existing musicians linked by musician.ar_artist_key are updated.
-- - Only artists with ar_artist_type = 'person' are synchronized.
-- - Notes, favorites, Discogs data and merge/delete state are intentionally not synchronized.

CREATE OR REPLACE FUNCTION public.fn_artist_sync_to_musician()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only linked person-artists are allowed to drive musician data.
  -- Bands, groups, duos, trios, projects, aliases and unknown artists do not sync.
  IF COALESCE(NEW.ar_artist_type, 'unknown') = 'person' THEN
    UPDATE public.musician m
       SET mu_musician_name = NEW.ar_artist_name::text,
           -- musician.mu_musician_dateofbirth is NOT NULL in the current musicdb schema.
           -- If the artist birth date is cleared or missing, preserve the existing musician value
           -- instead of failing the artist update or inventing a placeholder date.
           mu_musician_dateofbirth = COALESCE(NEW.ar_artist_dateofbirth, m.mu_musician_dateofbirth),
           mu_musician_passing = NEW.ar_artist_passing,
           mu_website_url = NEW.ar_website_url
     WHERE m.ar_artist_key = NEW.ar_artist_key;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_artist_sync_to_musician ON public.artist;

CREATE TRIGGER trg_artist_sync_to_musician
AFTER UPDATE OF
  ar_artist_name,
  ar_artist_dateofbirth,
  ar_artist_passing,
  ar_website_url,
  ar_artist_type
ON public.artist
FOR EACH ROW
WHEN (
  OLD.ar_artist_name IS DISTINCT FROM NEW.ar_artist_name
  OR OLD.ar_artist_dateofbirth IS DISTINCT FROM NEW.ar_artist_dateofbirth
  OR OLD.ar_artist_passing IS DISTINCT FROM NEW.ar_artist_passing
  OR OLD.ar_website_url IS DISTINCT FROM NEW.ar_website_url
  OR OLD.ar_artist_type IS DISTINCT FROM NEW.ar_artist_type
)
EXECUTE FUNCTION public.fn_artist_sync_to_musician();

COMMENT ON FUNCTION public.fn_artist_sync_to_musician() IS
  'ART-013A: one-way artist -> musician sync for existing linked person artists only. No auto-create, no delete/merge sync, no bidirectional sync.';

COMMENT ON TRIGGER trg_artist_sync_to_musician ON public.artist IS
  'ART-013A: syncs selected artist fields to existing linked musician rows when a person artist is updated.';
