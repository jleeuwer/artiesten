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
  return err?.message || "Something went wrong";
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

  async function loadRelations(row, { scrollToPanel = true } = {}) {
    if (!row?.ar_artist_key) {
      setSelectedArtist(null);
      setRelations(null);
      return;
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

  async function clearFilters() {
    setSearch("");
    setSort("favorite_first");
    setFavoriteOnly(false);
    setOffset(0);
    await load({ nextOffset: 0, nextSearch: "", nextSort: "favorite_first", nextFavoriteOnly: false });
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
    artistTableRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    const selectedRow = artistTableRef.current?.querySelector?.(".artist-selected-row");
    selectedRow?.focus?.({ preventScroll: true });
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
              ) : items.map((r) => (
                <tr key={r.ar_artist_key} tabIndex={selectedArtist?.ar_artist_key === r.ar_artist_key ? 0 : -1} className={selectedArtist?.ar_artist_key === r.ar_artist_key ? "artist-selected-row" : ""} onClick={() => loadRelations(r)}>
                  <td>
                    <Button
                      size="sm"
                      variant={r.ar_is_favorite ? "warning" : "outline-secondary"}
                      className="artist-favorite-button"
                      title={r.ar_is_favorite ? "Favoriet verwijderen" : "Als favoriet markeren"}
                      onClick={(e) => toggleFavorite(r, e)}
                    >
                      <i className={r.ar_is_favorite ? "bi bi-star-fill" : "bi bi-star"}></i>
                    </Button>
                  </td>
                  <td>{r.ar_artist_key}</td>
                  <td className="fw-semibold">
                    <Button variant="link" className="p-0 fw-semibold text-decoration-none" onClick={(e) => { e.stopPropagation(); openDetails(r); }}>
                      {r.ar_artist_name}
                    </Button>
                  </td>
                  <td><Badge bg="info">{r.artist_weight ?? 0}</Badge></td>
                  <td>{r.version_count ?? 0}</td>
                  <td>{r.hitlijst_count ?? 0}</td>
                  <td>{r.spelling_count ?? 0}</td>
                  <td>{fmtDate(r.ar_artist_dateofbirth) || <span className="text-muted">—</span>}</td>
                  <td className="text-end" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="sm" variant="outline-danger" onClick={() => openDelete(r)}>Trash</Button>
                  </td>
                </tr>
              ))}
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

          {!relationArtist ? (
            <EmptyState>Klik op een artiestregel om gekoppelde songs, spellingen en hitlijsten te bekijken.</EmptyState>
          ) : relationsLoading ? (
            <div className="py-3 text-muted"><Spinner animation="border" size="sm" className="me-2" />Relaties laden...</div>
          ) : relationsError ? (
            <Alert variant="danger" className="mb-0">{relationsError}</Alert>
          ) : (
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
            </div>
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
