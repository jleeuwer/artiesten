import React, { useEffect, useMemo, useState } from "react";
import { Modal, Button, Form, Alert, Table, Spinner, Badge } from "react-bootstrap";
import { api } from "../api.js";

function toIsoDateValue(v) {
  if (!v) return "";
  if (typeof v === "string") {
    const isoDate = v.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDate) return isoDate[1];
    const dutchDate = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dutchDate) return `${dutchDate[3]}-${dutchDate[2]}-${dutchDate[1]}`;
  }
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    const year = v.getFullYear();
    const month = String(v.getMonth() + 1).padStart(2, "0");
    const day = String(v.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

function toDutchDateInputValue(v) {
  const isoDate = toIsoDateValue(v);
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function dutchDateToIso(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  const match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function isValidDutchDate(value) {
  const isoDate = dutchDateToIso(value);
  if (!isoDate) return false;
  const [year, month, day] = isoDate.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
}

function datePayloadValue(value, label) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (!isValidDutchDate(text)) {
    const err = new Error(`${label} moet het formaat dd-mm-jjjj hebben.`);
    err.fieldName = label;
    throw err;
  }
  return dutchDateToIso(text);
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

function EditDeceasedStatusBadge({ passingDate }) {
  const normalizedDate = String(passingDate || "").trim();
  if (!normalizedDate) return null;
  const displayDate = toDutchDateInputValue(normalizedDate) || normalizedDate;
  const label = `Artiest overleden op ${displayDate}`;
  return (
    <span
      className="artist-deceased-indicator artist-deceased-indicator-detail artist-edit-deceased-indicator"
      title={label}
      aria-label={label}
      data-testid="artist-edit-deceased-indicator"
    >
      <HourglassBottomIcon />
      <span>Overleden</span>
    </span>
  );
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

const ARTIST_TYPE_OPTIONS = [
  { value: "unknown", label: "Onbekend" },
  { value: "person", label: "Persoon" },
  { value: "duo", label: "Duo" },
  { value: "trio", label: "Trio" },
  { value: "group", label: "Groep" },
  { value: "band", label: "Band" },
  { value: "alias", label: "Alias" },
  { value: "project", label: "Project" },
];

function artistTypeLabel(value) {
  const option = ARTIST_TYPE_OPTIONS.find((item) => item.value === value);
  return option?.label || "Onbekend";
}

const DATE_PICKER_YEAR_MIN = 1850;
const DATE_PICKER_YEAR_MAX = new Date().getFullYear() + 5;
const MONTH_OPTIONS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maart" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Augustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function datePartsFromDutch(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) {
    return { day: "", month: "", year: "" };
  }
  return { day: match[1], month: match[2], year: match[3] };
}

function dutchDateFromParts(parts) {
  const day = String(parts.day || "").padStart(2, "0");
  const month = String(parts.month || "").padStart(2, "0");
  const year = String(parts.year || "").trim();
  if (!/^\d{2}$/.test(day) || !/^\d{2}$/.test(month) || !/^\d{4}$/.test(year)) return "";
  return `${day}-${month}-${year}`;
}

function DutchDateInput({ fieldId, label, value, onChange, example }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => datePartsFromDutch(value));
  const preview = dutchDateFromParts(draft);
  const previewValid = preview ? isValidDutchDate(preview) : false;
  const dayOptions = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

  function openPicker() {
    setDraft(datePartsFromDutch(value));
    setOpen((current) => !current);
  }

  function setDraftValue(key) {
    return (event) => setDraft((previous) => ({ ...previous, [key]: event.target.value }));
  }

  function applyDraft() {
    if (!previewValid) return;
    onChange({ target: { value: preview } });
    setOpen(false);
  }

  function clearDate() {
    onChange({ target: { value: "" } });
    setDraft({ day: "", month: "", year: "" });
    setOpen(false);
  }

  return (
    <Form.Group className="artist-dutch-date-field">
      <Form.Label htmlFor={fieldId}>{label}</Form.Label>
      <div className="artist-date-input-group">
        <Form.Control
          id={fieldId}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={onChange}
          placeholder="dd-mm-jjjj"
          aria-label={`${label} in formaat dd-mm-jjjj`}
        />
        <Button
          type="button"
          variant="outline-secondary"
          className="artist-date-picker-button"
          onClick={openPicker}
          aria-label={`Open datepicker voor ${label.toLowerCase()}`}
          aria-expanded={open}
        >
          <i className="bi bi-calendar-date" aria-hidden="true"></i>
        </Button>
      </div>
      {open ? (
        <div className="artist-date-picker-popover" role="dialog" aria-label={`Datepicker voor ${label.toLowerCase()}`}>
          <div className="artist-date-picker-grid">
            <Form.Group>
              <Form.Label className="small">Dag</Form.Label>
              <Form.Select value={draft.day} onChange={setDraftValue("day")} aria-label="Dag">
                <option value="">Dag</option>
                {dayOptions.map((day) => <option key={day} value={day}>{day}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="small">Maand</Form.Label>
              <Form.Select value={draft.month} onChange={setDraftValue("month")} aria-label="Maand">
                <option value="">Maand</option>
                {MONTH_OPTIONS.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="small">Jaar</Form.Label>
              <Form.Control
                type="number"
                inputMode="numeric"
                min={DATE_PICKER_YEAR_MIN}
                max={DATE_PICKER_YEAR_MAX}
                value={draft.year}
                onChange={setDraftValue("year")}
                placeholder="jjjj"
                aria-label="Jaar"
              />
            </Form.Group>
          </div>
          <div className="small text-muted mt-2">Gekozen datum: {preview || "—"}</div>
          {preview && !previewValid ? <div className="small text-danger mt-1">Deze datum is niet geldig.</div> : null}
          <div className="d-flex gap-2 justify-content-end mt-3">
            <Button type="button" size="sm" variant="outline-secondary" onClick={() => setOpen(false)}>Sluiten</Button>
            <Button type="button" size="sm" variant="outline-danger" onClick={clearDate}>Wissen</Button>
            <Button type="button" size="sm" variant="primary" disabled={!previewValid} onClick={applyDraft}>Gebruik datum</Button>
          </div>
        </div>
      ) : null}
      <Form.Text className="text-muted">Voer in als dd-mm-jjjj, bijvoorbeeld {example}.</Form.Text>
    </Form.Group>
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

function ArtistProfileHeader({ artist, relations, loading, passingDate }) {
  const primaryImage = relations?.primaryDiscogsImage || relations?.discogsImages?.find?.((image) => image.is_primary) || null;
  const source = relations?.artist || artist || {};
  const hasDiscogs = Boolean(source.has_discogs_link) || Boolean(relations?.discogsReferences?.some?.((ref) => String(ref.status || "").toLowerCase() === "linked"));

  return (
    <div className="artist-edit-profile-header mb-3">
      <DiscogsProfileImage image={primaryImage} size="small" />
      <div className="flex-grow-1">
        <div className="text-uppercase text-muted small fw-semibold">Artiestprofiel</div>
        <h3 className="h6 mb-1">{source.ar_artist_name || "Nieuwe artiest"}</h3>
        <div className="d-flex gap-2 flex-wrap align-items-center">
          <EditDeceasedStatusBadge passingDate={passingDate || source.ar_artist_passing} />
          {hasDiscogs ? <Badge bg="success"><i className="bi bi-link me-1" aria-hidden="true"></i>Discogs gekoppeld</Badge> : <Badge bg="secondary">Geen Discogs-koppeling</Badge>}
          <Badge bg={source.ar_artist_type === "unknown" ? "secondary" : "light"} text={source.ar_artist_type === "unknown" ? undefined : "dark"}>Type: {artistTypeLabel(source.ar_artist_type)}</Badge>
          {relations?.artist ? <Badge bg="info">{countLabel(relations.artist.artist_weight, "unieke titel", "unieke titels")}</Badge> : null}
          {relations?.artist ? <Badge bg="secondary">{countLabel(relations.artist.version_count, "versie", "versies")}</Badge> : null}
          {relations?.artist ? <Badge bg="secondary">{countLabel(relations.artist.hitlijst_count, "hitlijst", "hitlijsten")}</Badge> : null}
          {loading ? <span className="small text-muted"><Spinner animation="border" size="sm" className="me-1" />relaties laden...</span> : null}
        </div>
      </div>
    </div>
  );
}

export default function ArtistFormModal({ show, mode, artist, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    ar_artist_name: "",
    ar_artist_dateofbirth: "",
    ar_artist_passing: "",
    ar_website_url: "",
    ar_artist_notes: "",
    ar_artist_type: "unknown"
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
        ar_artist_dateofbirth: toDutchDateInputValue(artist.ar_artist_dateofbirth),
        ar_artist_passing: toDutchDateInputValue(artist.ar_artist_passing),
        ar_website_url: artist.ar_website_url ?? "",
        ar_artist_notes: artist.ar_artist_notes ?? "",
        ar_artist_type: artist.ar_artist_type ?? "unknown"
      });
    } else {
      setForm({
        ar_artist_name: "",
        ar_artist_dateofbirth: "",
        ar_artist_passing: "",
        ar_website_url: "",
        ar_artist_notes: "",
        ar_artist_type: "unknown"
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
      const payload = {
        ...form,
        ar_artist_dateofbirth: datePayloadValue(form.ar_artist_dateofbirth, "Geboortedatum"),
        ar_artist_passing: datePayloadValue(form.ar_artist_passing, "Sterfdatum"),
      };
      await onSave(payload);
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
      size="xl"
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

          {isEdit ? <ArtistProfileHeader artist={artist} relations={relations} loading={relationsLoading} passingDate={form.ar_artist_passing} /> : null}

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
              <DutchDateInput
                fieldId="artist-dateofbirth"
                label="Geboortedatum"
                value={form.ar_artist_dateofbirth}
                onChange={set("ar_artist_dateofbirth")}
                example="12-03-1947"
              />
            </div>
            <div className="col-md-6">
              <DutchDateInput
                fieldId="artist-passing"
                label="Sterfdatum"
                value={form.ar_artist_passing}
                onChange={set("ar_artist_passing")}
                example="10-01-2016"
              />
            </div>
          </div>

          <Form.Group className="mt-3">
            <Form.Label>Artist type</Form.Label>
            <Form.Select
              value={form.ar_artist_type}
              onChange={set("ar_artist_type")}
              aria-label="Artist type"
            >
              {ARTIST_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              ART-012E: type helpt later bij veilige Discogs-verrijking; Discogs zet dit niet automatisch.
            </Form.Text>
          </Form.Group>

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
                    <h4 className="h6">Alternatieve spellingen</h4>
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
