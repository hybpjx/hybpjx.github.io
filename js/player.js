(function () {
  function readConfig() {
    var node = document.getElementById('site-player-data');
    if (!node) {
      return null;
    }

    try {
      return JSON.parse(node.textContent || node.innerText || '{}');
    } catch (error) {
      return null;
    }
  }

  function initPlayer() {
    if (!window.APlayer) {
      return;
    }

    var root = document.getElementById('site-player');
    var payload = readConfig();

    if (!root || !payload || !payload.audio || !payload.audio.length || root.dataset.playerReady === '1') {
      return;
    }

    root.dataset.playerReady = '1';

    new APlayer({
      container: root,
      fixed: true,
      mini: true,
      autoplay: false,
      loop: 'all',
      order: 'list',
      preload: 'metadata',
      volume: typeof payload.volume === 'number' ? payload.volume : 0.8,
      mutex: true,
      listFolded: true,
      listMaxHeight: '320px',
      theme: payload.theme || '#69c585',
      audio: payload.audio
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayer, { once: true });
  } else {
    initPlayer();
  }
})();
