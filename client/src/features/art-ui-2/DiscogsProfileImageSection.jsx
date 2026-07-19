import React, { useEffect, useId, useState } from "react";
import { Alert, Badge, Button } from "react-bootstrap";

function EmptyState({ children }) {
  return <div className="text-muted small py-2">{children}</div>;
}

export default function DiscogsProfileImageSection({
  artistKey,
  images = [],
  primaryImage = null,
  loadingImageId = "",
  error = "",
  success = false,
  onSelectPrimary,
}) {
  const contentId = useId();
  const [expanded, setExpanded] = useState(!primaryImage);

  useEffect(() => {
    setExpanded(!primaryImage);
  }, [artistKey, primaryImage?.image_id]);

  async function selectPrimary(image) {
    try {
      await onSelectPrimary(image);
      setExpanded(false);
    } catch {
      setExpanded(true);
    }
  }

  return (
    <div className="artist-discogs-profile-images mb-2 small border rounded p-2" data-testid="discogs-profile-image-section">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <div className="d-flex align-items-center gap-2 min-w-0">
          {primaryImage?.external_image_url ? (
            <img
              className="artist-profile-section-thumbnail"
              src={primaryImage.external_image_url}
              alt="Gekozen Discogs-profielfoto"
              loading="lazy"
            />
          ) : (
            <span className="artist-profile-section-thumbnail artist-list-thumbnail-fallback" aria-hidden="true">
              <i className="bi bi-person" />
            </span>
          )}
          <div>
            <div className="fw-semibold">Profielfoto uit Discogs images</div>
            <div className="text-muted">
              {primaryImage ? "Profielfoto gekozen. Open de sectie alleen wanneer je deze wilt wijzigen." : "Kies één Discogs-afbeelding als primaire profielfoto."}
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {primaryImage ? <Badge bg="success">Profielfoto gekozen</Badge> : <Badge bg="secondary">Geen profielfoto</Badge>}
          <Button
            type="button"
            size="sm"
            variant="outline-primary"
            aria-expanded={expanded}
            aria-controls={contentId}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Profielfoto's verbergen" : primaryImage ? "Profielfoto wijzigen" : "Profielfoto kiezen"}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div id={contentId} className="mt-3" data-testid="discogs-profile-image-content">
          {error ? <Alert variant="danger" className="py-2 small mb-2">{error}</Alert> : null}
          {success ? <Alert variant="success" className="py-2 small mb-2">Primaire profielfoto bijgewerkt.</Alert> : null}
          {!images.length ? (
            <EmptyState>Geen Discogs-afbeeldingen gevonden. Koppel of ververs eerst een Discogs artist met images.</EmptyState>
          ) : (
            <div className="artist-discogs-image-grid" aria-label="Discogs afbeeldingen voor profielfoto">
              {images.map((image) => (
                <div key={image.image_id} className={`artist-discogs-image-card ${image.is_primary ? "artist-discogs-image-card-primary" : ""}`.trim()}>
                  <a href={image.external_resource_url || image.external_image_url} target="_blank" rel="noreferrer" title="Open afbeelding">
                    <img src={image.external_image_url} alt="Discogs artist afbeelding" loading="lazy" />
                  </a>
                  <div className="artist-discogs-image-meta">
                    <div className="d-flex gap-1 flex-wrap align-items-center">
                      {image.is_primary ? <Badge bg="success">Profielfoto</Badge> : null}
                      {image.image_type ? <Badge bg="light" text="dark">{image.image_type}</Badge> : null}
                      {image.width || image.height ? <span className="text-muted">{image.width || "?"}×{image.height || "?"}</span> : null}
                    </div>
                    <Button
                      size="sm"
                      variant={image.is_primary ? "success" : "outline-primary"}
                      className="mt-2 w-100"
                      disabled={image.is_primary || Boolean(loadingImageId)}
                      onClick={() => selectPrimary(image)}
                    >
                      {loadingImageId === String(image.image_id) ? "Opslaan..." : image.is_primary ? "Huidige profielfoto" : "Maak profielfoto"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
