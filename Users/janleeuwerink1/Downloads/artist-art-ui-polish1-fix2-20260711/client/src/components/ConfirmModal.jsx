import React from "react";
import { Modal, Button, Alert } from "react-bootstrap";

export default function ConfirmModal({
  show,
  title,
  body,
  confirmText = "Confirm",
  onCancel,
  onConfirm,
  busy = false,
  error = ""
}) {
  return (
    <Modal show={show} onHide={busy ? undefined : onCancel} centered>
      <Modal.Header closeButton={!busy}>
        <Modal.Title className="fs-5">{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error ? <Alert variant="danger" className="mb-3">{error}</Alert> : null}
        {body}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
