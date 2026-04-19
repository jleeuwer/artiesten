import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

function toDateInputValue(v) {
  if (!v) return "";
  return String(v).slice(0, 10);
}

function flattenFieldErrors(details) {
  // details from zod flatten: { fieldErrors: { field: [msg1, msg2] } }
  const fe = details?.fieldErrors || {};
  const out = [];
  for (const [k, arr] of Object.entries(fe)) {
    if (Array.isArray(arr) && arr.length) out.push(`${k}: ${arr.join(", ")}`);
  }
  return out;
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

  const title = useMemo(() => (isEdit ? "Edit artist" : "Add artist"), [isEdit]);

  useEffect(() => {
    if (!show) return;
    setError("");
    setFieldErrors([]);
    setSaving(false);

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
    <Modal show={show} onHide={onClose} centered size="lg">
      <Form onSubmit={submit}>
        <Modal.Header closeButton>
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
