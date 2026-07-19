import React from "react";
import { Button, Toast, ToastContainer } from "react-bootstrap";

const META = {
  success: { icon: "bi-check-circle-fill", label: "Succes", bg: "success" },
  info: { icon: "bi-info-circle-fill", label: "Informatie", bg: "info" },
  warning: { icon: "bi-exclamation-triangle-fill", label: "Waarschuwing", bg: "warning" },
  danger: { icon: "bi-x-octagon-fill", label: "Fout", bg: "danger" },
  dark: { icon: "bi-bell-fill", label: "Melding", bg: "dark" },
};

export function normalizeNotificationSeverity(value) {
  const key = String(value || "info").toLowerCase();
  return META[key] ? key : "info";
}

export default function AppNotification({ notification, onClose }) {
  const severity = normalizeNotificationSeverity(notification?.severity || notification?.bg);
  const meta = META[severity];
  const hasAction = Boolean(notification?.action);
  const technicalCode = notification?.code ? String(notification.code) : "";

  return (
    <ToastContainer position="top-end" className="p-3 artist-notification-container" style={{ zIndex: 1060 }}>
      <Toast
        bg={meta.bg}
        show={Boolean(notification?.show)}
        onClose={onClose}
        delay={hasAction ? 7000 : 4500}
        autohide={!hasAction}
        role={severity === "danger" || severity === "warning" ? "alert" : "status"}
        aria-live={severity === "danger" ? "assertive" : "polite"}
      >
        <Toast.Header closeButton>
          <i className={`bi ${meta.icon} me-2`} aria-hidden="true" />
          <strong className="me-auto">{notification?.title || meta.label}</strong>
          {technicalCode ? <span className="small text-muted">{technicalCode}</span> : null}
        </Toast.Header>
        <Toast.Body className={`${severity === "warning" || severity === "info" ? "text-dark" : "text-white"} d-flex align-items-center justify-content-between gap-3`}>
          <span>{notification?.message}</span>
          {hasAction ? (
            <Button size="sm" variant="light" onClick={() => { notification.action.onClick?.(); onClose?.(); }}>
              {notification.action.label}
            </Button>
          ) : null}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
