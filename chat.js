(function () {
  'use strict';

  // ============================================================
  // Config & i18n
  // ============================================================
  const CONFIG = {
    BROKERS: ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'],
    TOPIC_PREFIX: 'minichat/v2/',
    MAX_MSG_LEN: 2000,
    MAX_IMG_KB: 200,
    MAX_AUDIO_KB: 200,
    MAX_FILE_KB: 500,
    MAX_PAYLOAD_CHARS: 500000,
    PRESENCE_INTERVAL: 15000,
    PRESENCE_TIMEOUT: 45000,
    TYPING_TIMEOUT: 2500,
  };

  const TRANSLATIONS = {
    en: {
      title: 'MiniChat', room: 'room', nickname: 'nickname',
      connect: 'Connect', disconnect: 'Disconnect', send: 'Send',
      typeMsg: 'Type a message…', offline: 'Offline', online: 'Online',
      connecting: 'Connecting...', reconnecting: 'Reconnecting...',
      tapConnect: 'Tap connect to join',
      joined: 'Joined room "{room}" as {nick}', left: 'You left the room',
      userJoined: '{nick} joined', userLeft: '{nick} left',
      tooLargeImg: 'Image too large (max {kb} KB)',
      tooLargeAudio: 'Audio too large (max {kb} KB)',
      tooLargeFile: 'File too large (max {kb} KB)',
      micDenied: 'Microphone access denied',
      noBroker: 'Could not connect to any MQTT broker.',
      recording: 'Recording…',
      help: 'Commands: /roll, /coin, /8ball <q>, /nick <name>, /clear, /help',
      rolled: '🎲 You rolled a {num}', coin: '🪙 {res}', eightBall: '🎱 {res}',
      nickChanged: 'Nickname changed to {nick}', cleared: 'Chat cleared',
      today: 'Today', yesterday: 'Yesterday',
      searchResults: '{n} result(s)', typing: 'typing…',
      reply: 'Reply', copy: 'Copy', delete: 'Delete', star: 'Star', unstar: 'Unstar',
      cancel: 'Cancel', edited: 'edited', deleted: 'This message was deleted',
      you: 'You', anon: 'anon', members: 'Members',
      msgDeleted: 'Message deleted', copied: 'Copied',
      youDeleted: 'You deleted this message',
      file: 'Document', image: 'Image',
      selCount: '{n} selected', forward: 'Forward', forwardTo: 'Forward to…',
      noStarred: 'No starred messages', starredFilterOn: 'Showing starred only',
      queued: 'Queued (offline)', sent: 'Sent', exported: 'Chat exported',
    },
    es: {
      title: 'MiniChat', room: 'sala', nickname: 'apodo',
      connect: 'Conectar', disconnect: 'Desconectar', send: 'Enviar',
      typeMsg: 'Escribe un mensaje…', offline: 'Desconectado', online: 'En línea',
      connecting: 'Conectando...', reconnecting: 'Reconectando...',
      tapConnect: 'Toca conectar para unirte',
      joined: 'Te uniste a "{room}" como {nick}', left: 'Saliste de la sala',
      userJoined: '{nick} se unió', userLeft: '{nick} salió',
      tooLargeImg: 'Imagen muy grande (máx {kb} KB)',
      tooLargeAudio: 'Audio muy grande (máx {kb} KB)',
      tooLargeFile: 'Archivo muy grande (máx {kb} KB)',
      micDenied: 'Micrófono denegado',
      noBroker: 'No se pudo conectar a ningún broker MQTT.',
      recording: 'Grabando…',
      help: 'Comandos: /roll, /coin, /8ball <p>, /nick <nombre>, /clear, /help',
      rolled: '🎲 Sacaste un {num}', coin: '🪙 {res}', eightBall: '🎱 {res}',
      nickChanged: 'Apodo cambiado a {nick}', cleared: 'Chat limpiado',
      today: 'Hoy', yesterday: 'Ayer',
      searchResults: '{n} resultado(s)', typing: 'escribiendo…',
      reply: 'Responder', copy: 'Copiar', delete: 'Eliminar', star: 'Destacar', unstar: 'Quitar',
      cancel: 'Cancelar', edited: 'editado', deleted: 'Mensaje eliminado',
      you: 'Tú', anon: 'anon', members: 'Miembros',
      msgDeleted: 'Mensaje eliminado', copied: 'Copiado',
      youDeleted: 'Eliminaste este mensaje',
      file: 'Documento', image: 'Imagen',
      selCount: '{n} seleccionado(s)', forward: 'Reenviar', forwardTo: 'Reenviar a…',
      noStarred: 'Sin mensajes destacados', starredFilterOn: 'Mostrando solo destacados',
      queued: 'En cola (offline)', sent: 'Enviado', exported: 'Chat exportado',
    },
  };

  const EMOJIS = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵','🥶','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','👍','👎','👌','✌️','🤞','🤟','🤘','👏','🙌','🙏','💪','❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','💕','💞','💓','💗','💖','💘','💝','🔥','⭐','✨','💯','🎉','🎊','🎈','🎁','🎂','🍕','🍔','🍟','🍺','☕','⚽','🏀','🎮','🎵','🚀','🌈'];

  const QUICK_REACTIONS = ['👍','❤️','😂','😮','😢','🙏'];

  // ============================================================
  // State
  // ============================================================
  const state = {
    client: null,
    topic: '',
    room: 'lobby',
    nickname: '',
    clientId: 'mc_' + Math.random().toString(36).slice(2, 10),
    lang: 'en',
    theme: 'whatsapp',
    peers: new Map(),
    messages: new Map(),
    messageOrder: [],
    lastDate: '',
    replyTo: null,
    unread: 0,
    typingTimer: null,
    presenceTimer: null,
    presenceSweep: null,
    recording: false,
    mediaRecorder: null,
    audioChunks: [],
    lastTypingPublish: 0,
    editingId: null,
    selection: new Set(),
    selectionMode: false,
    starredFilter: false,
    soundOn: true,
    offlineQueue: [],
    mentionIndex: -1,
    mentionItems: [],
    dragging: 0,
  };

  // ============================================================
  // DOM
  // ============================================================
  const $ = (s) => document.querySelector(s);
  const dom = {
    sidebar: $('#sidebar'),
    sidebarToggle: $('#sidebarToggle'),
    selfAvatar: $('#selfAvatar'), selfName: $('#selfName'), selfStatus: $('#selfStatus'),
    memberList: $('#memberList'), memberCount: $('#memberCount'),
    room: $('#room'), nickname: $('#nickname'),
    connectBtn: $('#connectBtn'), disconnectBtn: $('#disconnectBtn'),
    themeSelect: $('#themeSelect'), langSelect: $('#langSelect'),
    fontSize: $('#fontSize'), fontSizeLabel: $('#fontSizeLabel'),
    soundToggle: $('#soundToggle'), exportBtn: $('#exportBtn'),
    roomAvatar: $('#roomAvatar'), roomName: $('#roomName'), roomStatus: $('#roomStatus'),
    starFilterBtn: $('#starFilterBtn'),
    searchBtn: $('#searchBtn'), searchBar: $('#searchBar'), searchInput: $('#searchInput'),
    searchCount: $('#searchCount'), searchClose: $('#searchClose'),
    selectionBar: $('#selectionBar'), selClose: $('#selClose'), selCount: $('#selCount'),
    selStar: $('#selStar'), selCopy: $('#selCopy'), selForward: $('#selForward'), selDelete: $('#selDelete'),
    messages: $('#messages'),
    scrollDown: $('#scrollDown'), unreadBadge: $('#unreadBadge'),
    dropOverlay: $('#dropOverlay'),
    composerForm: $('#composerForm'), text: $('#text'), sendBtn: $('#sendBtn'),
    emojiBtn: $('#emojiBtn'), attachBtn: $('#attachBtn'), attachMenu: $('#attachMenu'),
    audioBtn: $('#audioBtn'), mentionsDrop: $('#mentionsDrop'),
    replyPreview: $('#replyPreview'), replyClose: $('#replyClose'),
    imageInput: $('#imageInput'), fileInput: $('#fileInput'),
    contextMenu: $('#contextMenu'), emojiPicker: $('#emojiPicker'),
    lightbox: $('#lightbox'), lightboxImg: $('#lightboxImg'),
    forwardModal: $('#forwardModal'), forwardRoom: $('#forwardRoom'),
    forwardCancel: $('#forwardCancel'), forwardGo: $('#forwardGo'),
    toasts: $('#toasts'),
  };

  // ============================================================
  // Utils
  // ============================================================
  function t(key, vars = {}) {
    let str = (TRANSLATIONS[state.lang] && TRANSLATIONS[state.lang][key]) || key;
    for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
    return str;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function initials(name) {
    if (!name) return '?';
    const parts = String(name).trim().split(/\s+/);
    return ((parts[0][0] || '?') + (parts[1] ? parts[1][0] : '')).toUpperCase().slice(0, 2);
  }
  function colorFor(id) {
    let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return `hsl(${Math.abs(h) % 360}, 55%, 48%)`;
  }
  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(ts) {
    const d = new Date(ts);
    const today = new Date(); today.setHours(0,0,0,0);
    const yest = new Date(today); yest.setDate(yest.getDate() - 1);
    const dd = new Date(d); dd.setHours(0,0,0,0);
    if (dd.getTime() === today.getTime()) return t('today');
    if (dd.getTime() === yest.getTime()) return t('yesterday');
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function showToast(msg, type = 'info', timeout = 4000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    dom.toasts.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, timeout);
  }
  function setStatus(text, cls = '') {
    dom.roomStatus.textContent = text;
    dom.roomStatus.className = 'chat-head-status' + (cls ? ' ' + cls : '');
  }
  function playSound() {
    if (!state.soundOn) return;
    try {
      const ctx = playSound.ctx || (playSound.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine'; o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      o.start(); o.stop(ctx.currentTime + 0.26);
    } catch (e) {}
  }
  function browserNotify(title, body) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') new Notification(title, { body });
    else if (Notification.permission !== 'denied') Notification.requestPermission();
  }
  function cssEscape(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  // ============================================================
  // Markdown + linkify + mentions
  // ============================================================
  function renderRichText(raw) {
    if (!raw) return '';
    // Split out fenced code blocks first
    const parts = [];
    const re = /```([\s\S]*?)```/g;
    let last = 0, m;
    while ((m = re.exec(raw))) {
      parts.push({ type: 'text', value: raw.slice(last, m.index) });
      parts.push({ type: 'code', value: m[1] });
      last = m.index + m[0].length;
    }
    parts.push({ type: 'text', value: raw.slice(last) });
    return parts.map((p) => p.type === 'code'
      ? `<pre><code>${escapeHtml(p.value.replace(/^\n/, ''))}</code></pre>`
      : inlineFormat(p.value)
    ).join('');
  }
  function inlineFormat(text) {
    let s = escapeHtml(text);
    // Inline code
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    s = s.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g, '$1<strong>$2</strong>');
    // Italic
    s = s.replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g, '$1<em>$2</em>');
    // Strikethrough
    s = s.replace(/(^|\W)~([^~\n]+)~(?=\W|$)/g, '$1<del>$2</del>');
    // Auto-link URLs
    s = s.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    // Mentions
    s = s.replace(/(^|\s)@([\w\-]{1,32})/g, '$1<span class="mention">@$2</span>');
    return s;
  }

  // ============================================================
  // Theme / Language / Prefs
  // ============================================================
  function initTheme() {
    state.theme = localStorage.getItem('minichat_theme') || 'whatsapp';
    document.documentElement.setAttribute('data-theme', state.theme);
    dom.themeSelect.value = state.theme;
    dom.themeSelect.addEventListener('change', () => {
      state.theme = dom.themeSelect.value;
      document.documentElement.setAttribute('data-theme', state.theme);
      localStorage.setItem('minichat_theme', state.theme);
    });
  }
  function initLang() {
    state.lang = localStorage.getItem('minichat_lang') || 'en';
    dom.langSelect.value = state.lang;
    dom.langSelect.addEventListener('change', () => {
      state.lang = dom.langSelect.value;
      localStorage.setItem('minichat_lang', state.lang);
      updateUILanguage();
      state.messageOrder.forEach((id) => rerenderMessage(id));
    });
    updateUILanguage();
  }
  function updateUILanguage() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n');
      if (TRANSLATIONS[state.lang][k]) el.textContent = TRANSLATIONS[state.lang][k];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const k = el.getAttribute('data-i18n-placeholder');
      if (TRANSLATIONS[state.lang][k]) el.placeholder = TRANSLATIONS[state.lang][k];
    });
    if (state.client && state.client.connected) setStatus(t('online'));
    else setStatus(t('tapConnect'));
    updateSelfAvatar();
  }
  function initFontSize() {
    const v = parseInt(localStorage.getItem('minichat_fontSize') || '100', 10);
    dom.fontSize.value = v;
    applyFontSize(v);
    dom.fontSize.addEventListener('input', () => {
      const n = parseInt(dom.fontSize.value, 10);
      applyFontSize(n);
      localStorage.setItem('minichat_fontSize', n);
    });
  }
  function applyFontSize(v) {
    document.documentElement.style.setProperty('--font-scale', v / 100);
    dom.fontSizeLabel.textContent = v + '%';
  }
  function initSound() {
    state.soundOn = localStorage.getItem('minichat_sound') !== 'off';
    dom.soundToggle.checked = state.soundOn;
    dom.soundToggle.addEventListener('change', () => {
      state.soundOn = dom.soundToggle.checked;
      localStorage.setItem('minichat_sound', state.soundOn ? 'on' : 'off');
    });
  }
  function updateSelfAvatar() {
    dom.selfName.textContent = state.nickname || t('you');
    dom.selfAvatar.textContent = initials(state.nickname || 'You');
    dom.selfAvatar.style.background = colorFor(state.clientId);
    dom.selfStatus.textContent = (state.client && state.client.connected) ? t('online') : t('offline');
  }

  // ============================================================
  // Commands
  // ============================================================
  function handleCommand(text) {
    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    switch (cmd) {
      case '/help': appendSystem(t('help')); return true;
      case '/clear':
        dom.messages.innerHTML = ''; state.messages.clear(); state.messageOrder = [];
        state.lastDate = ''; appendSystem(t('cleared')); return true;
      case '/nick':
        if (parts[1]) {
          state.nickname = parts[1]; dom.nickname.value = state.nickname;
          localStorage.setItem('minichat_nickname', state.nickname);
          updateSelfAvatar(); appendSystem(t('nickChanged', { nick: state.nickname }));
        }
        return true;
      case '/roll': appendSystem(t('rolled', { num: Math.floor(Math.random() * 100) + 1 })); return true;
      case '/coin': appendSystem(t('coin', { res: Math.random() < 0.5 ? 'Heads!' : 'Tails!' })); return true;
      case '/8ball': {
        const answers = ['Yes.', 'No.', 'Maybe.', 'Definitely.', 'Absolutely not.', 'Ask again later.', 'Without a doubt.'];
        appendSystem(t('eightBall', { res: answers[Math.floor(Math.random() * answers.length)] }));
        return true;
      }
      default: return false;
    }
  }

  // ============================================================
  // MQTT
  // ============================================================
  function connect() {
    if (state.client) return;
    state.room = (dom.room.value || 'lobby').trim();
    state.nickname = (dom.nickname.value || 'anon-' + Math.random().toString(36).slice(2, 6)).trim();
    state.topic = CONFIG.TOPIC_PREFIX + state.room;
    localStorage.setItem('minichat_room', state.room);
    localStorage.setItem('minichat_nickname', state.nickname);
    dom.roomName.textContent = state.room;
    dom.roomAvatar.textContent = '#' + state.room.slice(0, 1).toUpperCase();
    dom.roomAvatar.style.background = colorFor(state.room);
    updateSelfAvatar();

    let brokerIndex = 0;
    function tryNext() {
      if (brokerIndex >= CONFIG.BROKERS.length) {
        setStatus(t('noBroker')); showToast(t('noBroker'), 'error', 6000); return;
      }
      const broker = CONFIG.BROKERS[brokerIndex++];
      setStatus(t('connecting'));

      const c = mqtt.connect(broker, {
        clientId: state.clientId, clean: true, reconnectPeriod: 5000,
        connectTimeout: 10000, keepalive: 30,
      });

      let connected = false;
      c.on('connect', () => {
        connected = true; state.client = c;
        setStatus(t('online'));
        dom.connectBtn.disabled = true;
        dom.disconnectBtn.disabled = false;
        dom.text.disabled = false;
        dom.sendBtn.disabled = false;
        updateSelfAvatar();
        c.subscribe(state.topic, { qos: 0 }, (err) => {
          if (!err) {
            appendSystem(t('joined', { room: state.room, nick: state.nickname }));
            publish({ type: 'join' });
            publish({ type: 'presence' });
            state.presenceTimer = setInterval(() => publish({ type: 'presence' }), CONFIG.PRESENCE_INTERVAL);
            state.presenceSweep = setInterval(sweepPeers, 10000);
            renderMembers();
            flushOfflineQueue();
          }
        });
      });
      c.on('message', (topic, payload) => { if (topic === state.topic) handleIncoming(payload); });
      c.on('error', (err) => {
        console.warn('[MiniChat]', err);
        if (!connected) { c.end(true); tryNext(); }
      });
      c.on('close', () => {
        if (state.client === c) {
          setStatus(t('offline'));
          dom.text.disabled = true; dom.sendBtn.disabled = true;
        }
      });
      c.on('reconnect', () => setStatus(t('reconnecting')));
    }
    tryNext();
  }

  function disconnect() {
    if (!state.client) return;
    publish({ type: 'leave' });
    publish({ type: 'presence', offline: true });
    clearInterval(state.presenceTimer); clearInterval(state.presenceSweep);
    state.client.end(true); state.client = null;
    state.peers.clear(); renderMembers();
    setStatus(t('tapConnect'));
    dom.connectBtn.disabled = false; dom.disconnectBtn.disabled = true;
    dom.text.disabled = true; dom.sendBtn.disabled = true;
    updateSelfAvatar();
    appendSystem(t('left'));
  }

  function publish(obj, queueIfOffline) {
    const payload = JSON.stringify({ ...obj, clientId: state.clientId, nickname: state.nickname, ts: obj.ts || Date.now(), msgId: obj.msgId || uid() });
    if (!state.client || !state.client.connected) {
      if (queueIfOffline) state.offlineQueue.push(payload);
      return false;
    }
    if (payload.length > CONFIG.MAX_PAYLOAD_CHARS) {
      showToast('Payload too large', 'error');
      return false;
    }
    state.client.publish(state.topic, payload, { qos: 0 });
    return true;
  }
  function flushOfflineQueue() {
    if (!state.offlineQueue.length) return;
    const q = state.offlineQueue.slice();
    state.offlineQueue = [];
    q.forEach((p) => state.client.publish(state.topic, p, { qos: 0 }));
    if (q.length) showToast(`${q.length} queued message(s) sent`, 'success', 2500);
  }

  function handleIncoming(payload) {
    let msg;
    try { msg = JSON.parse(payload.toString()); } catch (e) { return; }
    if (!msg || typeof msg !== 'object' || !msg.type) return;
    if (msg.clientId === state.clientId) return;

    if (msg.clientId) {
      const prev = state.peers.get(msg.clientId);
      state.peers.set(msg.clientId, {
        nickname: msg.nickname || (prev && prev.nickname) || 'anon',
        lastSeen: Date.now(),
        typing: msg.type === 'typing' ? !!msg.on : (prev ? prev.typing : false),
      });
      renderMembers();
    }

    switch (msg.type) {
      case 'join':    appendSystem(t('userJoined', { nick: msg.nickname || 'anon' })); break;
      case 'leave':   appendSystem(t('userLeft', { nick: msg.nickname || 'anon' })); break;
      case 'presence':
        if (msg.offline) { state.peers.delete(msg.clientId); renderMembers(); }
        break;
      case 'typing':  renderTypingIndicator(); break;
      case 'msg':     handleChat(msg); break;
      case 'img':     handleChat(msg); break;
      case 'audio':   handleChat(msg); break;
      case 'file':    handleChat(msg); break;
      case 'ack':     handleAck(msg); break;
      case 'react':   handleReact(msg); break;
      case 'delete':  handleDelete(msg); break;
      case 'edit':    handleEdit(msg); break;
    }
  }

  function handleChat(msg) {
    if (state.messages.has(msg.msgId)) return;
    publish({ type: 'ack', msgId: msg.msgId, status: 'delivered', to: msg.clientId });
    if (document.hidden || !isNearBottom()) {
      state.unread++; updateUnreadBadge(); playSound();
      browserNotify(msg.nickname || 'anon', previewText(msg));
    }
    appendChatMessage(msg, false);
    setTimeout(() => publish({ type: 'ack', msgId: msg.msgId, status: 'read', to: msg.clientId }), 800);
  }
  function handleAck(msg) {
    const m = state.messages.get(msg.msgId);
    if (!m || m.clientId !== state.clientId) return;
    if (msg.status === 'read') m._status = 'read';
    else if (msg.status === 'delivered' && m._status !== 'read') m._status = 'delivered';
    updateTicks(msg.msgId);
  }
  function handleReact(msg) {
    const m = state.messages.get(msg.msgId); if (!m) return;
    m.reactions = m.reactions || {};
    if (msg.remove) {
      if (m.reactions[msg.emoji]) {
        m.reactions[msg.emoji] = m.reactions[msg.emoji].filter((id) => id !== msg.clientId);
        if (!m.reactions[msg.emoji].length) delete m.reactions[msg.emoji];
      }
    } else {
      if (!m.reactions[msg.emoji]) m.reactions[msg.emoji] = [];
      if (!m.reactions[msg.emoji].includes(msg.clientId)) m.reactions[msg.emoji].push(msg.clientId);
    }
    renderReactions(msg.msgId);
  }
  function handleDelete(msg) {
    const m = state.messages.get(msg.msgId); if (!m) return;
    m.deleted = true; m.text = ''; m.data = null;
    rerenderMessage(msg.msgId);
  }
  function handleEdit(msg) {
    const m = state.messages.get(msg.msgId);
    if (!m || m.clientId !== msg.clientId) return;
    m.text = msg.text; m.edited = true;
    rerenderMessage(msg.msgId);
  }
  function sweepPeers() {
    const now = Date.now(); let changed = false;
    for (const [id, p] of state.peers) {
      if (now - p.lastSeen > CONFIG.PRESENCE_TIMEOUT) { state.peers.delete(id); changed = true; }
    }
    if (changed) renderMembers();
    renderTypingIndicator();
  }

  // ============================================================
  // Rendering
  // ============================================================
  function isNearBottom() {
    return dom.messages.scrollHeight - dom.messages.scrollTop - dom.messages.clientHeight < 120;
  }
  function scrollToBottom(smooth = true) {
    dom.messages.scrollTo({ top: dom.messages.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    state.unread = 0; updateUnreadBadge(); dom.scrollDown.hidden = true;
  }
  function updateUnreadBadge() {
    dom.unreadBadge.textContent = state.unread > 0 ? (state.unread > 99 ? '99+' : state.unread) : '';
    dom.scrollDown.hidden = state.unread === 0 && isNearBottom();
  }
  function previewText(msg) {
    if (msg.type === 'img') return '📷 Image';
    if (msg.type === 'audio') return '🎤 Voice message';
    if (msg.type === 'file') return '📄 ' + (msg.fileName || 'File');
    return msg.text || '';
  }
  function appendDateDividerIfNeeded(ts) {
    const key = formatDate(ts);
    if (key !== state.lastDate) {
      state.lastDate = key;
      const d = document.createElement('div');
      d.className = 'date-divider'; d.textContent = key;
      dom.messages.appendChild(d);
    }
  }
  function appendSystem(text) {
    const d = document.createElement('div');
    d.className = 'system date-divider';
    d.textContent = text;
    dom.messages.appendChild(d);
    scrollToBottom();
  }

  function appendChatMessage(msg, own) {
    state.messages.set(msg.msgId, { ...msg, _status: own ? 'sent' : 'read' });
    state.messageOrder.push(msg.msgId);
    appendDateDividerIfNeeded(msg.ts);
    const prev = state.messageOrder[state.messageOrder.length - 2];
    const prevMsg = prev ? state.messages.get(prev) : null;
    const grouped = prevMsg && prevMsg.clientId === msg.clientId && (msg.ts - prevMsg.ts) < 120000 && !msg.replyTo;
    const el = buildMessageEl(msg.msgId, grouped);
    dom.messages.appendChild(el);
    if (own || isNearBottom()) scrollToBottom();
    else { state.unread++; updateUnreadBadge(); }
  }

  function rerenderMessage(msgId) {
    const old = dom.messages.querySelector(`[data-msgid="${cssEscape(msgId)}"]`);
    if (!old) return;
    const grouped = old.classList.contains('grouped');
    const el = buildMessageEl(msgId, grouped);
    old.replaceWith(el);
  }

  function buildMessageEl(msgId, grouped) {
    const m = state.messages.get(msgId);
    const own = m.clientId === state.clientId;
    const el = document.createElement('div');
    el.className = 'message' + (own ? ' own' : '') + (grouped ? ' grouped' : '');
    if (state.selection.has(msgId)) el.classList.add('selected');
    el.dataset.msgid = msgId;

    const av = document.createElement('div');
    av.className = 'avatar';
    av.textContent = initials(m.nickname);
    av.style.background = colorFor(m.clientId);
    el.appendChild(av);

    const wrap = document.createElement('div');
    wrap.className = 'bubble-wrap';
    el.appendChild(wrap);

    if (!own) {
      const sn = document.createElement('div');
      sn.className = 'msg-sender';
      sn.textContent = m.nickname || t('anon');
      sn.style.color = colorFor(m.clientId);
      wrap.appendChild(sn);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    wrap.appendChild(bubble);

    if (m.starred) {
      const st = document.createElement('span');
      st.className = 'msg-star'; st.textContent = '⭐';
      bubble.appendChild(st);
    }

    if (m.deleted) {
      const it = document.createElement('i');
      it.style.opacity = '0.6';
      it.textContent = own ? t('youDeleted') : t('msgDeleted');
      bubble.appendChild(it);
    } else {
      if (m.replyTo) {
        const rq = document.createElement('div');
        rq.className = 'reply-quote';
        rq.innerHTML = `<div class="rq-name">${escapeHtml(m.replyTo.nickname || '')}</div><div class="rq-text">${escapeHtml(m.replyTo.text || '')}</div>`;
        rq.addEventListener('click', () => jumpToMessage(m.replyTo.msgId));
        bubble.appendChild(rq);
      }

      if (m.type === 'img' && m.data) {
        const img = document.createElement('img');
        img.src = m.data; img.alt = 'image';
        img.addEventListener('click', () => { if (!state.selectionMode) openLightbox(m.data); });
        bubble.appendChild(img);
      } else if (m.type === 'audio' && m.data) {
        const au = document.createElement('audio');
        au.controls = true; au.src = m.data;
        bubble.appendChild(au);
      } else if (m.type === 'file' && m.data) {
        const a = document.createElement('a');
        a.className = 'file-link'; a.href = m.data; a.download = m.fileName || 'file';
        a.innerHTML = `<span class="file-icon">📄</span><span class="file-name">${escapeHtml(m.fileName || 'file')}</span>`;
        bubble.appendChild(a);
      } else {
        const span = document.createElement('span');
        span.innerHTML = renderRichText(m.text || '');
        bubble.appendChild(span);
      }
    }

    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    const time = document.createElement('span');
    time.textContent = formatTime(m.ts);
    meta.appendChild(time);
    if (m.edited) {
      const ed = document.createElement('span');
      ed.textContent = ' · ' + t('edited');
      meta.appendChild(ed);
    }
    if (own && !m.deleted) {
      const ticks = document.createElement('span');
      ticks.className = 'ticks ' + (m._status || 'sent');
      ticks.textContent = m._status === 'sent' ? '✓' : '✓✓';
      meta.appendChild(ticks);
    }
    bubble.appendChild(meta);

    if (m.reactions && Object.keys(m.reactions).length) {
      const r = document.createElement('div');
      r.className = 'reactions';
      Object.entries(m.reactions).forEach(([emoji, users]) => {
        const pill = document.createElement('div');
        pill.className = 'reaction' + (users.includes(state.clientId) ? ' mine' : '');
        pill.innerHTML = `${emoji}<span class="r-count">${users.length}</span>`;
        pill.addEventListener('click', (e) => { e.stopPropagation(); toggleReaction(msgId, emoji); });
        r.appendChild(pill);
      });
      wrap.appendChild(r);
    }

    bubble.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!m.deleted) showContextMenu(msgId, e.clientX, e.clientY);
    });
    bubble.addEventListener('dblclick', () => {
      if (!m.deleted && !state.selectionMode) toggleReaction(msgId, '❤️');
    });
    bubble.addEventListener('click', (e) => {
      if (state.selectionMode) { e.preventDefault(); toggleSelection(msgId); }
    });

    return el;
  }

  function updateTicks(msgId) {
    const el = dom.messages.querySelector(`[data-msgid="${cssEscape(msgId)}"]`);
    if (!el) return;
    const m = state.messages.get(msgId);
    const ticks = el.querySelector('.ticks'); if (!ticks) return;
    ticks.className = 'ticks ' + (m._status || 'sent');
    ticks.textContent = m._status === 'sent' ? '✓' : '✓✓';
  }
  function renderReactions(msgId) {
    const el = dom.messages.querySelector(`[data-msgid="${cssEscape(msgId)}"]`);
    if (!el) return;
    const wrap = el.querySelector('.bubble-wrap');
    let r = wrap.querySelector('.reactions'); if (r) r.remove();
    const m = state.messages.get(msgId);
    if (!m.reactions || !Object.keys(m.reactions).length) return;
    r = document.createElement('div');
    r.className = 'reactions';
    Object.entries(m.reactions).forEach(([emoji, users]) => {
      const pill = document.createElement('div');
      pill.className = 'reaction' + (users.includes(state.clientId) ? ' mine' : '');
      pill.innerHTML = `${emoji}<span class="r-count">${users.length}</span>`;
      pill.addEventListener('click', () => toggleReaction(msgId, emoji));
      r.appendChild(pill);
    });
    wrap.appendChild(r);
  }
  function jumpToMessage(msgId) {
    const el = dom.messages.querySelector(`[data-msgid="${cssEscape(msgId)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const b = el.querySelector('.bubble');
    b.style.outline = '2px solid var(--accent)';
    setTimeout(() => { b.style.outline = ''; }, 1200);
  }
  function renderMembers() {
    dom.memberList.innerHTML = '';
    const self = document.createElement('li');
    self.innerHTML = `<div class="avatar sm" style="background:${colorFor(state.clientId)}">${escapeHtml(initials(state.nickname || 'You'))}</div>
      <div class="member-info"><div class="member-name">${escapeHtml(state.nickname || t('you'))} (you)</div>
      <div class="member-sub">${state.client && state.client.connected ? t('online') : t('offline')}</div></div>
      <span class="dot ${state.client && state.client.connected ? '' : 'off'}"></span>`;
    dom.memberList.appendChild(self);
    state.peers.forEach((p, id) => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="avatar sm" style="background:${colorFor(id)}">${escapeHtml(initials(p.nickname))}</div>
        <div class="member-info"><div class="member-name">${escapeHtml(p.nickname || t('anon'))}</div>
        <div class="member-sub">${t('online')}</div></div>
        <span class="dot"></span>`;
      dom.memberList.appendChild(li);
    });
    dom.memberCount.textContent = state.peers.size + (state.client && state.client.connected ? 1 : 0);
  }
  function renderTypingIndicator() {
    const typers = [];
    state.peers.forEach((p) => { if (p.typing) typers.push(p.nickname); });
    if (typers.length) setStatus(`${typers.slice(0, 2).join(', ')} ${t('typing')}`, 'typing');
    else if (state.client && state.client.connected) setStatus(t('online'));

    let tb = document.getElementById('typingBubble');
    if (typers.length) {
      if (!tb) {
        tb = document.createElement('div');
        tb.id = 'typingBubble'; tb.className = 'message';
        const av = document.createElement('div');
        av.className = 'avatar'; av.textContent = initials(typers[0]);
        av.style.background = colorFor('typing');
        tb.appendChild(av);
        const wrap = document.createElement('div');
        wrap.className = 'bubble-wrap';
        const b = document.createElement('div');
        b.className = 'bubble typing-bubble';
        b.innerHTML = '<span></span><span></span><span></span>';
        wrap.appendChild(b); tb.appendChild(wrap);
        dom.messages.appendChild(tb);
      } else dom.messages.appendChild(tb);
      if (isNearBottom()) scrollToBottom();
    } else if (tb) tb.remove();
  }

  // ============================================================
  // Reactions, replies, selection
  // ============================================================
  function toggleReaction(msgId, emoji) {
    const m = state.messages.get(msgId); if (!m) return;
    const reactions = m.reactions || (m.reactions = {});
    const users = reactions[emoji] || (reactions[emoji] = []);
    const has = users.includes(state.clientId);
    if (has) {
      reactions[emoji] = users.filter((u) => u !== state.clientId);
      if (!reactions[emoji].length) delete reactions[emoji];
      publish({ type: 'react', msgId, emoji, remove: true });
    } else {
      users.push(state.clientId);
      publish({ type: 'react', msgId, emoji });
    }
    renderReactions(msgId);
  }
  function setReply(msgId) {
    const m = state.messages.get(msgId);
    if (!m || m.deleted) return;
    state.replyTo = { msgId, nickname: m.nickname || t('anon'), text: previewText(m) };
    dom.replyPreview.hidden = false;
    dom.replyPreview.querySelector('.reply-name').textContent = m.nickname || t('anon');
    dom.replyPreview.querySelector('.reply-text').textContent = previewText(m);
    dom.text.focus();
  }
  function clearReply() { state.replyTo = null; dom.replyPreview.hidden = true; }

  function toggleSelection(msgId) {
    if (state.selection.has(msgId)) state.selection.delete(msgId);
    else state.selection.add(msgId);
    if (state.selection.size === 0) exitSelection();
    else {
      state.selectionMode = true;
      dom.selectionBar.hidden = false;
      dom.selCount.textContent = t('selCount', { n: state.selection.size });
      const el = dom.messages.querySelector(`[data-msgid="${cssEscape(msgId)}"]`);
      if (el) el.classList.toggle('selected', state.selection.has(msgId));
    }
  }
  function exitSelection() {
    state.selectionMode = false;
    state.selection.clear();
    dom.selectionBar.hidden = true;
    dom.messages.querySelectorAll('.message.selected').forEach((m) => m.classList.remove('selected'));
  }
  function clearSelectionAfterAction() { exitSelection(); }

  // ============================================================
  // Context menu / emoji picker / lightbox
  // ============================================================
  function showContextMenu(msgId, x, y) {
    dom.contextMenu.innerHTML = '';
    const m = state.messages.get(msgId); if (!m) return;
    const own = m.clientId === state.clientId;

    const row = document.createElement('div');
    row.className = 'emoji-row';
    QUICK_REACTIONS.forEach((e) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = e;
      b.addEventListener('click', () => { toggleReaction(msgId, e); hideContextMenu(); });
      row.appendChild(b);
    });
    dom.contextMenu.appendChild(row);

    const add = (label, action) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label;
      b.addEventListener('click', () => { action(); hideContextMenu(); });
      dom.contextMenu.appendChild(b);
    };
    add('↩️ ' + t('reply'), () => setReply(msgId));
    add('☑️ Select', () => { state.selectionMode = true; toggleSelection(msgId); });
    if (m.type === 'msg') add('📋 ' + t('copy'), () => {
      navigator.clipboard.writeText(m.text || '').then(() => showToast(t('copied'), 'success', 1500));
    });
    add(m.starred ? '☆ ' + t('unstar') : '⭐ ' + t('star'), () => {
      m.starred = !m.starred;
      rerenderMessage(msgId);
      if (state.starredFilter) applyStarFilter();
    });
    if (own) {
      if (m.type === 'msg') add('✏️ Edit', () => startEdit(msgId));
      add('🗑️ ' + t('delete'), () => {
        m.deleted = true; m.text = ''; m.data = null;
        publish({ type: 'delete', msgId });
        rerenderMessage(msgId);
      });
    }

    dom.contextMenu.hidden = false;
    const rect = dom.contextMenu.getBoundingClientRect();
    dom.contextMenu.style.left = Math.min(x, window.innerWidth - rect.width - 8) + 'px';
    dom.contextMenu.style.top = Math.min(y, window.innerHeight - rect.height - 8) + 'px';
  }
  function hideContextMenu() { dom.contextMenu.hidden = true; }

  function startEdit(msgId) {
    const m = state.messages.get(msgId); if (!m) return;
    state.editingId = msgId;
    dom.text.value = m.text || '';
    autoResize(dom.text); dom.text.focus();
    dom.sendBtn.textContent = '✓';
  }
  function commitEdit() {
    if (!state.editingId) return;
    const id = state.editingId;
    const m = state.messages.get(id); if (!m) return;
    m.text = dom.text.value.trim(); m.edited = true;
    publish({ type: 'edit', msgId: id, text: m.text });
    rerenderMessage(id);
    state.editingId = null;
    dom.text.value = '';
    autoResize(dom.text);
    dom.sendBtn.textContent = t('send');
  }

  function showEmojiPicker() {
    if (!dom.emojiPicker.dataset.filled) {
      EMOJIS.forEach((e) => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = e;
        b.addEventListener('click', () => {
          insertAtCursor(dom.text, e); hideEmojiPicker(); dom.text.focus();
        });
        dom.emojiPicker.appendChild(b);
      });
      dom.emojiPicker.dataset.filled = '1';
    }
    const r = dom.emojiBtn.getBoundingClientRect();
    dom.emojiPicker.style.left = r.left + 'px';
    dom.emojiPicker.style.bottom = (window.innerHeight - r.top + 6) + 'px';
    dom.emojiPicker.hidden = false;
  }
  function hideEmojiPicker() { dom.emojiPicker.hidden = true; }

  function insertAtCursor(el, text) {
    const start = el.selectionStart || 0, end = el.selectionEnd || 0;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    autoResize(el);
  }

  function openLightbox(src) { dom.lightboxImg.src = src; dom.lightbox.hidden = false; }
  function closeLightbox() { dom.lightbox.hidden = true; dom.lightboxImg.src = ''; }

  // ============================================================
  // Mentions autocomplete
  // ============================================================
  function updateMentions() {
    const text = dom.text.value;
    const pos = dom.text.selectionStart;
    const upto = text.slice(0, pos);
    const match = upto.match(/@([\w\-]{0,32})$/);
    if (!match) { dom.mentionsDrop.hidden = true; state.mentionIndex = -1; return; }
    const q = match[1].toLowerCase();
    const candidates = [];
    state.peers.forEach((p) => { if (p.nickname && p.nickname.toLowerCase().includes(q)) candidates.push(p.nickname); });
    if (candidates.length === 0) { dom.mentionsDrop.hidden = true; return; }
    state.mentionItems = candidates.slice(0, 6);
    state.mentionIndex = 0;
    dom.mentionsDrop.innerHTML = '';
    state.mentionItems.forEach((n, i) => {
      const el = document.createElement('div');
      el.className = 'm-item' + (i === 0 ? ' active' : '');
      el.innerHTML = `<div class="avatar" style="background:${colorFor(n)}">${escapeHtml(initials(n))}</div><span>${escapeHtml(n)}</span>`;
      el.addEventListener('click', () => insertMention(n));
      dom.mentionsDrop.appendChild(el);
    });
    dom.mentionsDrop.hidden = false;
  }
  function insertMention(nick) {
    const text = dom.text.value;
    const pos = dom.text.selectionStart;
    const upto = text.slice(0, pos);
    const match = upto.match(/@([\w\-]{0,32})$/);
    if (!match) return;
    const before = text.slice(0, match.index);
    const after = text.slice(pos);
    dom.text.value = before + '@' + nick + ' ' + after;
    dom.text.selectionStart = dom.text.selectionEnd = before.length + nick.length + 2;
    dom.mentionsDrop.hidden = true; state.mentionIndex = -1;
    autoResize(dom.text);
  }

  // ============================================================
  // Sending
  // ============================================================
  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }

  function sendText() {
    if (state.editingId) { commitEdit(); return; }
    const text = dom.text.value.trim();
    if (!text) return;
    if (handleCommand(text)) { dom.text.value = ''; autoResize(dom.text); return; }
    if (text.length > CONFIG.MAX_MSG_LEN) return showToast('Message too long', 'error');
    const msgId = uid();
    const payload = {
      type: 'msg', msgId, text,
      replyTo: state.replyTo ? { ...state.replyTo } : undefined,
    };
    const sent = publish(payload, true);
    const obj = { ...payload, clientId: state.clientId, nickname: state.nickname, ts: Date.now() };
    appendChatMessage(obj, true);
    const el = dom.messages.querySelector(`[data-msgid="${cssEscape(msgId)}"]`);
    if (el && !sent) {
      const t2 = el.querySelector('.ticks');
      if (t2) { t2.textContent = '⏳'; t2.title = t('queued'); }
    }
    dom.text.value = ''; autoResize(dom.text); clearReply();
    publish({ type: 'typing', on: false });
  }

  function sendImage(file) {
    if (!file) return;
    if (file.size > CONFIG.MAX_IMG_KB * 1024) return showToast(t('tooLargeImg', { kb: CONFIG.MAX_IMG_KB }), 'error');
    const reader = new FileReader();
    reader.onload = () => {
      const msgId = uid();
      const payload = { type: 'img', msgId, data: reader.result, replyTo: state.replyTo ? { ...state.replyTo } : undefined };
      publish(payload, true);
      appendChatMessage({ ...payload, clientId: state.clientId, nickname: state.nickname, ts: Date.now() }, true);
      clearReply();
    };
    reader.readAsDataURL(file);
  }
  function sendFile(file) {
    if (!file) return;
    if (file.size > CONFIG.MAX_FILE_KB * 1024) return showToast(t('tooLargeFile', { kb: CONFIG.MAX_FILE_KB }), 'error');
    const reader = new FileReader();
    reader.onload = () => {
      const msgId = uid();
      const payload = { type: 'file', msgId, data: reader.result, fileName: file.name };
      publish(payload, true);
      appendChatMessage({ ...payload, clientId: state.clientId, nickname: state.nickname, ts: Date.now() }, true);
      clearReply();
    };
    reader.readAsDataURL(file);
  }
  async function toggleRecording() {
    if (state.recording) {
      if (state.mediaRecorder) state.mediaRecorder.stop();
      state.recording = false; dom.audioBtn.textContent = '🎤';
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.mediaRecorder = new MediaRecorder(stream); state.audioChunks = [];
      state.mediaRecorder.ondataavailable = (e) => { if (e.data.size) state.audioChunks.push(e.data); };
      state.mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(state.audioChunks, { type: 'audio/webm' });
        if (blob.size > CONFIG.MAX_AUDIO_KB * 1024) return showToast(t('tooLargeAudio', { kb: CONFIG.MAX_AUDIO_KB }), 'error');
        const reader = new FileReader();
        reader.onload = () => {
          const msgId = uid();
          const payload = { type: 'audio', msgId, data: reader.result };
          publish(payload, true);
          appendChatMessage({ ...payload, clientId: state.clientId, nickname: state.nickname, ts: Date.now() }, true);
        };
        reader.readAsDataURL(blob);
      };
      state.mediaRecorder.start(); state.recording = true; dom.audioBtn.textContent = '⏹';
      showToast(t('recording'), 'info', 2000);
    } catch (e) { showToast(t('micDenied'), 'error'); }
  }

  // ============================================================
  // Search / starred / export / forward
  // ============================================================
  function performSearch(q) {
    const query = q.trim().toLowerCase();
    if (!query) {
      dom.messages.querySelectorAll('.message').forEach((m) => m.style.outline = '');
      dom.searchCount.textContent = '';
      return;
    }
    let n = 0;
    dom.messages.querySelectorAll('.message').forEach((el) => {
      const m = state.messages.get(el.dataset.msgid);
      const hay = ((m && m.text) || '') + ' ' + ((m && m.fileName) || '');
      if (hay.toLowerCase().includes(query)) {
        el.style.outline = '2px solid var(--accent)';
        n++;
      } else el.style.outline = '';
    });
    dom.searchCount.textContent = t('searchResults', { n });
  }
  function applyStarFilter() {
    dom.messages.querySelectorAll('.message').forEach((el) => {
      const m = state.messages.get(el.dataset.msgid);
      el.hidden = state.starredFilter && !(m && m.starred);
    });
    dom.starFilterBtn.classList.toggle('active', state.starredFilter);
    if (state.starredFilter) showToast(t('starredFilterOn'), 'info', 1800);
  }
  function exportChat() {
    const data = state.messageOrder.map((id) => state.messages.get(id)).filter(Boolean);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${state.room}-chat-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast(t('exported'), 'success', 2000);
  }
  function openForward() {
    dom.forwardModal.hidden = false;
    dom.forwardRoom.value = state.room;
    dom.forwardRoom.focus();
  }
  function doForward() {
    const target = (dom.forwardRoom.value || '').trim();
    if (!target) return;
    const ids = Array.from(state.selection);
    const items = ids.map((id) => state.messages.get(id)).filter(Boolean);
    const topic = CONFIG.TOPIC_PREFIX + target;
    let sent = 0;
    items.forEach((m) => {
      const payload = JSON.stringify({
        type: m.type, text: m.text, data: m.data, fileName: m.fileName,
        clientId: state.clientId, nickname: state.nickname, ts: Date.now(), msgId: uid(),
        forwarded: true,
      });
      if (state.client && state.client.connected) {
        state.client.publish(topic, payload, { qos: 0 });
        sent++;
      }
    });
    dom.forwardModal.hidden = true;
    showToast(`${sent} message(s) forwarded`, 'success', 2000);
    clearSelectionAfterAction();
  }

  // ============================================================
  // Drag & drop / paste
  // ============================================================
  function handleFiles(files) {
    Array.from(files).forEach((f) => {
      if (f.type.startsWith('image/')) sendImage(f);
      else sendFile(f);
    });
  }

  // ============================================================
  // Wiring
  // ============================================================
  function wire() {
    dom.connectBtn.addEventListener('click', connect);
    dom.disconnectBtn.addEventListener('click', disconnect);
    dom.disconnectBtn.disabled = true;

    dom.composerForm.addEventListener('submit', (e) => { e.preventDefault(); sendText(); });

    dom.text.addEventListener('input', () => {
      autoResize(dom.text);
      updateMentions();
      if (!state.client || !state.client.connected) return;
      const now = Date.now();
      if (now - state.lastTypingPublish > 1000) {
        publish({ type: 'typing', on: true }); state.lastTypingPublish = now;
      }
      clearTimeout(state.typingTimer);
      state.typingTimer = setTimeout(() => publish({ type: 'typing', on: false }), CONFIG.TYPING_TIMEOUT);
    });
    dom.text.addEventListener('keydown', (e) => {
      if (!dom.mentionsDrop.hidden) {
        if (e.key === 'ArrowDown') { e.preventDefault(); state.mentionIndex = Math.min(state.mentionIndex + 1, state.mentionItems.length - 1); refreshMentionHighlight(); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); state.mentionIndex = Math.max(state.mentionIndex - 1, 0); refreshMentionHighlight(); return; }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(state.mentionItems[state.mentionIndex]); return; }
        if (e.key === 'Escape') { dom.mentionsDrop.hidden = true; return; }
      }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
      if (e.key === 'Escape' && state.editingId) {
        state.editingId = null; dom.text.value = ''; autoResize(dom.text);
        dom.sendBtn.textContent = t('send');
      }
      if (e.key === 'ArrowUp' && dom.text.value === '' && !state.editingId) {
        for (let i = state.messageOrder.length - 1; i >= 0; i--) {
          const m = state.messages.get(state.messageOrder[i]);
          if (m && m.clientId === state.clientId && m.type === 'msg' && !m.deleted) {
            e.preventDefault(); startEdit(m.msgId); break;
          }
        }
      }
    });
    function refreshMentionHighlight() {
      dom.mentionsDrop.querySelectorAll('.m-item').forEach((el, i) => {
        el.classList.toggle('active', i === state.mentionIndex);
      });
    }

    dom.emojiBtn.addEventListener('click', showEmojiPicker);
    dom.attachBtn.addEventListener('click', () => { dom.attachMenu.hidden = !dom.attachMenu.hidden; });
    dom.attachMenu.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const action = b.dataset.action;
      dom.attachMenu.hidden = true;
      if (action === 'image') dom.imageInput.click();
      else if (action === 'file') dom.fileInput.click();
    });
    dom.imageInput.addEventListener('change', () => { sendImage(dom.imageInput.files[0]); dom.imageInput.value = ''; });
    dom.fileInput.addEventListener('change', () => { sendFile(dom.fileInput.files[0]); dom.fileInput.value = ''; });
    dom.audioBtn.addEventListener('click', toggleRecording);
    dom.replyClose.addEventListener('click', clearReply);

    // Selection bar
    dom.selClose.addEventListener('click', exitSelection);
    dom.selStar.addEventListener('click', () => {
      state.selection.forEach((id) => { const m = state.messages.get(id); if (m) m.starred = true; });
      state.selection.forEach(rerenderMessage);
      clearSelectionAfterAction();
    });
    dom.selCopy.addEventListener('click', () => {
      const text = Array.from(state.selection)
        .map((id) => state.messages.get(id))
        .filter(Boolean).map((m) => previewText(m)).join('\n');
      navigator.clipboard.writeText(text).then(() => showToast(t('copied'), 'success', 1500));
      clearSelectionAfterAction();
    });
    dom.selForward.addEventListener('click', openForward);
    dom.selDelete.addEventListener('click', () => {
      state.selection.forEach((id) => {
        const m = state.messages.get(id);
        if (m && m.clientId === state.clientId) {
          m.deleted = true; m.text = ''; m.data = null;
          publish({ type: 'delete', msgId: id });
          rerenderMessage(id);
        }
      });
      clearSelectionAfterAction();
    });

    dom.starFilterBtn.addEventListener('click', () => {
      state.starredFilter = !state.starredFilter;
      applyStarFilter();
    });
    dom.exportBtn.addEventListener('click', exportChat);

    dom.forwardCancel.addEventListener('click', () => { dom.forwardModal.hidden = true; });
    dom.forwardGo.addEventListener('click', doForward);

    dom.searchBtn.addEventListener('click', () => {
      dom.searchBar.hidden = !dom.searchBar.hidden;
      if (!dom.searchBar.hidden) dom.searchInput.focus();
      else performSearch('');
    });
    dom.searchClose.addEventListener('click', () => { dom.searchBar.hidden = true; performSearch(''); });
    dom.searchInput.addEventListener('input', (e) => performSearch(e.target.value));

    dom.scrollDown.addEventListener('click', () => scrollToBottom());
    dom.messages.addEventListener('scroll', () => {
      if (isNearBottom()) { state.unread = 0; updateUnreadBadge(); }
      else dom.scrollDown.hidden = false;
    });

    document.addEventListener('click', (e) => {
      if (!dom.contextMenu.hidden && !dom.contextMenu.contains(e.target)) hideContextMenu();
      if (!dom.emojiPicker.hidden && !dom.emojiPicker.contains(e.target) && e.target !== dom.emojiBtn) hideEmojiPicker();
      if (!dom.attachMenu.hidden && !dom.attachMenu.contains(e.target) && e.target !== dom.attachBtn) dom.attachMenu.hidden = true;
      if (!dom.mentionsDrop.hidden && !dom.mentionsDrop.contains(e.target) && e.target !== dom.text) dom.mentionsDrop.hidden = true;
    });

    dom.lightbox.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (state.selectionMode) { exitSelection(); return; }
        hideContextMenu(); hideEmojiPicker(); closeLightbox();
        dom.forwardModal.hidden = true;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault(); dom.searchBar.hidden = false; dom.searchInput.focus();
      }
    });

    // Drag & drop
    ['dragenter', 'dragover'].forEach((ev) => document.addEventListener(ev, (e) => {
      e.preventDefault();
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        state.dragging++;
        dom.dropOverlay.hidden = false;
      }
    }));
    ['dragleave', 'drop'].forEach((ev) => document.addEventListener(ev, (e) => {
      e.preventDefault();
      state.dragging = Math.max(0, state.dragging - 1);
      if (state.dragging === 0) dom.dropOverlay.hidden = true;
    }));
    document.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    });
    document.addEventListener('paste', (e) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items || []);
      items.forEach((it) => {
        if (it.type && it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) sendImage(f);
        }
      });
    });

    dom.sidebarToggle.addEventListener('click', () => dom.sidebar.classList.toggle('open'));
    dom.messages.addEventListener('click', () => {
      if (window.innerWidth <= 720) dom.sidebar.classList.remove('open');
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        state.messageOrder.forEach((id) => {
          const m = state.messages.get(id);
          if (m && m.clientId !== state.clientId) publish({ type: 'ack', msgId: id, status: 'read' });
        });
        state.unread = 0; updateUnreadBadge();
      }
    });
  }

  // ============================================================
  // Init
  // ============================================================
  function init() {
    initTheme(); initLang(); initFontSize(); initSound(); wire();
    dom.room.value = localStorage.getItem('minichat_room') || 'lobby';
    dom.nickname.value = localStorage.getItem('minichat_nickname') || '';
    state.nickname = dom.nickname.value;
    dom.roomName.textContent = dom.room.value;
    dom.roomAvatar.textContent = '#' + (dom.room.value[0] || '').toUpperCase();
    dom.roomAvatar.style.background = colorFor(dom.room.value);
    dom.text.disabled = true; dom.sendBtn.disabled = true;
    updateSelfAvatar(); renderMembers();
  }
  init();
})();