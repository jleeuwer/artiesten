-- ART-012E-2 - Discogs profile image selection
-- Uses existing artist_external_image.is_primary to mark one Discogs image as the artist profile photo.

-- Existing data may contain more than one primary image per artist/source because Discogs
-- can return multiple images with type=primary across refreshes. Normalize before adding
-- the partial unique index.
WITH ranked AS (
  SELECT
    image_id,
    row_number() OVER (
      PARTITION BY artist_key
      ORDER BY
        CASE WHEN lower(coalesce(image_type, '')) = 'primary' THEN 0 ELSE 1 END,
        updated_at DESC NULLS LAST,
        image_id DESC
    ) AS rn
  FROM public.artist_external_image
  WHERE is_primary = true
)
UPDATE public.artist_external_image img
SET is_primary = false,
    updated_at = now()
FROM ranked r
WHERE img.image_id = r.image_id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_artist_external_image_one_primary
  ON public.artist_external_image (artist_key)
  WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_artist_external_image_artist_primary
  ON public.artist_external_image (artist_key, is_primary DESC, image_id DESC);
