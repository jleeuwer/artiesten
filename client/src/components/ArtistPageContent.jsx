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
  return String(v).slice(0, 10);
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
  const artistTableRef = useRef(null);
  const relationPanelRef = useRef(null);

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
  }

  async function loadRelations(row, { scrollToPanel = true } = {}) {
    if (!row?.ar_artist_key) {
      setSelectedArtist(null);
      setRelations(null);
      resetDuplicateWorkflowState();
      return;
    }

    if (selectedArtist?.ar_artist_key !== row.ar_artist_key) {
      resetDuplicateWorkflowState();
    }

    setSelectedArtist(row);
    setRelationsLoading(true);
    setRelationsError("");
    try {
      const data = await api.getArtistRelations(row.ar_artist_key);
      setRelations(data);
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

  async function openMergeImpact({ redundantArtistKey, replacementArtistKey }) {
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
    } catch (e) {
      const msg = pickNiceMessage(e);
      setImpactError(msg);
      notify(msg, "danger");
    } finally {
      setMergeLoading(false);
    }
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
          <div className="d-flex gap-2">
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
                <th style={{ width: 64 }}>Fav</th>
                <th style={{ width: 80 }}>ID</th>
                <th>Naam</th>
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
                <tr><td colSpan={9} className="py-4 text-center"><Spinner animation="border" size="sm" className="me-2" />Laden...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="py-4 text-center text-muted">Geen artiesten gevonden</td></tr>
              ) : items.map((r) => {
                const isMerged = Boolean(r.ar_merged_into_artist_key || r.ar_merged_at);
                return (
                <tr key={r.ar_artist_key} tabIndex={selectedArtist?.ar_artist_key === r.ar_artist_key ? 0 : -1} className={`${selectedArtist?.ar_artist_key === r.ar_artist_key ? "artist-selected-row" : ""} ${isMerged ? "artist-merged-row" : ""}`.trim()} onClick={() => loadRelations(r)}>
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
            <div>
              <div className="text-uppercase text-muted small fw-semibold">Relatie-inzicht</div>
              <h2 className="h5 mb-0">{relationArtist ? relationArtist.ar_artist_name : "Selecteer een artiest"}</h2>
            </div>
            {relationArtist ? (
              <div className="d-flex gap-2 flex-wrap align-items-center justify-content-end">
                <Badge bg={relationArtist.ar_is_favorite ? "warning" : "secondary"}>{relationArtist.ar_is_favorite ? "Favoriet" : "Geen favoriet"}</Badge>
                <Badge bg="info">{countLabel(relationArtist.artist_weight, "unieke titel", "unieke titels")}</Badge>
                <Badge bg="secondary">{countLabel(relationArtist.version_count, "versie", "versies")}</Badge>
                <Badge bg="secondary">{countLabel(relationArtist.hitlijst_count, "hitlijst", "hitlijsten")}</Badge>
                <Button size="sm" variant="outline-secondary" onClick={scrollToArtistList}>Terug naar artiestenlijst</Button>
              </div>
            ) : null}
          </div>

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
              <div className="artist-relation-card">
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

              <div className="artist-relation-card">
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

              <div className="artist-relation-card">
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

              <div className="artist-relation-card artist-merge-history-card">
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
            </div>
            {!relationArtist?.ar_merged_into_artist_key ? (
            <section className="artist-duplicate-panel mt-3" aria-label="Artiesten ontdubbelen impactscan">
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
                <div className="mb-2"><strong>Naam:</strong> {detailsArtist.ar_artist_name}</div>
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
