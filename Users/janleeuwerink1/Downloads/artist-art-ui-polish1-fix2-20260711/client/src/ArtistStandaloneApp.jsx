import React from 'react';
import ArtistPageContent from './components/ArtistPageContent.jsx';

export default function ArtistStandaloneApp({ shellContext = {} }) {
  return <ArtistPageContent shellContext={{ ...shellContext, shellMode: false, embeddedInShell: false }} />;
}
