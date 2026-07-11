import React, { useEffect, useRef, useState } from 'react';
import ArtistPageContent from './components/ArtistPageContent.jsx';
import {
  EMBEDDED_HEIGHT_MESSAGE_TYPE,
  EMBEDDED_READY_MESSAGE_TYPE,
  extractShellThemeMessage,
  isAllowedParentMessage,
} from './shellBridge.js';

function postToParent(parentOrigin, payload) {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage(payload, parentOrigin || '*');
}

function postEmbeddedHeight(parentOrigin, height) {
  const safeHeight = Number.isFinite(height) ? Math.max(320, Math.ceil(height)) : 320;
  postToParent(parentOrigin, {
    type: EMBEDDED_HEIGHT_MESSAGE_TYPE,
    appKey: 'artiesten',
    moduleKey: 'beheer',
    height: safeHeight,
  });
}

function postEmbeddedReady(parentOrigin, themeKey) {
  postToParent(parentOrigin, {
    type: EMBEDDED_READY_MESSAGE_TYPE,
    appKey: 'artiesten',
    moduleKey: 'beheer',
    themeKey,
  });
}

export default function ArtistShellModule({ shellContext = {} }) {
  const rootRef = useRef(null);
  const [runtimeShellContext, setRuntimeShellContext] = useState({ ...shellContext, shellMode: true, embeddedInShell: true });

  useEffect(() => {
    setRuntimeShellContext({ ...shellContext, shellMode: true, embeddedInShell: true });
  }, [shellContext]);

  useEffect(() => {
    const parentOrigin = runtimeShellContext?.parentOrigin || '*';
    const publish = () => {
      const measuredHeight = rootRef.current?.scrollHeight || document.body?.scrollHeight || document.documentElement?.scrollHeight || 0;
      postEmbeddedHeight(parentOrigin, measuredHeight + 8);
    };

    publish();
    postEmbeddedReady(parentOrigin, runtimeShellContext?.themeKey || 'slate');

    const timerId = window.setTimeout(publish, 150);
    let resizeObserver = null;
    let mutationObserver = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => publish());
      if (rootRef.current) resizeObserver.observe(rootRef.current);
    }

    if (typeof MutationObserver !== 'undefined' && rootRef.current) {
      mutationObserver = new MutationObserver(() => publish());
      mutationObserver.observe(rootRef.current, { childList: true, subtree: true, attributes: true });
    }

    window.addEventListener('load', publish);
    window.addEventListener('resize', publish);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener('load', publish);
      window.removeEventListener('resize', publish);
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
    };
  }, [runtimeShellContext?.parentOrigin, runtimeShellContext?.themeKey]);

  useEffect(() => {
    const parentOrigin = runtimeShellContext?.parentOrigin || '*';

    function handleShellMessage(event) {
      if (!isAllowedParentMessage(event, parentOrigin)) return;
      const themeMessage = extractShellThemeMessage(event?.data, runtimeShellContext?.themeKey || 'slate');
      if (!themeMessage) return;
      setRuntimeShellContext((current) => ({
        ...current,
        ...themeMessage,
        shellMode: true,
        embeddedInShell: true,
      }));
    }

    window.addEventListener('message', handleShellMessage);
    return () => window.removeEventListener('message', handleShellMessage);
  }, [runtimeShellContext?.parentOrigin, runtimeShellContext?.themeKey]);

  return (
    <div ref={rootRef} className="artist-shell-module-host">
      <ArtistPageContent shellContext={runtimeShellContext} />
    </div>
  );
}
