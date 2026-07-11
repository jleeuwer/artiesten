import React from 'react';
import ArtistShellModule from './ArtistShellModule.jsx';
import ArtistStandaloneApp from './ArtistStandaloneApp.jsx';

export default function App({ shellContext = {} }) {
  const shellMode = shellContext?.shellMode === true;
  const embeddedInShell = shellContext?.embeddedInShell === true;

  if (shellMode && embeddedInShell) {
    return <ArtistShellModule shellContext={shellContext} />;
  }

  return <ArtistStandaloneApp shellContext={shellContext} />;
}
