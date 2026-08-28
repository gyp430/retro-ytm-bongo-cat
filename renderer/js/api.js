/* thin wrapper around the local Python sidecar */
window.RetroAPI = (() => {
  const base =
    (window.retro && window.retro.apiBase) || `http://127.0.0.1:8765`;

  async function j(path, opts) {
    const r = await fetch(base + path, opts);
    let data = null;
    try {
      data = await r.json();
    } catch (_) {
      /* non-json */
    }
    if (!r.ok) throw new Error((data && data.error) || `HTTP ${r.status}`);
    return data;
  }

  return {
    base,
    health: () => j('/health'),
    auth: (headers) =>
      j('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers }),
      }),
    search: (q) => j('/search?q=' + encodeURIComponent(q)),
    videoSearch: (q) => j('/video-search?q=' + encodeURIComponent(q)),
    playlists: () => j('/playlists'),
    playlist: (id) => j('/playlist/' + encodeURIComponent(id)),
    librarySongs: () => j('/library-songs'),
    related: (vid) => j('/related/' + encodeURIComponent(vid)),
    home: () => j('/home'),
    artists: () => j('/artists'),
    artist: (id) => j('/artist/' + encodeURIComponent(id)),
    searchArtists: (q) => j('/search-artists?q=' + encodeURIComponent(q)),
    suggestedArtists: (seeds) =>
      j(
        '/suggested-artists' +
          (seeds && seeds.length
            ? '?seeds=' + encodeURIComponent(seeds.join(','))
            : '')
      ),
    rate: (videoId, rating) =>
      j('/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, rating }),
      }),
    download: (vid, dir) =>
      j(
        '/download?v=' +
          encodeURIComponent(vid) +
          (dir ? '&dir=' + encodeURIComponent(dir) : '')
      ),
    // a same-origin URL that streams a video's audio (for embed-blocked tracks)
    streamUrl: (vid) => base + '/stream?v=' + encodeURIComponent(vid),
    // fire-and-forget: download a track's audio into the sidecar cache now
    warmStream: (vid) =>
      fetch(base + '/stream?v=' + encodeURIComponent(vid) + '&warm=1').catch(
        () => {}
      ),
    createPlaylist: (title, videoIds) =>
      j('/playlist/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, videoIds: videoIds || [] }),
      }),
    addToPlaylist: (id, videoIds) =>
      j('/playlist/' + encodeURIComponent(id) + '/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds }),
      }),
    removeFromPlaylist: (id, items) =>
      j('/playlist/' + encodeURIComponent(id) + '/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }),
    movePlaylistItem: (id, moved, before) =>
      j('/playlist/' + encodeURIComponent(id) + '/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moved, before: before || '' }),
      }),
    renamePlaylist: (id, title) =>
      j('/playlist/' + encodeURIComponent(id) + '/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      }),
    deletePlaylist: (id) =>
      j('/playlist/' + encodeURIComponent(id) + '/delete', { method: 'POST' }),
  };
})();
