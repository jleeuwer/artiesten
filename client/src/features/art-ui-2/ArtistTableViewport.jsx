import React, { forwardRef, useImperativeHandle, useRef } from "react";

const ArtistTableViewport = forwardRef(function ArtistTableViewport({ children, resetKey }, ref) {
  const viewportRef = useRef(null);
  const previousResetKeyRef = useRef(resetKey);

  React.useEffect(() => {
    if (previousResetKeyRef.current !== resetKey) {
      viewportRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
      previousResetKeyRef.current = resetKey;
    }
  }, [resetKey]);

  useImperativeHandle(ref, () => ({
    element: viewportRef.current,
    getScrollPosition() {
      return {
        top: viewportRef.current?.scrollTop || 0,
        left: viewportRef.current?.scrollLeft || 0,
      };
    },
    restoreScrollPosition(position = {}) {
      viewportRef.current?.scrollTo?.({
        top: Number(position.top || 0),
        left: Number(position.left || 0),
        behavior: "auto",
      });
    },
    scrollToTop() {
      viewportRef.current?.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    },
    querySelector(selector) {
      return viewportRef.current?.querySelector?.(selector) || null;
    },
    scrollIntoView(options) {
      viewportRef.current?.scrollIntoView?.(options);
    },
  }), []);

  return (
    <div
      ref={viewportRef}
      className="border rounded artist-table-wrap artist-workspace-table-region artist-table-viewport"
      data-scroll-container="artist-table"
      data-testid="artist-table-viewport"
      tabIndex={0}
      aria-label="Scrollbare artiestentabel"
    >
      {children}
    </div>
  );
});

export default ArtistTableViewport;
