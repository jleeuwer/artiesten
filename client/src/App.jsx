import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Container, Button, Table, Form, InputGroup, Alert, Spinner, Badge,
  Toast, ToastContainer, Offcanvas
} from "react-bootstrap";
import { api } from "./api.js";
import ArtistFormModal from "./components/ArtistFormModal.jsx";
import ConfirmModal from "./components/ConfirmModal.jsx";

function fmtDate(v) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function pickNiceMessage(err) {
  return err?.message || "Something went wrong";
}

export default function App() {
  // Main list
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 25;

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", bg: "dark", action: null });
  const notify = (message, bg = "dark", action = null) => setToast({ show: true, message, bg, action });

  // Undo state
  const undoTimerRef = useRef(null);
  const [lastDeleted, setLastDeleted] = useState(null); // { id, name }

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [active, setActive] = useState(null);

  // Confirm modal (soft delete)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Details offcanvas
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsArtist, setDetailsArtist] = useState(null);

  // Trash offcanvas
  const [trashOpen, setTrashOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState([]);
  const [deletedTotal, setDeletedTotal] = useState(0);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashError, setTrashError] = useState("");

  const page = useMemo(() => Math.floor(offset / limit) + 1, [offset]);
  const maxPage = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  async function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    setPageError("");

    try {
      const data = await api.listArtists({ search, limit, offset }); // default: not deleted
      setItems(data.items);
      setTotal(data.total);

      // keep deleted badge fresh (cheap: just count)
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

    async function loadTrash() {
    setTrashLoading(true);
    setTrashError("");
    try {
      const data = await api.listArtists({ search: "", limit: 100, offset: 0, onlyDeleted: true });
      setDeletedItems(data.items);
      setDeletedTotal(data.total);
      return data; // <-- add this
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

  async function onSearchSubmit(e) {
    e.preventDefault();
    setOffset(0);
    await load();
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
        notify("Artist updated", "success");
      } else {
        await api.createArtist(payload);
        notify("Artist created", "success");
      }
      await load({ silent: true });
    } catch (e) {
      notify(pickNiceMessage(e), "danger");
      throw e;
    }
  }

  async function restore(id, name) {
    try {
      await api.restoreArtist(id);
      notify(`Restored: ${name}`, "success");
      await load({ silent: true });
      if (trashOpen) await loadTrash();
    } catch (e) {
      notify(pickNiceMessage(e), "danger");
    }
  }

async function hardDelete(id, name) {
  try {
    await api.hardDeleteArtist(id);
    notify(`Permanently deleted: ${name}`, "success");

    await load({ silent: true });
    if (trashOpen) await loadTrash();

  } catch (e) {
    if (e?.payload?.restored) {
      notify(`${name} is referenced (FK). It was restored automatically.`, "warning");

      await load({ silent: true });

      if (trashOpen) {
        const data = await loadTrash();
        if ((data?.total ?? 0) === 0) setTrashOpen(false);
      }
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

      // Undo timer (7s)
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => {
        setLastDeleted(null);
      }, 7000);

      notify(`Moved to trash: ${deletedName}`, "warning", {
        label: "Undo",
        onClick: async () => {
          await restore(deletedId, deletedName);
          setLastDeleted(null);
          if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
        }
      });

      setConfirmOpen(false);

      // If we deleted the last row on page, go back one page
      const newOffset = offset >= limit && items.length === 1 ? offset - limit : offset;
      setOffset(newOffset);

      // refresh list quickly
      const data = await api.listArtists({ search, limit, offset: newOffset });
      setItems(data.items);
      setTotal(data.total);

      // refresh deleted badge
      const delCount = await api.listArtists({ limit: 1, offset: 0, onlyDeleted: true });
      setDeletedTotal(delCount.total);

    } catch (e) {
      const msg = pickNiceMessage(e);
      setConfirmError(msg);
      notify(msg, "danger");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Container className="py-4">
      {/* Toasts */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
        <Toast
          bg={toast.bg}
          show={toast.show}
          onClose={() => setToast((t) => ({ ...t, show: false, action: null }))}
          delay={toast.action ? 7000 : 3500}
          autohide={!toast.action}
        >
          <Toast.Body className="text-white d-flex align-items-center justify-content-between gap-3">
            <span>{toast.message}</span>
            {toast.action ? (
              <Button
                size="sm"
                variant="light"
                onClick={() => {
                  toast.action.onClick?.();
                  setToast((t) => ({ ...t, show: false, action: null }));
                }}
              >
                {toast.action.label}
              </Button>
            ) : null}
          </Toast.Body>
        </Toast>
      </ToastContainer>

      <div className="d-flex align-items-center justify-content-between mb-3">
        <h1 className="h3 mb-0">
          Artists <Badge bg="secondary">{total}</Badge>
        </h1>

        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            onClick={async () => {
              setTrashOpen(true);
              await loadTrash();
            }}
          >
            Trash{" "}
            <Badge bg={deletedTotal > 0 ? "danger" : "secondary"} className="ms-1">
              {deletedTotal}
            </Badge>
          </Button>
          <Button onClick={openCreate}>+ Add artist</Button>
        </div>
      </div>

      <Form onSubmit={onSearchSubmit} className="mb-3">
        <InputGroup>
          <Form.Control
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
          />
          <Button variant="outline-secondary" type="submit">Search</Button>
          <Button
            variant="outline-secondary"
            type="button"
            onClick={() => {
              setSearch("");
              setOffset(0);
              setTimeout(() => load(), 0);
            }}
          >
            Clear
          </Button>
        </InputGroup>
      </Form>

      {pageError && <Alert variant="danger">{pageError}</Alert>}

      <div className="border rounded">
        <Table responsive hover className="mb-0 align-middle">
          <thead className="table-light">
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Name</th>
              <th style={{ width: 140 }}>Born</th>
              <th style={{ width: 140 }}>Passing</th>
              <th>Website</th>
              <th style={{ width: 180 }} className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-4 text-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-center text-muted">
                  No artists found
                </td>
              </tr>
            ) : (
              items.map((r) => (
                <tr key={r.ar_artist_key}>
                  <td>{r.ar_artist_key}</td>
                  <td className="fw-semibold">
                    <Button
                      variant="link"
                      className="p-0 fw-semibold text-decoration-none"
                      onClick={() => openDetails(r)}
                    >
                      {r.ar_artist_name}
                    </Button>
                  </td>
                  <td>{fmtDate(r.ar_artist_dateofbirth)}</td>
                  <td>{fmtDate(r.ar_artist_passing)}</td>
                  <td>
                    {r.ar_website_url ? (
                      <a href={r.ar_website_url} target="_blank" rel="noreferrer">
                        {r.ar_website_url}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="text-end">
                    <Button size="sm" variant="outline-primary" className="me-2" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline-danger" onClick={() => openDelete(r)}>
                      Trash
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Page {page} / {maxPage}
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Prev
          </Button>
          <Button
            variant="outline-secondary"
            disabled={offset + limit >= total || loading}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>

      <ArtistFormModal
        show={formOpen}
        mode={formMode}
        artist={active}
        onClose={() => setFormOpen(false)}
        onSave={saveArtist}
      />

      <ConfirmModal
        show={confirmOpen}
        title="Move to trash"
        error={confirmError}
        busy={deleting}
        body={
          <div>
            Move <strong>{active?.ar_artist_name}</strong> to the trash?
          </div>
        }
        confirmText={deleting ? "Moving..." : "Move to trash"}
        onCancel={() => (deleting ? null : setConfirmOpen(false))}
        onConfirm={deleteArtistSoft}
      />

      {/* Details Offcanvas */}
      <Offcanvas show={detailsOpen} onHide={() => setDetailsOpen(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Artist details</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {detailsArtist ? (
            <>
              <div className="mb-2">
                <div className="text-muted">Name</div>
                <div className="fw-semibold">{detailsArtist.ar_artist_name}</div>
              </div>

              <div className="row g-3 mb-2">
                <div className="col-6">
                  <div className="text-muted">Born</div>
                  <div>{fmtDate(detailsArtist.ar_artist_dateofbirth) || "—"}</div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Passing</div>
                  <div>{fmtDate(detailsArtist.ar_artist_passing) || "—"}</div>
                </div>
              </div>

              <div className="mb-2">
                <div className="text-muted">Website</div>
                <div>
                  {detailsArtist.ar_website_url ? (
                    <a href={detailsArtist.ar_website_url} target="_blank" rel="noreferrer">
                      {detailsArtist.ar_website_url}
                    </a>
                  ) : "—"}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-muted">Notes</div>
                <div className="border rounded p-2" style={{ whiteSpace: "pre-wrap" }}>
                  {detailsArtist.ar_artist_notes || "—"}
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    setActive(detailsArtist);
                    setFormMode("edit");
                    setFormOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    setActive(detailsArtist);
                    setConfirmError("");
                    setConfirmOpen(true);
                  }}
                >
                  Trash
                </Button>
              </div>
            </>
          ) : null}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Trash Offcanvas */}
      <Offcanvas show={trashOpen} onHide={() => setTrashOpen(false)} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Trash{" "}
            <Badge bg={deletedTotal > 0 ? "danger" : "secondary"} className="ms-1">
              {deletedTotal}
            </Badge>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {trashError ? <Alert variant="danger">{trashError}</Alert> : null}

          {trashLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading...
            </div>
          ) : deletedItems.length === 0 ? (
            <div className="text-muted">Trash is empty.</div>
          ) : (
            <Table hover responsive className="align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: 140 }}>Deleted</th>
                  <th style={{ width: 220 }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deletedItems.map((r) => (
                  <tr key={r.ar_artist_key}>
                    <td className="fw-semibold">{r.ar_artist_name}</td>
                    <td>{fmtDate(r.ar_deleted_at) || "—"}</td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="me-2"
                        onClick={() => restore(r.ar_artist_key, r.ar_artist_name)}
                      >
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => hardDelete(r.ar_artist_key, r.ar_artist_name)}
                      >
                        Delete forever
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </Container>
  );
}
