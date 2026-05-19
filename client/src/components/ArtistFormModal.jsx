import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Alert, Table, Spinner, Badge } from "react-bootstrap";
import { api } from "../api.js";

function toDateInputValue(v) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function flattenFieldErrors(details) {
  const fe = details?.fieldErrors || {};
  const out = [];
  for (const [k, arr] of Object.entries(fe)) {
    if (Array.isArray(arr) && arr.length) out.push(`${k}: ${arr.join(", ")}`);
  }
  return out;
}

function countLabel(value, singular, plural) {
  const n = Number(value || 0);
  return `${n} ${n === 1 ? singular : plural}`;
}

function EmptyState({ children }) {
  return <div className="text-muted small py-2">{children}</div>;
}

export default function ArtistFormModal({ show, mode, artist, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    ar_artist_name: "",
    ar_artist_dateofbirth: "",
    ar_artist_passing: "",
    ar_website_url: "",
    ar_artist_notes: ""
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);
  const [relations, setRelations] = useState(null);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationsError, setRelationsError] = useState("");

  const title = useMemo(() => (isEdit ? "Edit artist" : "Add artist"), [isEdit]);

  useEffect(() => {
    if (!show) return;
    setError("");
    setFieldErrors([]);
    setSaving(false);
    setRelations(null);
    setRelationsError("");

    if (isEdit && artist) {
      setForm({
        ar_artist_name: artist.ar_artist_name ?? "",
        ar_artist_dateofbirth: toDateInputValue(artist.ar_artist_dateofbirth),
        ar_artist_passing: toDateInputValue(artist.ar_artist_passing),
        ar_website_url: artist.ar_website_url ?? "",
        ar_artist_notes: artist.ar_artist_notes ?? ""
      });
    } else {
      setForm({
        ar_artist_name: "",
        ar_artist_dateofbirth: "",
        ar_artist_passing: "",
        ar_website_url: "",
        ar_artist_notes: ""
      });
    }
  }, [show, isEdit, artist]);

  useEffect(() => {
    if (!show || !isEdit || !artist?.ar_artist_key) return;
    let cancelled = false;
    setRelationsLoading(true);
    setRelationsError("");

    api.getArtistRelations(artist.ar_artist_key)
      .then((data) => {
        if (!cancelled) setRelations(data);
      })
      .catch((err) => {
        if (!cancelled) setRelationsError(err?.message || "Relatie-inzicht kon niet worden geladen");
      })
      .finally(() => {
        if (!cancelled) setRelationsLoading(false);
      });

    return () => { cancelled = true; };
  }, [show, isEdit, artist?.ar_artist_key]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setFieldErrors([]);

    try {
      await onSave({ ...form });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save");
      const details = err?.payload?.details;
      const fe = flattenFieldErrors(details);
      setFieldErrors(fe);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      className="artist-form-modal"
      dialogClassName="artist-form-modal-dialog"
      contentClassName="artist-form-modal-content"
      show={show}
      onHide={saving ? undefined : onClose}
      centered
      scrollable
      size="lg"
      backdrop="static"
      keyboard={!saving}
    >
      <Form onSubmit={submit}>
        <Modal.Header closeButton={!saving}>
          <Modal.Title className="fs-5">{title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {fieldErrors.length > 0 && (
            <Alert variant="warning">
              <div className="fw-semibold mb-1">Please fix:</div>
              <ul className="mb-0">
                {fieldErrors.map((x) => <li key={x}>{x}</li>)}
              </ul>
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              value={form.ar_artist_name}
              onChange={set("ar_artist_name")}
              placeholder="e.g. Depeche Mode"
              required
              maxLength={180}
            />
            <Form.Text className="text-muted">
              Stored as <code>citext</code> (case-insensitive unique).
            </Form.Text>
          </Form.Group>

          <div className="row g-3">
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Date of birth</Form.Label>
                <Form.Control type="date" value={form.ar_artist_dateofbirth} onChange={set("ar_artist_dateofbirth")} />
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group>
                <Form.Label>Passing date</Form.Label>
                <Form.Control type="date" value={form.ar_artist_passing} onChange={set("ar_artist_passing")} />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mt-3">
            <Form.Label>Website URL</Form.Label>
            <Form.Control
              value={form.ar_website_url}
              onChange={set("ar_website_url")}
              placeholder="https://..."
              maxLength={500}
            />
          </Form.Group>

          <Form.Group className="mt-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={form.ar_artist_notes}
              onChange={set("ar_artist_notes")}
              placeholder="Any extra notes..."
            />
          </Form.Group>

          {isEdit ? (
            <section className="artist-relation-panel artist-edit-relation-panel mt-4" aria-label="Relaties van deze artiest">
              <div className="artist-relation-header">
                <div>
                  <div className="text-uppercase text-muted small fw-semibold">Relatie-inzicht</div>
                  <h3 className="h6 mb-0">Relaties van deze artiest</h3>
                  <div className="small text-muted">Alle panelen zijn informatief en read-only. Bewerken gebeurt in de betreffende app via Shellstarter.</div>
                </div>
                {relations?.artist ? (
                  <div className="d-flex gap-2 flex-wrap justify-content-end">
                    <Badge bg="info">{countLabel(relations.artist.artist_weight, "unieke titel", "unieke titels")}</Badge>
                    <Badge bg="secondary">{countLabel(relations.artist.version_count, "versie", "versies")}</Badge>
                    <Badge bg="secondary">{countLabel(relations.artist.hitlijst_count, "hitlijst", "hitlijsten")}</Badge>
                  </div>
                ) : null}
              </div>

              {relationsLoading ? (
                <div className="py-2 text-muted"><Spinner animation="border" size="sm" className="me-2" />Relaties laden...</div>
              ) : relationsError ? (
                <Alert variant="warning" className="mb-0">{relationsError}</Alert>
              ) : (
                <div className="artist-relation-grid artist-relation-grid-compact">
                  <div className="artist-relation-card">
                    <h4 className="h6">File details</h4>
                    {!relations?.fileDetails?.length ? <EmptyState>Geen gekoppelde file_details gevonden.</EmptyState> : (
                      <div className="artist-relation-table-scroll">
                        <Table size="sm" className="mb-0">
                          <thead><tr><th>Titel</th><th>Hitlijst</th><th>Actie</th></tr></thead>
                          <tbody>
                            {relations.fileDetails.slice(0, 20).map((row) => (
                              <tr key={row.fd_key}><td title={row.fd_file_name || ""}>{row.fd_tag_title}</td><td>{row.fd_hitlijst || "—"}</td><td>{row.fd_action || "—"}</td></tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                  <div className="artist-relation-card">
                    <h4 className="h6">Artiesten spelling</h4>
                    {!relations?.spellings?.length ? <EmptyState>Geen alternatieve spellingen gevonden.</EmptyState> : (
                      <div className="artist-relation-table-scroll">
                        <Table size="sm" className="mb-0">
                          <thead><tr><th>Alternatieve spelling</th></tr></thead>
                          <tbody>{relations.spellings.slice(0, 20).map((row) => <tr key={row.as_alternatieve_spelling}><td>{row.as_alternatieve_spelling}</td></tr>)}</tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                  <div className="artist-relation-card">
                    <h4 className="h6">Hitlijsten</h4>
                    {!relations?.hitlijsten?.length ? <EmptyState>Geen hitlijsten gevonden.</EmptyState> : (
                      <div className="artist-relation-table-scroll">
                        <Table size="sm" className="mb-0">
                          <thead><tr><th>Hitlijst</th><th className="text-end">Titels</th></tr></thead>
                          <tbody>{relations.hitlijsten.slice(0, 20).map((row) => <tr key={row.fd_hitlijst}><td>{row.fd_hitlijst}</td><td className="text-end">{row.song_count}</td></tr>)}</tbody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          ) : null}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
