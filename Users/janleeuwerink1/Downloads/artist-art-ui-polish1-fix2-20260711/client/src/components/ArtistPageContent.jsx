import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Container, Button, Table, Form, InputGroup, Alert, Spinner, Badge,
  Toast, ToastContainer, Offcanvas
} from "react-bootstrap";
import { api } from "../api.js";
import ArtistFormModal from "./ArtistFormModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";

function fmtDate(v) {
  if (!v) return "";
  const text = String(v).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return text.slice(0, 10);
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function HourglassBottomIcon({ className = "" }) {
  return (
    <svg
      className={`artist-hourglass-icon ${className}`.trim()}
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M3 1.5h10M3 14.5h10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 2.5c0 2.7 1.6 3.8 4 5-2.4 1.2-4 2.3-4 5h8c0-2.7-1.6-3.8-4-5 2.4-1.2 4-2.3 4-5H4Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M5.6 11.7c.75-1.05 1.45-1.48 2.4-2 .95.52 1.65.95 2.4 2H5.6Z" fill="currentColor" />
    </svg>
  );
}

function DeceasedStatusBadge({ passingDate, compact = false, testId }) {
  const normalizedDate = String(passingDate || "").trim();
  if (!normalizedDate) return null;
  const label = `Artiest overleden op ${fmtDate(normalizedDate)}`;
  return (
    <span
      className={`artist-deceased-indicator${compact ? "" : " artist-deceased-indicator-detail"}`}
      title={label}
      aria-label={label}
      data-testid={testId}
    >
      <HourglassBottomIcon />
      {!compact ? <span>Overleden</span> : null}
    </span>
  );
}

function pickNiceMessage(err) {
  const message = err?.message || "Something went wrong";
  const step = err?.payload?.mergeStep;
  const transaction = err?.payload?.transaction;
  if (step && transaction === "rolled_back") {
    return `${message} Stap: ${step}.`;
  }
  return message;
}

function countLabel(value, singular, plural) {
  const n = Number(value || 0);
  return `${n} ${n === 1 ? singular : plural}`;
}

function EmptyState({ children }) {
  return <div className="text-muted small py-2">{children}</div>;
}

function artistTypeLabel(value) {
  const labels = {
    unknown: "Onbekend",
    person: "Persoon",
    duo: "Duo",
    trio: "Trio",
    group: "Groep",
    band: "Band",
    alias: "Alias",
    project: "Project",
  };
  return labels[value] || labels.unknown;
}

function DiscogsLinkedIcon({ artist }) {
  if (!artist?.has_discogs_link) return <span className="text-muted">—</span>;
  const label = artist.discogs_external_name
    ? `Discogs gekoppeld: ${artist.discogs_external_name}`
    : "Discogs gekoppeld";
  return (
    <span className="artist-discogs-link-indicator" title={label} aria-label={label}>
      <i className="bi bi-link" aria-hidden="true"></i>
    </span>
  );
}

function DiscogsProfileImage({ image, size = "small" }) {
  if (!image?.external_image_url) {
    return (
      <div className={`artist-profile-image artist-profile-image-${size} artist-profile-image-empty`} aria-label="Geen profielfoto gekozen">
        <i className="bi bi-person" aria-hidden="true"></i>
      </div>
    );
  }
  return (
    <img
      className={`artist-profile-image artist-profile-image-${size}`}
      src={image.external_image_url}
      alt="Primaire artiest profielfoto uit Discogs"
      loading="lazy"
    />
  );
}

function ArtistListIdentityVisual({ artist }) {
  const imageUrl = artist?.primary_image_url || "";
  const artistName = artist?.ar_artist_name || "Onbekende artiest";
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  const isDeceased = Boolean(String(artist?.ar_artist_passing || "").trim());
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <div className="artist-list-identity-visual">
      <span className="artist-list-status-slot">
        {isDeceased ? (
          <DeceasedStatusBadge
            passingDate={artist.ar_artist_passing}
            compact
            testId="artist-deceased-indicator"
          />
        ) : null}
      </span>
      {showImage ? (
        <img
          className="artist-list-thumbnail"
          src={imageUrl}
          alt={`Profielfoto van ${artistName}`}
          loading="lazy"
          width="32"
          height="32"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="artist-list-thumbnail artist-list-thumbnail-fallback"
          role="img"
          aria-label={`Geen profielfoto beschikbaar voor ${artistName}`}
        >
          <i className="bi bi-person" aria-hidden="true"></i>
        </span>
      )}
    </div>
  );
}

function isAddableDiscogsSpellingProposal(proposal) {
  const action = String(proposal?.action || "");
  return proposal?.canAddAlternativeSpelling === true
    || action === "available_discogs_name"
    || action === "available_alternative_spelling";
}

function isCanonicalPreviewCandidate(proposal) {
  const action = String(proposal?.action || "");
  return proposal?.canProposeCanonicalRename === true
    || action === "available_discogs_name"
    || action === "already_alternative_spelling";
}

function discogsProposalKey(proposal) {
  return proposal?.normalized_name || proposal?.proposed_name || proposal?.action || "proposal";
}


function enrichmentStatusVariant(status) {
  const value = String(status || "");
  if (value === "conflict") return "danger";
  if (value === "available") return "success";
  if (value === "applied") return "primary";
  if (value === "ignored") return "dark";
  if (value === "review_later") return "info";
  if (value === "existing") return "secondary";
  if (value === "not_applicable") return "warning";
  return "secondary";
}

function enrichmentConfidenceVariant(confidence) {
  const value = String(confidence || "");
  if (value === "high") return "success";
  if (value === "medium") return "warning";
  return "secondary";
}


function nameProposalStatusVariant(status) {
  const value = String(status || "");
  if (value === "conflict") return "danger";
  if (value === "new") return "success";
  if (value === "added") return "primary";
  if (value === "ignored") return "dark";
  if (value === "review_later") return "info";
  if (value === "existing") return "secondary";
  if (value === "invalid") return "warning";
  return "secondary";
}

function canApplyNameProposal(proposal) {
  const status = String(proposal?.status || "");
  return ["new", "review_later"].includes(status) && !proposal?.conflict_artist_key;
}

function canReviewNameProposal(proposal) {
  return !["added", "existing"].includes(String(proposal?.status || ""));
}


function isLikelyHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function EnrichmentValue({ value, strong = false }) {
  const text = String(value || "").trim();
  if (!text) return <span className="text-muted">—</span>;
  if (isLikelyHttpUrl(text)) {
    return (
      <span className="artist-discogs-enrichment-value">
        <a href={text} target="_blank" rel="noreferrer" className={strong ? "fw-semibold" : undefined}>Open link</a>
        <span className="artist-discogs-enrichment-url text-muted" title={text}>{text}</span>
      </span>
    );
  }
  return <span className={strong ? "fw-semibold artist-discogs-enrichment-value" : "artist-discogs-enrichment-value"}>{text}</span>;
}

function enrichmentTargetLabel(proposal) {
  const field = proposal?.target_field || "";
  const labels = {
    ar_artist_dateofbirth: "Geboortedatum",
    ar_artist_passing: "Sterfdatum",
    ar_website_url: "Website",
    ar_artist_type: "Artist type",
    profile_text: "Profieltekst",
    is_primary: "Profielfoto",
  };
  return labels[field] || field || proposal?.proposal_type || "Voorstel";
}


function canApplyEnrichmentProposal(proposal) {
  const status = String(proposal?.status || "");
  if (!["available", "conflict", "review_later"].includes(status)) return false;
  const key = `${proposal?.target_table || ""}.${proposal?.target_field || ""}`;
  return [
    "artist.ar_artist_dateofbirth",
    "artist.ar_artist_passing",
    "artist.ar_website_url",
    "artist.ar_artist_type",
    "artist_external_profile.profile_text",
  ].includes(key);
}

function canReviewEnrichmentProposal(proposal) {
  return !["applied", "ignored", "existing"].includes(String(proposal?.status || ""));
}

export default function ArtistPageContent({ shellContext = {} }) {
  const shellMode = shellContext?.shellMode === true;
  const embeddedInShell = shellContext?.embeddedInShell === true;
  const activeTheme = shellContext?.themeKey || "slate";
  const themeSource = shellContext?.themeSource || "default";

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("favorite_first");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [mergeStatus, setMergeStatus] = useState("active");
  const [offset, setOffset] = useState(0);
  const limit = 25;
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", bg: "dark", action: null });
  const notify = (message, bg = "dark", action = null) => setToast({ show: true, message, bg, action });
  const undoTimerRef = useRef(null);
  const [lastDeleted, setLastDeleted] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [active, setActive] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsArtist, setDetailsArtist] = useState(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState([]);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [relations, setRelations] = useState(null);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationsError, setRelationsError] = useState("");
  const [duplicateCandidates, setDuplicateCandidates] = useState(null);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [duplicatesError, setDuplicatesError] = useState("");
  const [impactOpen, setImpactOpen] = useState(false);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState("");
  const [impactData, setImpactData] = useState(null);
  const [mergeReason, setMergeReason] = useState("");
  const [mergeConfirmed, setMergeConfirmed] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [mergeResult, setMergeResult] = useState(null);
  const [activeReviewCandidateId, setActiveReviewCandidateId] = useState(null);
  const [reviewQueueOpen, setReviewQueueOpen] = useState(false);
  const [reviewCandidates, setReviewCandidates] = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewStatus, setReviewStatus] = useState("open");
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewMinScore, setReviewMinScore] = useState("");
  const [reviewOffset, setReviewOffset] = useState(0);
  const [discogsConfig, setDiscogsConfig] = useState(null);
  const [discogsResults, setDiscogsResults] = useState(null);
  const [discogsLoading, setDiscogsLoading] = useState(false);
  const [discogsError, setDiscogsError] = useState("");
  const [discogsDetail, setDiscogsDetail] = useState(null);
  const [discogsDetailLoading, setDiscogsDetailLoading] = useState(false);
  const [discogsDetailError, setDiscogsDetailError] = useState("");
  const [discogsLinkLoading, setDiscogsLinkLoading] = useState(false);
  const [discogsLinkError, setDiscogsLinkError] = useState("");
  const [discogsLinkResult, setDiscogsLinkResult] = useState(null);
  const [discogsProposals, setDiscogsProposals] = useState(null);
  const [discogsProposalsLoading, setDiscogsProposalsLoading] = useState(false);
  const [discogsProposalsError, setDiscogsProposalsError] = useState("");
  const [discogsNameQueue, setDiscogsNameQueue] = useState(null);
  const [discogsNameQueueLoading, setDiscogsNameQueueLoading] = useState(false);
  const [discogsNameQueueError, setDiscogsNameQueueError] = useState("");
  const [discogsNameQueueGenerated, setDiscogsNameQueueGenerated] = useState(null);
  const [discogsNameQueueActionLoading, setDiscogsNameQueueActionLoading] = useState("");
  const [discogsNameQueueStatusFilter, setDiscogsNameQueueStatusFilter] = useState("all");
  const [discogsNameQueueTypeFilter, setDiscogsNameQueueTypeFilter] = useState("all");
  const [discogsNameQueueSearch, setDiscogsNameQueueSearch] = useState("");
  const [discogsSpellingAddLoading, setDiscogsSpellingAddLoading] = useState("");
  const [discogsSpellingAddResult, setDiscogsSpellingAddResult] = useState(null);
  const [discogsSpellingAddError, setDiscogsSpellingAddError] = useState("");
  const [discogsCanonicalPreviewLoading, setDiscogsCanonicalPreviewLoading] = useState("");
  const [discogsCanonicalPreviewError, setDiscogsCanonicalPreviewError] = useState("");
  const [discogsCanonicalPreview, setDiscogsCanonicalPreview] = useState(null);
  const [discogsCanonicalRenameLoading, setDiscogsCanonicalRenameLoading] = useState(false);
  const [discogsCanonicalRenameError, setDiscogsCanonicalRenameError] = useState("");
  const [discogsCanonicalRenameResult, setDiscogsCanonicalRenameResult] = useState(null);
  const [discogsPrimaryImageLoading, setDiscogsPrimaryImageLoading] = useState("");
  const [discogsPrimaryImageError, setDiscogsPrimaryImageError] = useState("");
  const [discogsPrimaryImageResult, setDiscogsPrimaryImageResult] = useState(null);
  const [discogsEnrichment, setDiscogsEnrichment] = useState(null);
  const [discogsEnrichmentLoading, setDiscogsEnrichmentLoading] = useState(false);
  const [discogsEnrichmentError, setDiscogsEnrichmentError] = useState("");
  const [discogsEnrichmentGenerated, setDiscogsEnrichmentGenerated] = useState(null);
  const [discogsEnrichmentActionLoading, setDiscogsEnrichmentActionLoading] = useState("");
  const [discogsLinkedArtistKeys, setDiscogsLinkedArtistKeys] = useState(() => new Set());
  const reviewLimit = 25;
  const artistTableRef = useRef(null);
  const relationPanelRef = useRef(null);
  const [relationPanelView, setRelationPanelView] = useState("all");

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset]);
  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function load({
    silent = false,
    nextOffset = offset,
    nextSearch = search,
    nextSort = sort,
    nextFavoriteOnly = favoriteOnly,
    nextMergeStatus = mergeStatus,
  } = {}) {
    if (!silent) setLoading(true);
    setPageError("");

    try {
      const data = await api.listArtists({
        search: nextSearch,
        limit,
        offset: nextOffset,
        sort: nextSort,
        favoriteOnly: nextFavoriteOnly,
        mergeStatus: nextMergeStatus,
      });
      setItems(data.items);
      setTotal(data.total);
      const deletedCount = await api.listArtists({ search: "", limit: 1, offset: 0, onlyDeleted: true });
      setDeletedTotal(deletedCount.total);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setPageError(msg);
      notify(msg, "danger");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function resetDuplicateWorkflowState() {
    setDuplicateCandidates(null);
    setDuplicatesError("");
    setDuplicatesLoading(false);
    setImpactOpen(false);
    setImpactLoading(false);
    setImpactError("");
    setImpactData(null);
    setMergeReason("");
    setMergeConfirmed(false);
    setMergeLoading(false);
    setMergeResult(null);
    setActiveReviewCandidateId(null);
  }

  function mergeArtistIntoClientState(updatedArtist) {
    if (!updatedArtist?.ar_artist_key) return;
    setSelectedArtist((current) => (
      current?.ar_artist_key === updatedArtist.ar_artist_key ? { ...current, ...updatedArtist } : current
    ));
    setRelations((current) => (
      current?.artist?.ar_artist_key === updatedArtist.ar_artist_key
        ? { ...current, artist: { ...current.artist, ...updatedArtist } }
        : current
    ));
    setItems((prev) => prev.map((item) => (
      item.ar_artist_key === updatedArtist.ar_artist_key ? { ...item, ...updatedArtist } : item
    )));
    setActive((current) => (
      current?.ar_artist_key === updatedArtist.ar_artist_key ? { ...current, ...updatedArtist } : current
    ));
    setDetailsArtist((current) => (
      current?.ar_artist_key === updatedArtist.ar_artist_key ? { ...current, ...updatedArtist } : current
    ));
  }

  function resetDiscogsWorkflowState() {
    setDiscogsResults(null);
    setDiscogsError("");
    setDiscogsLoading(false);
    setDiscogsDetail(null);
    setDiscogsDetailError("");
    setDiscogsDetailLoading(false);
    setDiscogsLinkError("");
    setDiscogsLinkResult(null);
    setDiscogsProposals(null);
    setDiscogsProposalsError("");
    setDiscogsProposalsLoading(false);
    setDiscogsNameQueue(null);
    setDiscogsNameQueueError("");
    setDiscogsNameQueueLoading(false);
    setDiscogsNameQueueGenerated(null);
    setDiscogsNameQueueActionLoading("");
    setDiscogsNameQueueStatusFilter("all");
    setDiscogsNameQueueTypeFilter("all");
    setDiscogsNameQueueSearch("");
    setDiscogsSpellingAddLoading("");
    setDiscogsSpellingAddResult(null);
    setDiscogsSpellingAddError("");
    setDiscogsCanonicalPreviewLoading("");
    setDiscogsCanonicalPreviewError("");
    setDiscogsCanonicalPreview(null);
    setDiscogsCanonicalRenameLoading(false);
    setDiscogsCanonicalRenameError("");
    setDiscogsCanonicalRenameResult(null);
    setDiscogsPrimaryImageLoading("");
    setDiscogsPrimaryImageError("");
    setDiscogsPrimaryImageResult(null);
    setDiscogsEnrichment(null);
    setDiscogsEnrichmentLoading(false);
    setDiscogsEnrichmentError("");
    setDiscogsEnrichmentGenerated(null);
  }

  async function loadRelations(row, { scrollToPanel = true } = {}) {
    if (!row?.ar_artist_key) {
      setSelectedArtist(null);
      setRelations(null);
      resetDuplicateWorkflowState();
      resetDiscogsWorkflowState();
      return;
    }

    if (selectedArtist?.ar_artist_key !== row.ar_artist_key) {
      resetDuplicateWorkflowState();
      resetDiscogsWorkflowState();
    }

    setSelectedArtist(row);
    setRelationsLoading(true);
    setRelationsError("");
    try {
      const data = await api.getArtistRelations(row.ar_artist_key);
      setRelations(data);
      if (data?.artist) {
        setSelectedArtist(data.artist);
        setItems((prev) => prev.map((item) => (
          item.ar_artist_key === data.artist.ar_artist_key ? { ...item, ...data.artist } : item
        )));
      }
      if (scrollToPanel) {
        window.requestAnimationFrame(() => {
          relationPanelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
          relationPanelRef.current?.focus?.({ preventScroll: true });
        });
      }
    } catch (e) {
      const msg = pickNiceMessage(e);
      setRelationsError(msg);
      notify(msg, "danger");
    } finally {
      setRelationsLoading(false);
    }
  }


  async function loadDiscogsSpellingProposals() {
    if (!relationArtist) return;
    setDiscogsProposalsLoading(true);
    setDiscogsProposalsError("");
    try {
      const data = await api.getDiscogsSpellingProposals(relationArtist.ar_artist_key);
      setDiscogsProposals(data);
    } catch (e) {
      setDiscogsProposalsError(pickNiceMessage(e));
    } finally {
      setDiscogsProposalsLoading(false);
    }
  }

  async function loadDiscogsNameQueue(overrides = {}) {
    if (!relationArtist) return;
    const filters = {
      status: overrides.status ?? discogsNameQueueStatusFilter,
      type: overrides.type ?? discogsNameQueueTypeFilter,
      q: overrides.q ?? discogsNameQueueSearch,
    };
    setDiscogsNameQueueLoading(true);
    setDiscogsNameQueueError("");
    try {
      const data = await api.listDiscogsNameProposals(relationArtist.ar_artist_key, filters);
      setDiscogsNameQueue(data);
    } catch (e) {
      setDiscogsNameQueueError(pickNiceMessage(e));
    } finally {
      setDiscogsNameQueueLoading(false);
    }
  }

  async function generateDiscogsNameQueue() {
    if (!relationArtist) return;
    setDiscogsNameQueueLoading(true);
    setDiscogsNameQueueError("");
    setDiscogsNameQueueGenerated(null);
    try {
      const data = await api.generateDiscogsNameProposals(relationArtist.ar_artist_key);
      setDiscogsNameQueue(data);
      setDiscogsNameQueueGenerated(data.generated ?? 0);
      notify("Discogs naamvoorstellen bijgewerkt", "success");
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsNameQueueError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsNameQueueLoading(false);
    }
  }

  async function updateDiscogsNameQueueStatus(proposal, status) {
    if (!relationArtist?.ar_artist_key || !proposal?.proposal_id) return;
    setDiscogsNameQueueActionLoading(`${status}-${proposal.proposal_id}`);
    setDiscogsNameQueueError("");
    try {
      const data = await api.updateDiscogsNameProposalStatus(relationArtist.ar_artist_key, proposal.proposal_id, { status });
      setDiscogsNameQueue(data.queue || data);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsNameQueueError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsNameQueueActionLoading("");
    }
  }

  async function applyDiscogsNameQueueProposalAsSpelling(proposal) {
    if (!relationArtist?.ar_artist_key || !proposal?.proposal_id) return;
    setDiscogsNameQueueActionLoading(`apply-${proposal.proposal_id}`);
    setDiscogsNameQueueError("");
    try {
      const data = await api.applyDiscogsNameProposalAsSpelling(relationArtist.ar_artist_key, proposal.proposal_id);
      setDiscogsNameQueue(data.queue || null);
      if (data.relations) setRelations(data.relations);
      notify(`Alternatieve spelling toegevoegd: ${proposal.proposal_name}`, "success");
      await loadRelations(relationArtist, { scrollToPanel: false });
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsNameQueueError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsNameQueueActionLoading("");
    }
  }


  async function addDiscogsProposalAsAlternativeSpelling(proposal) {
    if (!relationArtist?.ar_artist_key || !proposal?.proposed_name) return;
    setDiscogsSpellingAddLoading(discogsProposalKey(proposal));
    setDiscogsSpellingAddError("");
    setDiscogsSpellingAddResult(null);
    try {
      const data = await api.addDiscogsAlternativeSpelling(relationArtist.ar_artist_key, { proposedName: proposal.proposed_name });
      setDiscogsSpellingAddResult(data);
      notify(`Alternatieve spelling toegevoegd: ${proposal.proposed_name}`, "success");
      await Promise.all([
        loadDiscogsSpellingProposals(),
        loadRelations(relationArtist, { scrollToPanel: false }),
      ]);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsSpellingAddError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsSpellingAddLoading("");
    }
  }



  async function previewDiscogsCanonicalRename(proposal) {
    if (!relationArtist?.ar_artist_key || !proposal?.proposed_name) return;
    setDiscogsCanonicalPreviewLoading(discogsProposalKey(proposal));
    setDiscogsCanonicalPreviewError("");
    setDiscogsCanonicalPreview(null);
    setDiscogsCanonicalRenameError("");
    setDiscogsCanonicalRenameResult(null);
    try {
      const data = await api.previewDiscogsCanonicalRename(relationArtist.ar_artist_key, { proposedName: proposal.proposed_name });
      setDiscogsCanonicalPreview(data);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsCanonicalPreviewError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsCanonicalPreviewLoading("");
    }
  }

  async function executeDiscogsCanonicalRenameFromPreview() {
    if (!relationArtist?.ar_artist_key || !discogsCanonicalPreview?.proposed_canonical_name || discogsCanonicalPreview?.blocked) return;
    const proposed = discogsCanonicalPreview.proposed_canonical_name;
    const current = discogsCanonicalPreview.current_canonical_name;
    const ok = window.confirm(`Maak '${proposed}' canonical voor deze artiest? De oude canonical naam '${current}' blijft behouden als alternatieve spelling.`);
    if (!ok) return;

    setDiscogsCanonicalRenameLoading(true);
    setDiscogsCanonicalRenameError("");
    setDiscogsCanonicalRenameResult(null);
    try {
      const data = await api.executeDiscogsCanonicalRename(relationArtist.ar_artist_key, { proposedName: proposed });
      setDiscogsCanonicalRenameResult(data);
      notify(`Canonical artiestnaam aangepast naar: ${data.new_canonical_name}`, "success");
      const updatedArtist = { ...relationArtist, ar_artist_name: data.new_canonical_name };
      await Promise.all([
        load({ silent: true }),
        loadRelations(updatedArtist, { scrollToPanel: false }),
      ]);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsCanonicalRenameError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsCanonicalRenameLoading(false);
    }
  }


  async function loadDiscogsConfig() {
    try {
      const data = await api.getDiscogsConfig();
      setDiscogsConfig(data);
      return data;
    } catch (e) {
      setDiscogsConfig({ enabled: false, configured: false, disabledReason: pickNiceMessage(e) });
      return null;
    }
  }

  async function searchDiscogsForSelectedArtist() {
    if (!relationArtist?.ar_artist_key) return;
    setDiscogsLoading(true);
    setDiscogsError("");
    setDiscogsResults(null);
    setDiscogsDetail(null);
    try {
      const data = await api.searchArtistDiscogs(relationArtist.ar_artist_key, { q: relationArtist.ar_artist_name, limit: 10 });
      setDiscogsResults(data);
      setDiscogsConfig(data.config || discogsConfig);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsError(msg);
      setDiscogsConfig(e?.payload?.config || discogsConfig);
    } finally {
      setDiscogsLoading(false);
    }
  }

  async function openDiscogsDetail(discogsArtistId) {
    setDiscogsDetailLoading(true);
    setDiscogsDetailError("");
    try {
      const data = await api.getDiscogsArtistDetail(discogsArtistId);
      setDiscogsDetail(data.detail);
      setDiscogsConfig(data.config || discogsConfig);
    } catch (e) {
      setDiscogsDetailError(pickNiceMessage(e));
    } finally {
      setDiscogsDetailLoading(false);
    }
  }

  async function linkDiscogsDetailToArtist() {
    if (!relationArtist?.ar_artist_key || !discogsDetail?.discogs_artist_id) return;
    setDiscogsLinkLoading(true);
    setDiscogsLinkError("");
    setDiscogsLinkResult(null);
    try {
      const data = await api.linkArtistDiscogs(relationArtist.ar_artist_key, { discogsArtistId: discogsDetail.discogs_artist_id });
      setDiscogsLinkResult(data);
      setDiscogsProposals(null);
      setDiscogsNameQueue(null);
      setDiscogsNameQueueGenerated(null);
      setDiscogsEnrichment(null);
      setDiscogsEnrichmentGenerated(null);
      const linkedArtist = {
        ...relationArtist,
        has_discogs_link: true,
        discogs_external_id: data.reference?.external_id || String(discogsDetail.discogs_artist_id),
        discogs_external_name: data.reference?.external_name || discogsDetail.discogs_name || "",
        discogs_external_url: data.reference?.external_url || discogsDetail.discogs_url || "",
        discogs_synced_at: data.reference?.synced_at || data.reference?.updated_at || null,
      };
      setDiscogsLinkedArtistKeys((prev) => {
        const next = new Set(prev);
        next.add(Number(linkedArtist.ar_artist_key));
        return next;
      });
      setSelectedArtist(linkedArtist);
      setItems((prev) => prev.map((item) => (
        Number(item.ar_artist_key) === Number(linkedArtist.ar_artist_key) ? { ...item, ...linkedArtist, has_discogs_link: true } : item
      )));
      notify(`Discogs artist gekoppeld: #${discogsDetail.discogs_artist_id} ${discogsDetail.discogs_name}. Gebruik de naamvoorstellen reviewqueue om Discogs-namen te beoordelen.`, "success");
      await Promise.all([
        load({ silent: true }),
        loadRelations(linkedArtist, { scrollToPanel: false }),
      ]);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsLinkError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsLinkLoading(false);
    }
  }

  async function setPrimaryDiscogsImage(image) {
    if (!relationArtist?.ar_artist_key || !image?.image_id) return;
    setDiscogsPrimaryImageLoading(String(image.image_id));
    setDiscogsPrimaryImageError("");
    setDiscogsPrimaryImageResult(null);
    try {
      const data = await api.setPrimaryDiscogsImage(relationArtist.ar_artist_key, image.image_id);
      setDiscogsPrimaryImageResult(data);
      const primary = data.primaryImage || data.selected || null;
      const images = (data.images || []).map((candidate) => ({
        ...candidate,
        is_primary: primary ? Number(candidate.image_id) === Number(primary.image_id) : Boolean(candidate.is_primary),
      }));

      setRelations((current) => current ? {
        ...current,
        discogsImages: images,
        primaryDiscogsImage: primary,
      } : current);

      const artistPatch = primary ? {
        primary_image_id: primary.image_id,
        primary_image_url: primary.external_image_url,
      } : {
        primary_image_id: null,
        primary_image_url: null,
      };

      setSelectedArtist((current) => current && Number(current.ar_artist_key) === Number(relationArtist.ar_artist_key)
        ? { ...current, ...artistPatch }
        : current);
      setItems((prev) => prev.map((item) => Number(item.ar_artist_key) === Number(relationArtist.ar_artist_key)
        ? { ...item, ...artistPatch }
        : item));

      await loadRelations({ ...relationArtist, ...artistPatch }, { scrollToPanel: false });
      notify("Primaire profielfoto bijgewerkt", "success");
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsPrimaryImageError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsPrimaryImageLoading("");
    }
  }

  async function loadTrash() {
    setTrashLoading(true);
    setTrashError("");
    try {
      const data = await api.listArtists({ search: "", limit: 100, offset: 0, onlyDeleted: true });
      setDeletedItems(data.items);
      setDeletedTotal(data.total);
      return data;
    } catch (e) {
      const msg = pickNiceMessage(e);
      setTrashError(msg);
      notify(msg, "danger");
      return { items: [], total: 0 };
    } finally {
      setTrashLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  useEffect(() => {
    loadDiscogsConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, []);

  async function onSearchSubmit(e) {
    e.preventDefault();
    setOffset(0);
    await load({ nextOffset: 0 });
  }

  async function onSortChange(e) {
    const nextSort = e.target.value;
    setSort(nextSort);
    setOffset(0);
    await load({ nextOffset: 0, nextSort });
  }

  async function onFavoriteOnlyChange(e) {
    const nextFavoriteOnly = e.target.checked;
    setFavoriteOnly(nextFavoriteOnly);
    setOffset(0);
    await load({ nextOffset: 0, nextFavoriteOnly });
  }

  async function onMergeStatusChange(e) {
    const nextMergeStatus = e.target.value;
    setMergeStatus(nextMergeStatus);
    setOffset(0);
    await load({ nextOffset: 0, nextMergeStatus });
  }

  async function clearFilters() {
    setSearch("");
    setSort("favorite_first");
    setFavoriteOnly(false);
    setMergeStatus("active");
    setOffset(0);
    await load({ nextOffset: 0, nextSearch: "", nextSort: "favorite_first", nextFavoriteOnly: false, nextMergeStatus: "active" });
  }

  function openCreate() {
    setActive(null);
    setFormMode("create");
    setFormOpen(true);
  }

  function openEdit(row) {
    setActive(row);
    setFormMode("edit");
    setFormOpen(true);
  }

  function openDelete(row) {
    setActive(row);
    setConfirmError("");
    setConfirmOpen(true);
  }

  function openDetails(row) {
    setDetailsArtist(row);
    setDetailsOpen(true);
  }

  async function saveArtist(payload) {
    try {
      if (formMode === "edit" && active?.ar_artist_key) {
        await api.updateArtist(active.ar_artist_key, payload);
        notify("Artiest bijgewerkt", "success");
      } else {
        await api.createArtist(payload);
        notify("Artiest toegevoegd", "success");
      }
      await load({ silent: true });
    } catch (e) {
      notify(pickNiceMessage(e), "danger");
      throw e;
    }
  }

  async function toggleFavorite(row, e) {
    e?.stopPropagation?.();
    try {
      const nextFavorite = !row.ar_is_favorite;
      await api.setArtistFavorite(row.ar_artist_key, nextFavorite);
      notify(nextFavorite ? `Favoriet gemarkeerd: ${row.ar_artist_name}` : `Favoriet verwijderd: ${row.ar_artist_name}`, "success");
      await load({ silent: true });
      if (selectedArtist?.ar_artist_key === row.ar_artist_key) {
        await loadRelations({ ...row, ar_is_favorite: nextFavorite }, { scrollToPanel: false });
      }
    } catch (e) {
      notify(pickNiceMessage(e), "danger");
    }
  }


  async function loadDuplicateCandidates() {
    if (!relationArtist?.ar_artist_key) return;
    setDuplicatesLoading(true);
    setDuplicatesError("");
    try {
      const data = await api.findDuplicateCandidates(relationArtist.ar_artist_key, { limit: 20, minScore: 0.72 });
      setDuplicateCandidates(data);
      if (!data.items?.length) {
        notify(`Geen mogelijke dubbelen gevonden voor ${relationArtist.ar_artist_name}`, "info");
      }
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDuplicatesError(msg);
      notify(msg, "danger");
    } finally {
      setDuplicatesLoading(false);
    }
  }

  async function openMergeImpact({ redundantArtistKey, replacementArtistKey, duplicateCandidateId = null }) {
    setActiveReviewCandidateId(duplicateCandidateId);
    setImpactOpen(true);
    setImpactLoading(true);
    setImpactError("");
    setImpactData(null);
    setMergeReason("");
    setMergeConfirmed(false);
    setMergeResult(null);
    try {
      const data = await api.getMergeImpact({ redundantArtistKey, replacementArtistKey });
      setImpactData(data);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setImpactError(msg);
      notify(msg, "danger");
    } finally {
      setImpactLoading(false);
    }
  }

  async function executeMergeFromImpact() {
    if (!impactData?.redundantArtist?.ar_artist_key || !impactData?.replacementArtist?.ar_artist_key) return;
    setMergeLoading(true);
    setImpactError("");
    try {
      const result = await api.executeArtistMerge({
        redundantArtistKey: impactData.redundantArtist.ar_artist_key,
        replacementArtistKey: impactData.replacementArtist.ar_artist_key,
        reason: mergeReason,
        duplicateCandidateId: activeReviewCandidateId,
      });
      setMergeResult(result);
      notify(`Merge uitgevoerd: #${result.redundantArtist?.ar_artist_key} ${result.redundantArtist?.ar_artist_name} → #${result.replacementArtist?.ar_artist_key} ${result.replacementArtist?.ar_artist_name}`, "success");
      await load({ silent: true, nextOffset: 0 });
      if (selectedArtist?.ar_artist_key === result.redundantArtist?.ar_artist_key) {
        setSelectedArtist(result.replacementArtist);
        await loadRelations(result.replacementArtist, { scrollToPanel: false });
      } else if (selectedArtist?.ar_artist_key === result.replacementArtist?.ar_artist_key) {
        await loadRelations(selectedArtist, { scrollToPanel: false });
      }
      setDuplicateCandidates(null);
      if (reviewQueueOpen) await loadReviewQueue({ silent: true });
    } catch (e) {
      const msg = pickNiceMessage(e);
      setImpactError(msg);
      notify(msg, "danger");
    } finally {
      setMergeLoading(false);
    }
  }


  async function loadReviewQueue({ silent = false, nextOffset = reviewOffset, nextStatus = reviewStatus, nextSearch = reviewSearch, nextMinScore = reviewMinScore } = {}) {
    if (!silent) setReviewLoading(true);
    setReviewError("");
    try {
      const data = await api.listDuplicateReviewCandidates({
        status: nextStatus,
        search: nextSearch,
        minScore: nextMinScore,
        limit: reviewLimit,
        offset: nextOffset,
      });
      setReviewCandidates(data.items || []);
      setReviewTotal(data.total || 0);
      setReviewOffset(nextOffset);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setReviewError(msg);
      notify(msg, "danger");
    } finally {
      if (!silent) setReviewLoading(false);
    }
  }

  async function openReviewQueue() {
    setReviewQueueOpen(true);
    await loadReviewQueue({ nextOffset: 0 });
  }

  async function submitReviewFilters(e) {
    e?.preventDefault?.();
    setReviewOffset(0);
    await loadReviewQueue({ nextOffset: 0 });
  }

  async function updateReviewCandidate(candidate, status, note = "") {
    try {
      await api.updateDuplicateCandidateStatus(candidate.candidate_id, { status, note });
      notify(`Review candidate #${candidate.candidate_id} bijgewerkt naar ${status}`, "success");
      await loadReviewQueue({ silent: true });
    } catch (e) {
      notify(pickNiceMessage(e), "danger");
    }
  }

  function openReviewCandidateImpact(candidate, direction) {
    const makeBLeading = direction === "b_leading";
    setReviewQueueOpen(false);
    openMergeImpact({
      redundantArtistKey: makeBLeading ? candidate.artist_key_a : candidate.artist_key_b,
      replacementArtistKey: makeBLeading ? candidate.artist_key_b : candidate.artist_key_a,
      duplicateCandidateId: candidate.candidate_id,
    });
  }

  async function restore(id, name) {
    try {
      await api.restoreArtist(id);
      notify(`Hersteld: ${name}`, "success");
      await load({ silent: true });
      if (trashOpen) await loadTrash();
    } catch (e) {
      notify(pickNiceMessage(e), "danger");
    }
  }


  async function loadDiscogsEnrichmentProposals() {
    if (!relationArtist?.ar_artist_key) return;
    setDiscogsEnrichmentLoading(true);
    setDiscogsEnrichmentError("");
    try {
      const data = await api.getDiscogsEnrichmentProposals(relationArtist.ar_artist_key);
      setDiscogsEnrichment(data);
      setDiscogsEnrichmentGenerated(null);
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsEnrichmentError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsEnrichmentLoading(false);
    }
  }

  async function generateDiscogsEnrichmentProposals() {
    if (!relationArtist?.ar_artist_key) return;
    setDiscogsEnrichmentLoading(true);
    setDiscogsEnrichmentError("");
    try {
      const data = await api.generateDiscogsEnrichmentProposals(relationArtist.ar_artist_key);
      setDiscogsEnrichment(data);
      setDiscogsEnrichmentGenerated(data.generated ?? 0);
      notify(`Discogs verrijkingsvoorstellen bijgewerkt: ${data.summary?.total || 0} voorstel(len)`, "success");
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsEnrichmentError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsEnrichmentLoading(false);
    }
  }



  async function applyDiscogsEnrichmentProposal(proposal) {
    if (!relationArtist?.ar_artist_key || !proposal?.proposal_id) return;
    const key = `apply-${proposal.proposal_id}`;
    const confirmOverwrite = proposal.status === "conflict"
      ? window.confirm("De lokale waarde verschilt van het Discogs-voorstel. Wil je de lokale waarde vervangen?")
      : false;
    if (proposal.status === "conflict" && !confirmOverwrite) return;
    setDiscogsEnrichmentActionLoading(key);
    setDiscogsEnrichmentError("");
    try {
      const data = await api.applyDiscogsEnrichmentProposal(relationArtist.ar_artist_key, proposal.proposal_id, { confirmOverwrite });
      const updatedArtist = data.artist || data.result?.artist || null;
      if (updatedArtist) mergeArtistIntoClientState(updatedArtist);
      setDiscogsEnrichment(data.enrichment || data);
      const target = enrichmentTargetLabel(proposal);
      const targetKey = `${proposal?.target_table || ""}.${proposal?.target_field || ""}`;
      const externalOnly = targetKey === "artist_external_profile.profile_text";
      notify(
        externalOnly
          ? `${target} opgeslagen als externe profieltekst; de lokale artist-tabel wijzigt hierbij niet.`
          : `Verrijkingsvoorstel toegepast op artist: ${target}`,
        "success"
      );
      const relationSeed = updatedArtist ? { ...relationArtist, ...updatedArtist } : relationArtist;
      await Promise.all([
        loadRelations(relationSeed, { scrollToPanel: false }),
        load({ silent: true }),
      ]);
    } catch (e) {
      if (e?.payload?.code === "CONFIRM_OVERWRITE_REQUIRED") {
        notify("Lokale waarde verschilt. Kies opnieuw en bevestig overschrijven om te vervangen.", "warning");
      } else {
        const msg = pickNiceMessage(e);
        setDiscogsEnrichmentError(msg);
        notify(msg, "danger");
      }
    } finally {
      setDiscogsEnrichmentActionLoading("");
    }
  }

  async function updateDiscogsEnrichmentProposalStatus(proposal, status) {
    if (!relationArtist?.ar_artist_key || !proposal?.proposal_id) return;
    const key = `${status}-${proposal.proposal_id}`;
    setDiscogsEnrichmentActionLoading(key);
    setDiscogsEnrichmentError("");
    try {
      const data = await api.updateDiscogsEnrichmentProposalStatus(relationArtist.ar_artist_key, proposal.proposal_id, { status });
      setDiscogsEnrichment((current) => current ? { ...current, proposals: data.proposals || current.proposals } : current);
      await loadDiscogsEnrichmentProposals();
      notify(status === "ignored" ? "Voorstel genegeerd" : "Voorstel gemarkeerd voor later beoordelen", "success");
    } catch (e) {
      const msg = pickNiceMessage(e);
      setDiscogsEnrichmentError(msg);
      notify(msg, "danger");
    } finally {
      setDiscogsEnrichmentActionLoading("");
    }
  }

  async function hardDelete(id, name) {
    try {
      await api.hardDeleteArtist(id);
      notify(`Definitief verwijderd: ${name}`, "success");
      await load({ silent: true });
      if (trashOpen) {
        const data = await loadTrash();
        if ((data?.total ?? 0) === 0) setTrashOpen(false);
      }
    } catch (e) {
      if (e?.payload?.blockedBy === "file_details") {
        notify(`${name} kan niet definitief worden verwijderd omdat de artiest nog in file_details voorkomt. Cannot be deleted forever because it is referenced in file details.`, "warning");
        return;
      }
      if (e?.payload?.blockedBy === "other_reference") {
        notify(`${name} kan niet definitief worden verwijderd omdat er nog andere verwijzingen zijn.`, "warning");
        return;
      }
      notify(pickNiceMessage(e), "danger");
    }
  }

  async function deleteArtistSoft() {
    if (!active?.ar_artist_key) return;
    setDeleting(true);
    setConfirmError("");
    setPageError("");

    try {
      await api.deleteArtist(active.ar_artist_key);
      const deletedId = active.ar_artist_key;
      const deletedName = active.ar_artist_name;
      setLastDeleted({ id: deletedId, name: deletedName });
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setLastDeleted(null), 7000);
      notify(`Naar prullenbak verplaatst: ${deletedName}`, "warning", {
        label: "Ongedaan maken",
        onClick: async () => {
          await restore(deletedId, deletedName);
          setLastDeleted(null);
          if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        }
      });
      setConfirmOpen(false);
      const newOffset = offset >= limit && items.length === 1 ? offset - limit : offset;
      setOffset(newOffset);
      await load({ silent: true, nextOffset: newOffset });
      if (selectedArtist?.ar_artist_key === deletedId) {
        setSelectedArtist(null);
        setRelations(null);
      }
    } catch (e) {
      const msg = pickNiceMessage(e);
      setConfirmError(msg);
      notify(msg, "danger");
    } finally {
      setDeleting(false);
    }
  }

  function scrollToArtistList() {
    resetDuplicateWorkflowState();
    artistTableRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    const selectedRow = artistTableRef.current?.querySelector?.(".artist-selected-row");
    selectedRow?.focus?.({ preventScroll: true });
  }

  async function openCanonicalArtist(artistKey) {
    if (!artistKey) return;
    try {
      const artist = await api.getArtist(artistKey);
      setMergeStatus("include_merged");
      await load({ silent: true, nextOffset: 0, nextMergeStatus: "include_merged" });
      await loadRelations(artist, { scrollToPanel: true });
    } catch (e) {
      notify(pickNiceMessage(e), "danger");
    }
  }

  function mergeHistoryAffectedCount(historyRow) {
    const counts = historyRow?.affected_counts || {};
    return Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function formatAffectedKey(key = "") {
    const labels = {
      file_details: "File details",
      artiesten_spelling_updated: "Spellingen bijgewerkt",
      artiesten_spelling_deduplicated: "Spellingen ontdubbeld",
      hitlijsten: "Hitlijsten",
      staging_hitlijsten: "Staging hitlijsten",
      import_scan_items: "Import scan items",
      file_details_version_group_validations_reset: "Validaties gereset",
      replacement_favorite_adopted: "Favoriet overgenomen",
    };
    return labels[key] || key.replaceAll("_", " ");
  }

  function affectedCountEntries(counts = {}) {
    return Object.entries(counts || {})
      .filter(([, value]) => Number(value || 0) !== 0)
      .map(([key, value]) => ({ key, label: formatAffectedKey(key), value: Number(value || 0) }));
  }

  const relationArtist = relations?.artist || selectedArtist;
  const relationPrimaryImage = relations?.primaryDiscogsImage || relations?.discogsImages?.find?.((image) => image.is_primary) || null;
  const relationDiscogsImages = relations?.discogsImages || [];
  const relationExternalProfiles = relations?.externalProfiles || [];
  const primaryExternalProfile = relations?.primaryExternalProfile || relationExternalProfiles[0] || null;
  const showRelationPanelSection = (section) => relationPanelView === "all" || relationPanelView === section;
  const isDiscogsLinkedArtist = (artist) => Boolean(artist?.has_discogs_link) || discogsLinkedArtistKeys.has(Number(artist?.ar_artist_key));
  const discogsConfigured = discogsConfig?.enabled === true;
  const discogsDisabledReason = discogsConfig?.disabledReason || "Discogs is niet geconfigureerd. Vul DISCOGS_USER_TOKEN en DISCOGS_USER_AGENT in.";
  const RootTag = embeddedInShell ? 'div' : Container;
  const rootProps = embeddedInShell ? {} : { fluid: shellMode };
  const rootSpacingClass = embeddedInShell ? '' : 'py-4';

  return (
    <RootTag {...rootProps} className={`${rootSpacingClass} artist-app-root ${shellMode ? "artist-shell-contained" : "artist-standalone"} ${embeddedInShell ? "artist-shell-embedded" : ""}`.trim()} data-shell-mode={shellMode ? "true" : "false"} data-shell-embedded={embeddedInShell ? "true" : "false"} data-theme={activeTheme}>
      <div className="artist-page-surface">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3 artist-shell-meta-row">
          <div>
            <div className="text-uppercase text-muted small fw-semibold">Artiesten</div>
            <div className="small text-muted">{embeddedInShell ? "Shell-hosted module actief" : shellMode ? "Shell-contained mode actief" : "Standalone mode actief"}</div>
          </div>
          <div className="artist-theme-chip">Theme: {activeTheme} · {themeSource}</div>
        </div>

        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
          <Toast bg={toast.bg} show={toast.show} onClose={() => setToast((t) => ({ ...t, show: false, action: null }))} delay={toast.action ? 7000 : 3500} autohide={!toast.action}>
            <Toast.Body className="text-white d-flex align-items-center justify-content-between gap-3">
              <span>{toast.message}</span>
              {toast.action ? (
                <Button size="sm" variant="light" onClick={() => { toast.action.onClick?.(); setToast((t) => ({ ...t, show: false, action: null })); }}>
                  {toast.action.label}
                </Button>
              ) : null}
            </Toast.Body>
          </Toast>
        </ToastContainer>

        <div className="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
          <h1 className="h3 mb-0">Artiesten <Badge bg="secondary">{total}</Badge></h1>
          <div className="d-flex gap-2 flex-wrap">
            <Button variant="outline-primary" onClick={openReviewQueue}>
              Duplicate reviewqueue
            </Button>
            <Button variant="outline-secondary" onClick={async () => { setTrashOpen(true); await loadTrash(); }}>
              Prullenbak <Badge bg={deletedTotal > 0 ? "danger" : "secondary"} className="ms-1">{deletedTotal}</Badge>
            </Button>
            <Button onClick={openCreate}>+ Artiest toevoegen</Button>
          </div>
        </div>

        <Form onSubmit={onSearchSubmit} className="mb-3 artist-toolbar">
          <InputGroup className="artist-toolbar-search">
            <Form.Control value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek op artiestnaam..." />
            <Button variant="outline-secondary" type="submit">Zoeken</Button>
          </InputGroup>
          <Form.Select value={sort} onChange={onSortChange} className="artist-toolbar-sort" aria-label="Sortering">
            <option value="favorite_first">Favorieten → gewicht → naam</option>
            <option value="weight_desc">Gewicht hoog-laag</option>
            <option value="weight_asc">Gewicht laag-hoog</option>
            <option value="name_asc">Naam A-Z</option>
            <option value="name_desc">Naam Z-A</option>
          </Form.Select>
          <Form.Select value={mergeStatus} onChange={onMergeStatusChange} className="artist-toolbar-merge-status" aria-label="Merge status filter">
            <option value="active">Actieve artiesten</option>
            <option value="include_merged">Inclusief samengevoegde artiesten</option>
            <option value="merged_only">Alleen samengevoegde artiesten</option>
          </Form.Select>
          <Form.Check
            className="artist-toolbar-favorite"
            type="switch"
            id="artist-favorite-only"
            checked={favoriteOnly}
            onChange={onFavoriteOnlyChange}
            label="Alleen favorieten"
          />
          <Button variant="outline-secondary" type="button" onClick={clearFilters}>Wissen</Button>
        </Form>

        {pageError && <Alert variant="danger">{pageError}</Alert>}
        {lastDeleted ? <Alert variant="warning">Laatste verwijdering: <strong>{lastDeleted.name}</strong>. Gebruik de toast om ongedaan te maken.</Alert> : null}

        <div className="border rounded artist-table-wrap" ref={artistTableRef}>
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th style={{ width: 72 }} className="text-center">Profiel</th>
                <th style={{ width: 64 }}>Fav</th>
                <th style={{ width: 80 }}>ID</th>
                <th>Naam</th>
                <th style={{ width: 90 }}>Discogs</th>
                <th style={{ width: 110 }}>Type</th>
                <th style={{ width: 120 }}>Titels</th>
                <th style={{ width: 120 }}>Versies</th>
                <th style={{ width: 120 }}>Hitlijsten</th>
                <th style={{ width: 120 }}>Spellingen</th>
                <th style={{ width: 140 }}>Geboren</th>
                <th style={{ width: 180 }} className="text-end">Acties</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="py-4 text-center"><Spinner animation="border" size="sm" className="me-2" />Laden...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={12} className="py-4 text-center text-muted">Geen artiesten gevonden</td></tr>
              ) : items.map((r) => {
                const isMerged = Boolean(r.ar_merged_into_artist_key || r.ar_merged_at);
                return (
                <tr key={r.ar_artist_key} tabIndex={selectedArtist?.ar_artist_key === r.ar_artist_key ? 0 : -1} className={`${selectedArtist?.ar_artist_key === r.ar_artist_key ? "artist-selected-row" : ""} ${isMerged ? "artist-merged-row" : ""}`.trim()} onClick={() => loadRelations(r)}>
                  <td className="artist-list-identity-cell">
                    <ArtistListIdentityVisual artist={r} />
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant={r.ar_is_favorite ? "warning" : "outline-secondary"}
                      className="artist-favorite-button"
                      title={r.ar_is_favorite ? "Verwijder uit favorieten" : "Markeer als favoriet"}
                      aria-label={r.ar_is_favorite ? "Verwijder uit favorieten" : "Markeer als favoriet"}
                      onClick={(e) => toggleFavorite(r, e)}
                    >
                      <i className={r.ar_is_favorite ? "bi bi-star-fill" : "bi bi-star"} aria-hidden="true"></i>
                    </Button>
                  </td>
                  <td>{r.ar_artist_key}</td>
                  <td className="fw-semibold">
                    <Button variant="link" className="p-0 fw-semibold text-decoration-none" onClick={(e) => { e.stopPropagation(); openDetails(r); }}>
                      {r.ar_artist_name}
                    </Button>
                    {isMerged ? (
                      <div className="small mt-1">
                        <Badge bg="warning" text="dark">Samengevoegd</Badge>
                        <span className="text-muted ms-2">naar {r.ar_merged_into_artist_name || `#${r.ar_merged_into_artist_key}`}</span>
                      </div>
                    ) : null}
                  </td>
                  <td className="text-center"><DiscogsLinkedIcon artist={{ ...r, has_discogs_link: isDiscogsLinkedArtist(r) }} /></td>
                  <td><Badge bg={r.ar_artist_type === "unknown" ? "secondary" : "light"} text={r.ar_artist_type === "unknown" ? undefined : "dark"}>{artistTypeLabel(r.ar_artist_type)}</Badge></td>
                  <td><Badge bg="info">{r.artist_weight ?? 0}</Badge></td>
                  <td>{r.version_count ?? 0}</td>
                  <td>{r.hitlijst_count ?? 0}</td>
                  <td>{r.spelling_count ?? 0}</td>
                  <td>{fmtDate(r.ar_artist_dateofbirth) || <span className="text-muted">—</span>}</td>
                  <td className="text-end" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEdit(r)} disabled={isMerged}>Edit</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => openDelete(r)} disabled={isMerged}>Trash</Button>
                  </td>
                </tr>
              );})}
            </tbody>
          </Table>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-3 gap-2 flex-wrap">
          <div className="text-muted">Pagina {page} / {maxPage}</div>
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" disabled={offset === 0 || loading} onClick={() => setOffset(Math.max(0, offset - limit))}>Vorige</Button>
            <Button variant="outline-secondary" disabled={offset + limit >= total || loading} onClick={() => setOffset(offset + limit)}>Volgende</Button>
          </div>
        </div>

        <section ref={relationPanelRef} tabIndex={-1} className={`artist-relation-panel mt-3 ${relationArtist ? "artist-relation-panel-loaded" : ""}`} aria-label="Artiest relatie-inzicht">
          <div className="artist-relation-header">
            <div className="d-flex align-items-center gap-3">
              {relationArtist ? <DiscogsProfileImage image={relationPrimaryImage} size="small" /> : null}
              <div>
                <div className="text-uppercase text-muted small fw-semibold">Relatie-inzicht</div>
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <h2 className="h5 mb-0">{relationArtist ? relationArtist.ar_artist_name : "Selecteer een artiest"}</h2>
                  {relationArtist ? (
                    <DeceasedStatusBadge
                      passingDate={relationArtist.ar_artist_passing}
                      testId="artist-relation-deceased-indicator"
                    />
                  ) : null}
                </div>
              </div>
            </div>
            {relationArtist ? (
              <div className="d-flex gap-2 flex-wrap align-items-center justify-content-end">
                <Badge bg={relationArtist.ar_is_favorite ? "warning" : "secondary"}>{relationArtist.ar_is_favorite ? "Favoriet" : "Geen favoriet"}</Badge>
                {isDiscogsLinkedArtist(relationArtist) ? <Badge bg="success"><i className="bi bi-link me-1" aria-hidden="true"></i>Discogs gekoppeld</Badge> : null}
                <Badge bg={relationArtist.ar_artist_type === "unknown" ? "secondary" : "light"} text={relationArtist.ar_artist_type === "unknown" ? undefined : "dark"}>Type: {artistTypeLabel(relationArtist.ar_artist_type)}</Badge>
                <Badge bg="info">{countLabel(relationArtist.artist_weight, "unieke titel", "unieke titels")}</Badge>
                <Badge bg="secondary">{countLabel(relationArtist.version_count, "versie", "versies")}</Badge>
                <Badge bg="secondary">{countLabel(relationArtist.hitlijst_count, "hitlijst", "hitlijsten")}</Badge>
                <Button size="sm" variant="outline-secondary" onClick={scrollToArtistList}>Terug naar artiestenlijst</Button>
              </div>
            ) : null}
          </div>

          {relationArtist ? (
            <div className="artist-relation-section-nav" aria-label="Detailpanelen activeren">
              <Button size="sm" variant={relationPanelView === "all" ? "primary" : "outline-secondary"} onClick={() => setRelationPanelView("all")}>Alles</Button>
              <Button size="sm" variant={relationPanelView === "relations" ? "primary" : "outline-secondary"} onClick={() => setRelationPanelView("relations")}>Relaties</Button>
              <Button size="sm" variant={relationPanelView === "discogs" ? "primary" : "outline-secondary"} onClick={() => setRelationPanelView("discogs")}>Discogs</Button>
              <Button size="sm" variant={relationPanelView === "duplicates" ? "primary" : "outline-secondary"} onClick={() => setRelationPanelView("duplicates")}>Ontdubbelen</Button>
            </div>
          ) : null}

          {relationArtist?.ar_merged_into_artist_key ? (
            <Alert variant="warning" className="mt-3 mb-0 artist-merged-alert">
              <div className="fw-semibold">Deze artiest is samengevoegd.</div>
              <div>
                Leidende artiest: {relationArtist.ar_merged_into_artist_name || `#${relationArtist.ar_merged_into_artist_key}`}
                <Button
                  size="sm"
                  variant="outline-dark"
                  className="ms-2"
                  onClick={() => openCanonicalArtist(relationArtist.ar_merged_into_artist_key)}
                >
                  Open leidende artiest
                </Button>
              </div>
            </Alert>
          ) : null}

          {!relationArtist ? (
            <EmptyState>Klik op een artiestregel om gekoppelde songs, spellingen en hitlijsten te bekijken.</EmptyState>
          ) : relationsLoading ? (
            <div className="py-3 text-muted"><Spinner animation="border" size="sm" className="me-2" />Relaties laden...</div>
          ) : relationsError ? (
            <Alert variant="danger" className="mb-0">{relationsError}</Alert>
          ) : (
            <>
            <div className="artist-relation-grid">
              <div className={`artist-relation-card ${showRelationPanelSection("relations") ? "" : "d-none"}`}>
                <h3 className="h6">File details</h3>
                {!relations?.fileDetails?.length ? <EmptyState>Geen gekoppelde file_details gevonden.</EmptyState> : (
                  <div className="artist-relation-table-scroll">
                    <Table size="sm" className="mb-0">
                      <thead><tr><th>Titel</th><th>Hitlijst</th><th>Actie</th><th>Jaar</th></tr></thead>
                      <tbody>
                        {relations.fileDetails.map((row) => (
                          <tr key={row.fd_key}>
                            <td title={row.fd_file_name || ""}>{row.fd_tag_title}</td>
                            <td>{row.fd_hitlijst || "—"}</td>
                            <td>{row.fd_action || "—"}</td>
                            <td>{row.fd_year_song_version || row.fd_year_song_publish || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <div className={`artist-relation-card ${showRelationPanelSection("relations") ? "" : "d-none"}`}>
                <h3 className="h6">Artiesten spelling</h3>
                {!relations?.spellings?.length ? <EmptyState>Geen alternatieve spellingen gevonden.</EmptyState> : (
                  <div className="artist-relation-table-scroll">
                    <Table size="sm" className="mb-0">
                      <thead><tr><th>Alternatieve spelling</th></tr></thead>
                      <tbody>
                        {relations.spellings.map((row) => (
                          <tr key={row.as_alternatieve_spelling}><td>{row.as_alternatieve_spelling}</td></tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <div className={`artist-relation-card ${showRelationPanelSection("relations") ? "" : "d-none"}`}>
                <h3 className="h6">Hitlijsten</h3>
                {!relations?.hitlijsten?.length ? <EmptyState>Geen hitlijsten gevonden.</EmptyState> : (
                  <div className="artist-relation-table-scroll">
                    <Table size="sm" className="mb-0">
                      <thead><tr><th>Hitlijst</th><th className="text-end">Titels</th><th className="text-end">Versies</th></tr></thead>
                      <tbody>
                        {relations.hitlijsten.map((row) => (
                          <tr key={row.fd_hitlijst}>
                            <td>{row.fd_hitlijst}</td>
                            <td className="text-end">{row.song_count}</td>
                            <td className="text-end">{row.version_count ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <div className={`artist-relation-card artist-merge-history-card ${showRelationPanelSection("relations") ? "" : "d-none"}`}>
                <h3 className="h6">Mergehistorie</h3>
                {!relations?.mergeHistory?.length ? <EmptyState>Geen mergehistorie gevonden voor deze artiest.</EmptyState> : (
                  <div className="artist-relation-table-scroll artist-merge-history-table-wrap">
                    <Table size="sm" className="mb-0 artist-merge-history-table">
                      <thead><tr><th>Merge</th><th>Datum</th><th>Richting</th><th>Artist keys</th><th>Impact</th></tr></thead>
                      <tbody>
                        {relations.mergeHistory.map((row) => {
                          const wasRedundant = Number(row.redundant_artist_key) === Number(relationArtist.ar_artist_key);
                          const affectedEntries = affectedCountEntries(row.affected_counts);
                          return (
                            <tr key={row.merge_id}>
                              <td>#{row.merge_id}</td>
                              <td>{fmtDate(row.performed_at)}</td>
                              <td>
                                <div className="fw-semibold">{wasRedundant ? "Vervangen door" : "Leidend voor"}</div>
                                <div className="small text-muted">{wasRedundant ? row.replacement_artist_name : row.redundant_artist_name}</div>
                              </td>
                              <td className="small">
                                <div>Redundant: <code>#{row.redundant_artist_key}</code></div>
                                <div>Leidend: <code>#{row.replacement_artist_key}</code></div>
                              </td>
                              <td className="artist-merge-history-impact-cell">
                                <div className="fw-semibold">{mergeHistoryAffectedCount(row)}</div>
                                {affectedEntries.length ? (
                                  <div className="artist-merge-history-impact-list" aria-label="Geraakte records per onderdeel">
                                    {affectedEntries.map((entry) => (
                                      <span className="artist-merge-history-impact-chip" key={`${row.merge_id}-${entry.key}`}>
                                        <span>{entry.label}</span>
                                        <strong>{entry.value}</strong>
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <div className={`artist-relation-card artist-discogs-card ${showRelationPanelSection("discogs") ? "" : "d-none"}`}>
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div>
                    <h3 className="h6 mb-1">Discogs artist enrichment</h3>
                    <div className="small text-muted">ART-012C · Zoeken, inspecteren en koppelen als externe referentie.</div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline-primary"
                    onClick={searchDiscogsForSelectedArtist}
                    disabled={!discogsConfigured || discogsLoading}
                    title={discogsConfigured ? "Zoek lokale artiest in Discogs" : discogsDisabledReason}
                  >
                    {discogsLoading ? "Zoeken..." : "Zoek in Discogs"}
                  </Button>
                </div>

                {!discogsConfigured ? (
                  <Alert variant="secondary" className="py-2 small mb-2">{discogsDisabledReason}</Alert>
                ) : null}
                {discogsError ? <Alert variant="danger" className="py-2 small mb-2">{discogsError}</Alert> : null}
                {relations?.discogsReferences?.length ? (
                  <div className="artist-discogs-linked mb-2 small border rounded p-2">
                    <div className="fw-semibold mb-1">Gekoppelde Discogs-referentie</div>
                    {relations.discogsReferences.map((ref) => (
                      <div key={ref.reference_id} className="d-flex justify-content-between gap-2 flex-wrap">
                        <span><Badge bg={ref.status === "linked" ? "success" : "secondary"}>{ref.status}</Badge> <code>#{ref.external_id}</code> {ref.external_name}</span>
                        {ref.external_url ? <a href={ref.external_url} target="_blank" rel="noreferrer">Open Discogs</a> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                {primaryExternalProfile ? (
                  <div className="artist-external-profile-preview mb-2 small border rounded p-2">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <div>
                        <div className="fw-semibold">Discogs profieltekst</div>
                        <div className="text-muted">Externe brondata uit Discogs. Lokale notities blijven apart in het edit-scherm.</div>
                      </div>
                      {primaryExternalProfile.profile_url ? <a className="btn btn-sm btn-outline-secondary" href={primaryExternalProfile.profile_url} target="_blank" rel="noreferrer">Open bron</a> : null}
                    </div>
                    <div className="artist-external-profile-text" title={primaryExternalProfile.profile_text || ""}>
                      {primaryExternalProfile.profile_text || "Geen profieltekst beschikbaar."}
                    </div>
                  </div>
                ) : null}

                {relations?.discogsReferences?.length ? (
                  <div className="artist-discogs-profile-images mb-2 small border rounded p-2">
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
                      <div>
                        <div className="fw-semibold">Profielfoto uit Discogs images</div>
                        <div className="text-muted">ART-012E-2 · Kies één Discogs-afbeelding als primaire profielfoto. De afbeelding blijft remote; er worden geen binaire bestanden in PostgreSQL opgeslagen.</div>
                      </div>
                      {relationPrimaryImage ? <Badge bg="success">Profielfoto gekozen</Badge> : <Badge bg="secondary">Geen profielfoto</Badge>}
                    </div>
                    {discogsPrimaryImageError ? <Alert variant="danger" className="py-2 small mb-2">{discogsPrimaryImageError}</Alert> : null}
                    {discogsPrimaryImageResult ? <Alert variant="success" className="py-2 small mb-2">Primaire profielfoto bijgewerkt.</Alert> : null}
                    {!relationDiscogsImages.length ? (
                      <EmptyState>Geen Discogs-afbeeldingen gevonden. Koppel of ververs eerst een Discogs artist met images.</EmptyState>
                    ) : (
                      <div className="artist-discogs-image-grid" aria-label="Discogs afbeeldingen voor profielfoto">
                        {relationDiscogsImages.map((image) => (
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
                                disabled={image.is_primary || Boolean(discogsPrimaryImageLoading)}
                                onClick={() => setPrimaryDiscogsImage(image)}
                              >
                                {discogsPrimaryImageLoading === String(image.image_id) ? "Opslaan..." : image.is_primary ? "Huidige profielfoto" : "Maak profielfoto"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
                {!relations?.discogsReferences?.length ? (
                  <Alert variant="info" className="py-2 small mb-2 artist-discogs-proposals-prerequisite">
                    Koppel eerst een Discogs artist voordat naamvoorstellen beschikbaar zijn. Na koppeling kun je Discogs-namen via de reviewqueue beoordelen.
                  </Alert>
                ) : null}

                {relations?.discogsReferences?.length ? (
                  <div className="artist-discogs-enrichment-preview mb-2 small border rounded p-2">
                    <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-2">
                      <div>
                        <div className="fw-semibold">Discogs verrijkingsvoorstellen</div>
                        <div className="text-muted">ART-012E-3 · Read-only preview van mogelijke verrijking uit Discogs-cache/profieltekst. Er worden nog geen lokale artist-velden aangepast.</div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline-secondary" onClick={loadDiscogsEnrichmentProposals} disabled={discogsEnrichmentLoading}>
                          {discogsEnrichmentLoading ? "Laden..." : "Toon voorstellen"}
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={generateDiscogsEnrichmentProposals} disabled={discogsEnrichmentLoading}>
                          {discogsEnrichmentLoading ? "Genereren..." : "Genereer voorstellen"}
                        </Button>
                      </div>
                    </div>
                    {discogsEnrichmentError ? <Alert variant="danger" className="py-2 small mb-2">{discogsEnrichmentError}</Alert> : null}
                    {discogsEnrichmentGenerated !== null ? <Alert variant="info" className="py-2 small mb-2">Voorstellen opnieuw opgebouwd vanuit Discogs-data. Gegenereerd: {discogsEnrichmentGenerated}.</Alert> : null}
                    {discogsEnrichment ? (
                      <>
                        <div className="d-flex gap-2 flex-wrap mb-2">
                          <Badge bg="secondary">Totaal: {discogsEnrichment.summary?.total || 0}</Badge>
                          <Badge bg="success">Beschikbaar: {discogsEnrichment.summary?.available || 0}</Badge>
                          <Badge bg="danger">Conflict: {discogsEnrichment.summary?.conflicts || 0}</Badge>
                          <Badge bg="secondary">Bestaand: {discogsEnrichment.summary?.existing || 0}</Badge>
                          <Badge bg="primary">Toegepast: {discogsEnrichment.summary?.applied || 0}</Badge>
                          <Badge bg="dark">Genegeerd: {discogsEnrichment.summary?.ignored || 0}</Badge>
                          <Badge bg="info">Later: {discogsEnrichment.summary?.reviewLater || 0}</Badge>
                          <Badge bg="warning" text="dark">Niet toepasbaar: {discogsEnrichment.summary?.notApplicable || 0}</Badge>
                        </div>
                        {!discogsEnrichment.proposals?.length ? (
                          <EmptyState>Geen verrijkingsvoorstellen gevonden. Klik op “Genereer voorstellen” als de Discogs-cache al gevuld is.</EmptyState>
                        ) : (
                          <div className="artist-relation-table-scroll" aria-label="Discogs verrijkingsvoorstellen read-only">
                            <Table size="sm" className="mb-0 align-middle artist-discogs-enrichment-table">
                              <thead><tr><th>Veld</th><th>Lokale waarde</th><th>Voorstel</th><th>Status</th><th>Confidence</th><th>Context</th><th>Actie</th></tr></thead>
                              <tbody>
                                {discogsEnrichment.proposals.map((proposal) => (
                                  <tr key={proposal.proposal_id || `${proposal.proposal_type}-${proposal.target_field}-${proposal.proposed_value_normalized}`}>
                                    <td><div className="fw-semibold">{enrichmentTargetLabel(proposal)}</div><div className="text-muted">{proposal.proposal_type}</div></td>
                                    <td className="small"><EnrichmentValue value={proposal.local_value} /></td>
                                    <td className="small"><EnrichmentValue value={proposal.proposed_value_normalized || proposal.proposed_value} strong />{proposal.proposed_value && proposal.proposed_value !== proposal.proposed_value_normalized ? <div className="text-muted artist-discogs-enrichment-raw" title={proposal.proposed_value}>raw: <EnrichmentValue value={proposal.proposed_value} /></div> : null}</td>
                                    <td><Badge bg={enrichmentStatusVariant(proposal.status)}>{proposal.status}</Badge>{proposal.conflict_type ? <div className="small text-danger">{proposal.conflict_type}</div> : null}</td>
                                    <td><Badge bg={enrichmentConfidenceVariant(proposal.extraction_confidence)} text={proposal.extraction_confidence === "medium" ? "dark" : undefined}>{proposal.extraction_confidence}</Badge><div className="small text-muted">{proposal.extraction_method}</div></td>
                                    <td className="small text-muted artist-discogs-enrichment-context" title={proposal.extraction_context || proposal.notes || ""}>{proposal.extraction_context || proposal.notes || "—"}</td>
                                    <td>
                                      <div className="d-flex flex-column gap-1">
                                        {canApplyEnrichmentProposal(proposal) ? (
                                          <Button size="sm" variant={proposal.status === "conflict" ? "outline-warning" : "outline-success"} onClick={() => applyDiscogsEnrichmentProposal(proposal)} disabled={Boolean(discogsEnrichmentActionLoading)}>
                                            {discogsEnrichmentActionLoading === `apply-${proposal.proposal_id}` ? "Bezig..." : proposal.status === "conflict" ? "Overschrijf" : "Toepassen"}
                                          </Button>
                                        ) : null}
                                        {canReviewEnrichmentProposal(proposal) ? (
                                          <>
                                            <Button size="sm" variant="outline-secondary" onClick={() => updateDiscogsEnrichmentProposalStatus(proposal, "review_later")} disabled={Boolean(discogsEnrichmentActionLoading)}>
                                              {discogsEnrichmentActionLoading === `review_later-${proposal.proposal_id}` ? "Bezig..." : "Later"}
                                            </Button>
                                            <Button size="sm" variant="outline-dark" onClick={() => updateDiscogsEnrichmentProposalStatus(proposal, "ignored")} disabled={Boolean(discogsEnrichmentActionLoading)}>
                                              {discogsEnrichmentActionLoading === `ignored-${proposal.proposal_id}` ? "Bezig..." : "Negeer"}
                                            </Button>
                                          </>
                                        ) : null}
                                        {!canApplyEnrichmentProposal(proposal) && !canReviewEnrichmentProposal(proposal) ? <span className="text-muted small">—</span> : null}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                        <div className="text-muted mt-2">ART-012E-4: voorstellen kunnen nu expliciet worden toegepast, genegeerd of later beoordeeld. Onvolledige datums blijven bewust niet toepasbaar op date-velden.</div>
                      </>
                    ) : (
                      <EmptyState>Klik op “Genereer voorstellen” om Discogs profieltekst, artist type, datums en image-samenvatting als read-only voorstellen te tonen.</EmptyState>
                    )}
                  </div>
                ) : null}
                {relations?.discogsReferences?.length ? (
                  <div className="artist-discogs-name-reviewqueue mb-2 small border rounded p-2">
                    <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap mb-2">
                      <div>
                        <div className="fw-semibold">Discogs naamvoorstellen reviewqueue</div>
                        <div className="text-muted">ART-012D-4-Fix-1 · Persistente aliases/name variations met filters, conflicten, heropenactie en veilige apply.</div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline-secondary" onClick={() => loadDiscogsNameQueue()} disabled={discogsNameQueueLoading}>
                          {discogsNameQueueLoading ? "Laden..." : "Toon queue"}
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={generateDiscogsNameQueue} disabled={discogsNameQueueLoading}>
                          {discogsNameQueueLoading ? "Genereren..." : "Genereer queue"}
                        </Button>
                      </div>
                    </div>
                    <div className="row g-2 align-items-end mb-2">
                      <div className="col-12 col-md-3">
                        <Form.Label className="small mb-1">Status</Form.Label>
                        <Form.Select size="sm" value={discogsNameQueueStatusFilter} onChange={(e) => { setDiscogsNameQueueStatusFilter(e.target.value); loadDiscogsNameQueue({ status: e.target.value }); }}>
                          <option value="all">Alle statussen</option>
                          <option value="new">Nieuw</option>
                          <option value="conflict">Conflict</option>
                          <option value="review_later">Later</option>
                          <option value="existing">Bestaand</option>
                          <option value="added">Toegevoegd</option>
                          <option value="ignored">Genegeerd</option>
                          <option value="invalid">Ongeldig</option>
                        </Form.Select>
                      </div>
                      <div className="col-12 col-md-3">
                        <Form.Label className="small mb-1">Type</Form.Label>
                        <Form.Select size="sm" value={discogsNameQueueTypeFilter} onChange={(e) => { setDiscogsNameQueueTypeFilter(e.target.value); loadDiscogsNameQueue({ type: e.target.value }); }}>
                          <option value="all">Alle types</option>
                          <option value="discogs_name">Discogs naam</option>
                          <option value="real_name">Real name</option>
                          <option value="alias">Alias</option>
                          <option value="namevariation">Name variation</option>
                        </Form.Select>
                      </div>
                      <div className="col-12 col-md-4">
                        <Form.Label className="small mb-1">Zoeken</Form.Label>
                        <Form.Control size="sm" value={discogsNameQueueSearch} placeholder="Zoek voorstel of conflict..." onChange={(e) => setDiscogsNameQueueSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") loadDiscogsNameQueue({ q: discogsNameQueueSearch }); }} />
                      </div>
                      <div className="col-12 col-md-2 d-flex gap-2">
                        <Button size="sm" variant="outline-secondary" className="w-100" onClick={() => loadDiscogsNameQueue({ q: discogsNameQueueSearch })}>Filter</Button>
                        <Button size="sm" variant="outline-dark" onClick={() => { setDiscogsNameQueueStatusFilter("all"); setDiscogsNameQueueTypeFilter("all"); setDiscogsNameQueueSearch(""); loadDiscogsNameQueue({ status: "all", type: "all", q: "" }); }}>Reset</Button>
                      </div>
                    </div>
                    {discogsNameQueueError ? <Alert variant="danger" className="py-2 small mb-2">{discogsNameQueueError}</Alert> : null}
                    {discogsNameQueueGenerated !== null ? <Alert variant="info" className="py-2 small mb-2">Naamvoorstellen bijgewerkt vanuit Discogs-cache. Verwerkt: {discogsNameQueueGenerated}.</Alert> : null}
                    {discogsNameQueue ? (
                      <>
                        <div className="d-flex gap-2 flex-wrap mb-2">
                          <Badge bg="secondary">Totaal: {discogsNameQueue.summary?.total || 0}</Badge>
                          <Badge bg="success">Nieuw: {discogsNameQueue.summary?.new || 0}</Badge>
                          <Badge bg="primary">Toegevoegd: {discogsNameQueue.summary?.added || 0}</Badge>
                          <Badge bg="dark">Genegeerd: {discogsNameQueue.summary?.ignored || 0}</Badge>
                          <Badge bg="danger">Conflict: {discogsNameQueue.summary?.conflict || 0}</Badge>
                          <Badge bg="info">Later: {discogsNameQueue.summary?.review_later || 0}</Badge>
                          <Badge bg="secondary">Bestaand: {discogsNameQueue.summary?.existing || 0}</Badge>
                          {discogsNameQueue.summary?.invalid ? <Badge bg="warning" text="dark">Ongeldig: {discogsNameQueue.summary.invalid}</Badge> : null}
                        </div>
                        {discogsNameQueue.filteredSummary && discogsNameQueue.filteredSummary.total !== discogsNameQueue.summary?.total ? (
                          <div className="text-muted mb-2">Gefilterd: {discogsNameQueue.filteredSummary.total} voorstel(len).</div>
                        ) : null}
                        {!discogsNameQueue.proposals?.length ? (
                          <EmptyState>Geen persistente naamvoorstellen gevonden voor de huidige filters. Klik op “Genereer queue” of reset de filters.</EmptyState>
                        ) : (
                          <div className="artist-discogs-results-wrap" aria-label="Discogs naamvoorstellen reviewqueue">
                            <Table size="sm" className="mb-0 align-middle artist-discogs-results-table artist-discogs-name-proposals-table">
                              <thead><tr><th>Voorstel</th><th>Bron</th><th>Status</th><th>Conflict / toelichting</th><th className="text-end">Actie</th></tr></thead>
                              <tbody>
                                {discogsNameQueue.proposals.map((proposal) => (
                                  <tr key={proposal.proposal_id}>
                                    <td><span className="fw-semibold artist-discogs-enrichment-value" title={proposal.proposal_name}>{proposal.proposal_name}</span></td>
                                    <td className="small text-muted">{proposal.source_label || proposal.proposal_type}</td>
                                    <td><Badge bg={nameProposalStatusVariant(proposal.status)}>{proposal.status}</Badge></td>
                                    <td className="small artist-discogs-enrichment-value">
                                      {proposal.reason || "—"}
                                      {proposal.conflict_artist_key ? <div className="text-danger">Conflict met artist_key <code>#{proposal.conflict_artist_key}</code> {proposal.conflict_artist_name}</div> : null}
                                    </td>
                                    <td className="text-end">
                                      <div className="d-flex flex-column align-items-end gap-1">
                                        {canApplyNameProposal(proposal) ? (
                                          <Button size="sm" variant="outline-primary" onClick={() => applyDiscogsNameQueueProposalAsSpelling(proposal)} disabled={Boolean(discogsNameQueueActionLoading)}>
                                            {discogsNameQueueActionLoading === `apply-${proposal.proposal_id}` ? "Toevoegen..." : "Voeg toe als spelling"}
                                          </Button>
                                        ) : null}
                                        {proposal.status === "conflict" ? <span className="text-danger small">Niet toepasbaar: spelling is elders gekoppeld</span> : null}
                                        {proposal.status === "existing" ? <span className="text-muted small">Bestaat al bij deze artiest</span> : null}
                                        {canReviewNameProposal(proposal) && proposal.status !== "review_later" && proposal.status !== "ignored" ? (
                                          <Button size="sm" variant="outline-secondary" onClick={() => updateDiscogsNameQueueStatus(proposal, "review_later")} disabled={Boolean(discogsNameQueueActionLoading)}>
                                            {discogsNameQueueActionLoading === `review_later-${proposal.proposal_id}` ? "Bezig..." : "Later"}
                                          </Button>
                                        ) : null}
                                        {canReviewNameProposal(proposal) && proposal.status !== "ignored" ? (
                                          <Button size="sm" variant="outline-dark" onClick={() => updateDiscogsNameQueueStatus(proposal, "ignored")} disabled={Boolean(discogsNameQueueActionLoading)}>
                                            {discogsNameQueueActionLoading === `ignored-${proposal.proposal_id}` ? "Bezig..." : "Negeer"}
                                          </Button>
                                        ) : null}
                                        {["ignored", "review_later"].includes(proposal.status) ? (
                                          <Button size="sm" variant="outline-success" onClick={() => updateDiscogsNameQueueStatus(proposal, "new")} disabled={Boolean(discogsNameQueueActionLoading)}>
                                            {discogsNameQueueActionLoading === `new-${proposal.proposal_id}` ? "Bezig..." : "Heropen"}
                                          </Button>
                                        ) : null}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </div>
                        )}
                      </>
                    ) : (
                      <EmptyState>Klik op “Genereer queue” om Discogs naamvoorstellen persistent vast te leggen.</EmptyState>
                    )}
                  </div>
                ) : null}

                {!discogsResults ? (
                  <EmptyState>Zoek Discogs-kandidaten voor deze lokale artiest. Discogs IDs vervangen nooit lokale artist keys.</EmptyState>
                ) : !discogsResults.discogs?.items?.length ? (
                  <EmptyState>Geen Discogs artist-resultaten gevonden.</EmptyState>
                ) : (
                  <div className="artist-discogs-results-wrap" aria-label="Discogs artist zoekresultaten">
                    <Table size="sm" className="mb-0 align-middle artist-discogs-results-table">
                      <thead><tr><th>Discogs artist</th><th>ID</th><th>Bron</th><th className="artist-discogs-action-col text-end">Actie</th></tr></thead>
                      <tbody>
                        {discogsResults.discogs.items.map((item) => (
                          <tr key={item.discogs_artist_id}>
                            <td>
                              <div className="fw-semibold">{item.discogs_name}</div>
                              {item.discogs_url ? <a href={item.discogs_url} target="_blank" rel="noreferrer" className="small">Open Discogs</a> : null}
                            </td>
                            <td className="artist-discogs-id-cell"><code>{item.discogs_artist_id}</code></td>
                            <td className="small text-muted artist-discogs-source-cell">{item.type || "artist"}</td>
                            <td className="artist-discogs-action-col text-end"><Button size="sm" variant="outline-secondary" className="artist-discogs-detail-button" onClick={() => openDiscogsDetail(item.discogs_artist_id)}>Detail</Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {discogsDetailLoading ? <div className="small text-muted mt-2"><Spinner size="sm" animation="border" className="me-2" />Discogs detail laden...</div> : null}
                {discogsDetailError ? <Alert variant="danger" className="py-2 small mt-2">{discogsDetailError}</Alert> : null}
                {discogsDetail ? (
                  <div className="artist-discogs-detail mt-3 border rounded p-2 small">
                    <div className="fw-semibold">{discogsDetail.discogs_name} <span className="text-muted">#{discogsDetail.discogs_artist_id}</span></div>
                    {discogsDetail.real_name ? <div><strong>Real name:</strong> {discogsDetail.real_name}</div> : null}
                    {discogsDetail.birth_date ? <div><strong>Geboortedatum:</strong> {discogsDetail.birth_date}</div> : null}
                    {discogsDetail.death_date ? <div><strong>Overlijdensdatum:</strong> {discogsDetail.death_date}</div> : null}
                    {discogsDetail.profile ? <div className="mt-1"><strong>Profile:</strong> {discogsDetail.profile.slice(0, 500)}{discogsDetail.profile.length > 500 ? "…" : ""}</div> : null}
                    <div className="d-flex gap-2 flex-wrap mt-2">
                      <Badge bg="secondary">Aliases: {discogsDetail.aliases?.length || 0}</Badge>
                      <Badge bg="secondary">Name variations: {discogsDetail.namevariations?.length || 0}</Badge>
                      <Badge bg="secondary">Groups: {discogsDetail.groups?.length || 0}</Badge>
                      <Badge bg="secondary">Members: {discogsDetail.members?.length || 0}</Badge>
                      <Badge bg="secondary">Images: {discogsDetail.images?.length || 0}</Badge>
                    </div>
                    {discogsLinkError ? <Alert variant="danger" className="py-2 small mt-2 mb-0">{discogsLinkError}</Alert> : null}
                    {discogsLinkResult ? (
                      <Alert variant="success" className="py-2 small mt-2 mb-0">
                        <div>Gekoppeld als externe Discogs-referentie #{discogsLinkResult.reference?.external_id}. Images metadata opgeslagen: {discogsLinkResult.imageCount || 0}.</div>
                        {discogsLinkResult.appliedArtistFields?.ar_artist_dateofbirth ? <div>Geboortedatum overgenomen naar de lokale artiest.</div> : null}
                        {discogsLinkResult.appliedArtistFields?.ar_artist_passing ? <div>Overlijdensdatum overgenomen naar de lokale artiest.</div> : null}
                        {!discogsLinkResult.appliedArtistFields?.ar_artist_dateofbirth && !discogsLinkResult.appliedArtistFields?.ar_artist_passing ? <div>Geen gestructureerde geboorte-/overlijdensdatum overgenomen.</div> : null}
                      </Alert>
                    ) : null}
                    <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mt-3">
                      <div className="text-muted">ART-012C koppelt alleen de externe Discogs-referentie/cachemetadata. Discogs-namen zijn voorstellen. Lokale artist keys en artistnaam worden niet overschreven. Canonical naamwijzigingen lopen later via artiestenspelling; gestructureerde geboorte-/overlijdensdatum wordt alleen ingevuld als het lokale veld nog leeg is.</div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={linkDiscogsDetailToArtist}
                        disabled={discogsLinkLoading || !discogsConfigured}
                        title="Koppel deze Discogs artist aan de lokale artiest als externe referentie"
                      >
                        {discogsLinkLoading ? "Koppelen..." : "Koppel Discogs artist"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            {!relationArtist?.ar_merged_into_artist_key ? (
            <section className={`artist-duplicate-panel mt-3 ${showRelationPanelSection("duplicates") ? "" : "d-none"}`} aria-label="Artiesten ontdubbelen impactscan">
              <div className="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-2">
                <div>
                  <div className="text-uppercase text-muted small fw-semibold">ART-015B · Ontdubbelen</div>
                  <h3 className="h6 mb-1">Mogelijke dubbele artiesten</h3>
                  <div className="small text-muted">Fuzzy matching helpt alleen met kandidaatdetectie. Deze sprint voert nog geen merge uit.</div>
                </div>
                <Button size="sm" variant="outline-primary" onClick={loadDuplicateCandidates} disabled={duplicatesLoading}>
                  {duplicatesLoading ? "Zoeken..." : "Zoek mogelijke dubbelen"}
                </Button>
              </div>

              {duplicatesError ? <Alert variant="danger" className="mb-2">{duplicatesError}</Alert> : null}
              {!duplicateCandidates ? (
                <EmptyState>Klik op “Zoek mogelijke dubbelen” om vergelijkbare artiestnamen en artiestenspellingen te vinden.</EmptyState>
              ) : duplicateCandidates.items?.length === 0 ? (
                <EmptyState>Geen mogelijke dubbele artiesten gevonden boven de ingestelde score.</EmptyState>
              ) : (
                <div className="artist-relation-table-scroll">
                  <Table size="sm" className="mb-0 align-middle">
                    <thead>
                      <tr><th>Kandidaat</th><th>Score</th><th>Match</th><th>Reden</th><th className="text-end">Impactscan</th></tr>
                    </thead>
                    <tbody>
                      {duplicateCandidates.items.map((item) => (
                        <tr key={item.candidate.ar_artist_key}>
                          <td>
                            <div className="fw-semibold">{item.candidate.ar_artist_name}</div>
                            <div className="small text-muted">#{item.candidate.ar_artist_key} · {countLabel(item.candidate.artist_weight, "titel", "titels")}</div>
                          </td>
                          <td><Badge bg={item.score >= 0.9 ? "success" : "warning"}>{Math.round(item.score * 100)}%</Badge></td>
                          <td className="small"><code>{item.matchedSource}</code><br /><span className="text-muted">↔ {item.matchedCandidate}</span></td>
                          <td className="small text-muted">{item.matchReason}</td>
                          <td className="text-end">
                            <div className="d-grid gap-1">
                              <Button
                                size="sm"
                                variant="outline-danger"
                                title="Maak de kandidaat de leidende artiest en vervang de huidige artiest"
                                aria-label="Maak kandidaat leidend: huidige artiest wordt vervangen door kandidaat"
                                onClick={() => openMergeImpact({ redundantArtistKey: relationArtist.ar_artist_key, replacementArtistKey: item.candidate.ar_artist_key })}
                              >
                                Maak kandidaat leidend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                title="Maak de huidige artiest leidend en vervang de kandidaat"
                                aria-label="Maak deze artiest leidend: kandidaat wordt vervangen door huidige artiest"
                                onClick={() => openMergeImpact({ redundantArtistKey: item.candidate.ar_artist_key, replacementArtistKey: relationArtist.ar_artist_key })}
                              >
                                Maak deze artiest leidend
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </section>
            ) : (
              <Alert variant="secondary" className="mt-3 mb-0">Ontdubbelen is uitgeschakeld voor samengevoegde artiesten. Open de leidende artiest voor verdere acties.</Alert>
            )}
            </>
          )}
        </section>

        <ArtistFormModal show={formOpen} mode={formMode} artist={active} onClose={() => setFormOpen(false)} onSave={saveArtist} />
        <ConfirmModal show={confirmOpen} title="Artiest naar prullenbak verplaatsen?" confirmLabel={deleting ? "Verplaatsen..." : "Naar prullenbak"} confirmVariant="danger" disabled={deleting} error={confirmError} onConfirm={deleteArtistSoft} onClose={() => !deleting && setConfirmOpen(false)}>
          {active ? <>Weet je zeker dat je <strong>{active.ar_artist_name}</strong> naar de prullenbak wilt verplaatsen?</> : null}
        </ConfirmModal>

        <Offcanvas show={detailsOpen} onHide={() => setDetailsOpen(false)} placement="end">
          <Offcanvas.Header closeButton><Offcanvas.Title>Artiest details</Offcanvas.Title></Offcanvas.Header>
          <Offcanvas.Body>
            {detailsArtist ? (
              <div className="small">
                <div className="mb-2"><strong>ID:</strong> {detailsArtist.ar_artist_key}</div>
                <div className="mb-2 d-flex align-items-center gap-2">
                  <strong>Naam:</strong>
                  <span>{detailsArtist.ar_artist_name}</span>
                  <DeceasedStatusBadge
                    passingDate={detailsArtist.ar_artist_passing}
                    testId="artist-details-deceased-indicator"
                  />
                </div>
                {detailsArtist.ar_merged_into_artist_key ? (
                  <Alert variant="warning" className="py-2">
                    Samengevoegd met {detailsArtist.ar_merged_into_artist_name || `#${detailsArtist.ar_merged_into_artist_key}`} op {fmtDate(detailsArtist.ar_merged_at) || "onbekende datum"}.
                  </Alert>
                ) : null}
                <div className="mb-2"><strong>Favoriet:</strong> {detailsArtist.ar_is_favorite ? "Ja" : "Nee"}</div>
                <div className="mb-2"><strong>Gewicht:</strong> {detailsArtist.artist_weight ?? 0}</div>
                <div className="mb-2"><strong>Geboren:</strong> {fmtDate(detailsArtist.ar_artist_dateofbirth) || "—"}</div>
                <div className="mb-2"><strong>Overleden:</strong> {fmtDate(detailsArtist.ar_artist_passing) || "—"}</div>
                <div className="mb-2"><strong>Website:</strong> {detailsArtist.ar_website_url ? <a href={detailsArtist.ar_website_url} target="_blank" rel="noreferrer">{detailsArtist.ar_website_url}</a> : "—"}</div>
                <div className="mb-2"><strong>Notities:</strong> {detailsArtist.ar_artist_notes || "—"}</div>
              </div>
            ) : null}
          </Offcanvas.Body>
        </Offcanvas>


        <Offcanvas show={impactOpen} onHide={() => setImpactOpen(false)} placement="end" className="artist-impact-offcanvas">
          <Offcanvas.Header closeButton><Offcanvas.Title>ART-015C Merge uitvoeren</Offcanvas.Title></Offcanvas.Header>
          <Offcanvas.Body>
            {impactLoading ? (
              <div className="text-muted"><Spinner animation="border" size="sm" className="me-2" />Impactscan laden...</div>
            ) : impactError ? (
              <Alert variant="danger">{impactError}</Alert>
            ) : impactData ? (
              <div className="small">
                <Alert variant="info">
                  ART-015C voert de merge pas uit na expliciete bevestiging. De backend valideert de impact opnieuw en voert alle wijzigingen binnen één database-transactie uit.
                </Alert>
                <div className="mb-3">
                  <div><strong>Redundante artiest:</strong> {impactData.redundantArtist?.ar_artist_name} #{impactData.redundantArtist?.ar_artist_key}</div>
                  <div><strong>Vervangende artiest:</strong> {impactData.replacementArtist?.ar_artist_name} #{impactData.replacementArtist?.ar_artist_key}</div>
                </div>
                {impactData.warnings?.length ? (
                  <Alert variant="warning">
                    <div className="fw-semibold mb-1">Waarschuwingen</div>
                    <ul className="mb-0">{impactData.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
                  </Alert>
                ) : null}
                <div className="d-grid gap-3">
                  {impactData.tableImpacts?.map((impact) => (
                    <div key={`${impact.table}.${impact.column}`} className="border rounded p-3">
                      <div className="fw-semibold">{impact.table}.{impact.column}</div>
                      <div className="text-muted mb-2">Actie later: {impact.action}</div>
                      <div className="d-flex gap-2 flex-wrap mb-2">
                        <Badge bg="secondary">{impact.recordCount ?? 0} records</Badge>
                        {impact.uniqueTitleCount !== undefined ? <Badge bg="info">{impact.uniqueTitleCount} unieke titels</Badge> : null}
                        {impact.hitlijstCount !== undefined ? <Badge bg="secondary">{impact.hitlijstCount} hitlijsten</Badge> : null}
                        {impact.conflictCount !== undefined ? <Badge bg={impact.conflictCount > 0 ? "warning" : "secondary"}>{impact.conflictCount} conflicten</Badge> : null}
                      </div>
                      {impact.sample?.length ? (
                        <div className="artist-relation-table-scroll">
                          <Table size="sm" className="mb-0">
                            <tbody>
                              {impact.sample.slice(0, 8).map((row, idx) => (
                                <tr key={row.fd_key || row.as_alternatieve_spelling || idx}>
                                  <td>{row.fd_tag_title || row.as_alternatieve_spelling || "—"}</td>
                                  <td className="text-muted">{row.fd_hitlijst || (row.conflicts_with_replacement ? "conflict" : "")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : <EmptyState>Geen voorbeeldrecords.</EmptyState>}
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-muted">Toekomstige scopes: {impactData.futureScopes?.join(" · ")}</div>

                <div className="border rounded p-3 mt-3 artist-merge-confirmation">
                  <h3 className="h6">Merge definitief uitvoeren</h3>
                  <Form.Group className="mb-2">
                    <Form.Label>Reden / notitie *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={mergeReason}
                      onChange={(e) => setMergeReason(e.target.value)}
                      placeholder="Bijvoorbeeld: dubbele artiest door alternatieve spelling; impact gecontroleerd."
                      disabled={mergeLoading || Boolean(mergeResult)}
                    />
                  </Form.Group>
                  <Form.Check
                    type="checkbox"
                    id="artist-merge-confirmed"
                    checked={mergeConfirmed}
                    onChange={(e) => setMergeConfirmed(e.target.checked)}
                    disabled={mergeLoading || Boolean(mergeResult)}
                    label="Ik heb de impactscan gecontroleerd en wil deze merge transactioneel uitvoeren."
                    className="mb-3"
                  />
                  {mergeResult ? (
                    <Alert variant="success" className="mb-3 artist-merge-result">
                      <div className="fw-semibold">Merge uitgevoerd</div>
                      <div>Merge-ID: <code>#{mergeResult.mergeId}</code></div>
                      <div>Redundant: <code>#{mergeResult.redundantArtist?.ar_artist_key}</code> {mergeResult.redundantArtist?.ar_artist_name}</div>
                      <div>Leidend: <code>#{mergeResult.replacementArtist?.ar_artist_key}</code> {mergeResult.replacementArtist?.ar_artist_name}</div>
                      <div>Samenvatting: {affectedCountEntries(mergeResult.affectedCounts).map((entry) => `${entry.label}: ${entry.value}`).join(" · ") || "geen geraakte records"}</div>
                      <div>Alert: {mergeResult.alert?.id ? `#${mergeResult.alert.id} (${mergeResult.alert.severity})` : "aangemaakt"}</div>
                    </Alert>
                  ) : null}
                  <Button
                    variant="danger"
                    disabled={mergeLoading || Boolean(mergeResult) || !mergeConfirmed || !mergeReason.trim()}
                    onClick={executeMergeFromImpact}
                  >
                    {mergeLoading ? "Merge uitvoeren..." : "Merge uitvoeren"}
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState>Geen impactscan geladen.</EmptyState>
            )}
          </Offcanvas.Body>
        </Offcanvas>


        <Offcanvas show={reviewQueueOpen} onHide={() => setReviewQueueOpen(false)} placement="end" className="artist-reviewqueue-offcanvas">
          <Offcanvas.Header closeButton><Offcanvas.Title>Duplicate reviewqueue</Offcanvas.Title></Offcanvas.Header>
          <Offcanvas.Body>
            <Alert variant="info" className="small">
              ART-015D-2B toont scanner-candidates uit de stagingtabel. De queue voert zelf geen merge-logica uit; impactscan en merge gebruiken de bestaande ART-015B/C flow.
            </Alert>
            <Form onSubmit={submitReviewFilters} className="border rounded p-3 mb-3 bg-light artist-reviewqueue-filters">
              <div className="d-grid gap-2">
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
                    <option value="open">Open werkvoorraad</option>
                    <option value="new">Nieuw</option>
                    <option value="reviewing">In beoordeling</option>
                    <option value="merge_planned">Merge gepland</option>
                    <option value="not_duplicate">Geen dubbel</option>
                    <option value="ignored">Genegeerd</option>
                    <option value="merged">Samengevoegd</option>
                    <option value="all">Alles</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Zoek artiestnaam</Form.Label>
                  <Form.Control value={reviewSearch} onChange={(e) => setReviewSearch(e.target.value)} placeholder="Bijvoorbeeld Hall, Prince, Beatles" />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Minimale score</Form.Label>
                  <Form.Control value={reviewMinScore} onChange={(e) => setReviewMinScore(e.target.value)} placeholder="Bijvoorbeeld 82" />
                </Form.Group>
                <Button type="submit" disabled={reviewLoading}>{reviewLoading ? "Laden..." : "Filter toepassen"}</Button>
              </div>
            </Form>

            {reviewError ? <Alert variant="danger">{reviewError}</Alert> : null}
            {reviewCandidates.some((candidate) => candidate.is_stale_review_candidate) ? (
              <Alert variant="warning" className="small artist-reviewqueue-stale-alert">
                Er staan duplicate candidates langer open dan de ingestelde stale-drempel. Werk deze eerst af of markeer ze als Geen dubbel/Negeren.
              </Alert>
            ) : null}
            <div className="d-flex justify-content-between align-items-center mb-2 small text-muted">
              <span>{reviewTotal} candidates</span>
              <span>Pagina {Math.floor(reviewOffset / reviewLimit) + 1}</span>
            </div>
            {reviewLoading ? (
              <div className="text-muted"><Spinner animation="border" size="sm" className="me-2" />Reviewqueue laden...</div>
            ) : !reviewCandidates.length ? (
              <EmptyState>Geen duplicate candidates gevonden voor deze filter.</EmptyState>
            ) : (
              <div className="d-grid gap-3 artist-reviewqueue-list">
                {reviewCandidates.map((candidate) => (
                  <div className="border rounded p-3 artist-reviewqueue-card" key={candidate.candidate_id}>
                    <div className="d-flex justify-content-between gap-2 align-items-start flex-wrap mb-2">
                      <div>
                        <div className="fw-semibold">Candidate #{candidate.candidate_id}</div>
                        <div className="small text-muted">Eerste keer gezien {fmtDate(candidate.first_seen_at)} · Laatste keer gezien {fmtDate(candidate.last_seen_at)} · {candidate.times_seen} keer gezien</div>
                        {candidate.is_stale_review_candidate ? (
                          <div className="small text-warning fw-semibold">
                            Staat {candidate.review_age_days} dagen open; drempel is {candidate.stale_review_days} dagen.
                          </div>
                        ) : null}
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {candidate.is_stale_review_candidate ? <Badge bg="warning" text="dark">Te lang open</Badge> : null}
                        <Badge bg={candidate.status === "new" ? "primary" : candidate.status === "merged" ? "success" : "secondary"}>{candidate.status}</Badge>
                        <Badge bg={Number(candidate.match_score) >= 90 ? "success" : "warning"}>{Math.round(Number(candidate.match_score || 0))}%</Badge>
                      </div>
                    </div>
                    <div className="artist-reviewqueue-pair mb-2">
                      <div><strong>A:</strong> #{candidate.artist_key_a} {candidate.current_artist_name_a || candidate.artist_name_a} <span className="text-muted small">({countLabel(candidate.artist_weight_a, "titel", "titels")})</span></div>
                      <div><strong>B:</strong> #{candidate.artist_key_b} {candidate.current_artist_name_b || candidate.artist_name_b} <span className="text-muted small">({countLabel(candidate.artist_weight_b, "titel", "titels")})</span></div>
                    </div>
                    <div className="small text-muted mb-2">{candidate.match_method}: {candidate.match_reason}</div>
                    {candidate.review_note ? <div className="small mb-2"><strong>Reviewnotitie:</strong> {candidate.review_note}</div> : null}
                    <div className="d-grid gap-2">
                      <div className="d-flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline-primary" onClick={() => { setReviewQueueOpen(false); openCanonicalArtist(candidate.artist_key_a); }}>Open A</Button>
                        <Button size="sm" variant="outline-primary" onClick={() => { setReviewQueueOpen(false); openCanonicalArtist(candidate.artist_key_b); }}>Open B</Button>
                      </div>
                      <div className="d-grid gap-1">
                        <Button size="sm" variant="outline-danger" onClick={() => openReviewCandidateImpact(candidate, "b_leading")} disabled={candidate.status === "merged"}>
                          Maak B leidend
                        </Button>
                        <Button size="sm" variant="outline-secondary" onClick={() => openReviewCandidateImpact(candidate, "a_leading")} disabled={candidate.status === "merged"}>
                          Maak A leidend
                        </Button>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline-secondary" onClick={() => updateReviewCandidate(candidate, "reviewing")}>In beoordeling</Button>
                        <Button size="sm" variant="outline-success" onClick={() => updateReviewCandidate(candidate, "not_duplicate", "Door gebruiker gemarkeerd als geen dubbel")}>Geen dubbel</Button>
                        <Button size="sm" variant="outline-dark" onClick={() => updateReviewCandidate(candidate, "ignored", "Door gebruiker genegeerd")}>Negeren</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="d-flex justify-content-between mt-3">
              <Button variant="outline-secondary" disabled={reviewOffset === 0 || reviewLoading} onClick={() => loadReviewQueue({ nextOffset: Math.max(0, reviewOffset - reviewLimit) })}>Vorige</Button>
              <Button variant="outline-secondary" disabled={reviewOffset + reviewLimit >= reviewTotal || reviewLoading} onClick={() => loadReviewQueue({ nextOffset: reviewOffset + reviewLimit })}>Volgende</Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        <Offcanvas show={trashOpen} onHide={() => setTrashOpen(false)} placement="end">
          <Offcanvas.Header closeButton><Offcanvas.Title>Prullenbak</Offcanvas.Title></Offcanvas.Header>
          <Offcanvas.Body>
            {trashError ? <Alert variant="danger">{trashError}</Alert> : null}
            {trashLoading ? <div className="text-muted">Prullenbak laden...</div> : deletedItems.length === 0 ? <div className="text-muted">Prullenbak is leeg.</div> : (
              <div className="d-grid gap-2">
                {deletedItems.map((row) => (
                  <div key={row.ar_artist_key} className="border rounded p-3 d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <div className="fw-semibold">{row.ar_artist_name}</div>
                      <div className="small text-muted">Verwijderd item #{row.ar_artist_key}</div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button size="sm" variant="outline-success" onClick={() => restore(row.ar_artist_key, row.ar_artist_name)}>Herstellen</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => hardDelete(row.ar_artist_key, row.ar_artist_name)}>Definitief verwijderen</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Offcanvas.Body>
        </Offcanvas>
      </div>
    </RootTag>
  );
}
