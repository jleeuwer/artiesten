import React from "react";

export default function ArtistWorkspaceLayout({ embedded = false, phase34Enabled = true, children }) {
  return (
    <div
      className={`artist-workspace${phase34Enabled ? " artist-workspace-phase34" : " artist-workspace-legacy"}${embedded ? " artist-workspace-embedded" : " artist-workspace-standalone"}`}
      data-testid="artist-workspace"
      data-scroll-container={embedded && phase34Enabled ? "artist-workspace-embedded" : "artist-page"}
    >
      {children}
    </div>
  );
}
