(function () {
  'use strict';

  const CONFIG = {
    BROKERS: ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt'],
    TOPIC_PREFIX: 'minichat/v1/',
    MAX_MSG_LEN: 500,
    MAX_IMG_KB: 150,
    MAX_AUDIO_KB: 180,
    MAX_INCOMING_CHARS: 300000,
  };

  const $ = (sel) => document.querySelector(sel);
  const dom = {
    status: $('#status'), room: $('#room'), nickname: $('#nickname'),
    connectBtn: $('#connectBtn'), disconnectBtn: $('#disconnectBtn'),
    messages: $('#messages'), composer: $('#composer'), text: $('#text'),
    sendBtn: $('#sendBtn'), imageInput: $('#imageInput'), imageBtn: $('#imageBtn'),
    audioBtn: $('#audioBtn'), toasts: $('#toasts'), themeSelect: $('#themeSelect'),
  };

  let client = null;
  let currentTopic = '';
  const myClientId = 'minichat_' + Math.random().toString(36).slice(2, 10);
  let room = '', nickname = '';
  let recording = false, mediaRecorder = null, audioChunks = [];

  // ---------- Utilities ----------
  function showToast(message, type = 'info', timeout = 4000) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    dom.toasts.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, timeout);
  }

  function setStatus(text, cls = '') { dom.status.textContent = text; dom.status.className = cls; }
  function enableComposer(enabled) {
    dom.text.disabled = !enabled; dom.sendBtn.disabled = !enabled;
    dom.imageBtn.disabled = !enabled; dom.audioBtn.disabled = !enabled;
  }
  function formatTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  function addSystemMessage(text) {
    const div = document.createElement('div'); div.className = 'system'; div.textContent = text;
    dom.messages.appendChild(div); dom.messages.scrollTop = dom.messages.scrollHeight;
  }

  function addMessage({ type, nickname: sender, text, data, ts, clientId }) {
    const own = clientId === myClientId;
    const wrap = document.createElement('div'); wrap.className = `message${own ? ' own' : ''}`;
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = `${own ? 'You' : sender || 'anon'} · ${formatTime(ts || Date.now())}`;
    wrap.appendChild(meta);

    const bubble = document.createElement('div'); bubble.className = 'bubble';
    if (type === 'msg') bubble.textContent = text;
    else if (type === 'img') {
      const img = document.createElement('img'); img.src = data; img.style.maxWidth = '100%'; img.style.borderRadius = '8px';
      bubble.appendChild(img);
    } else if (type === 'audio') {
      const audio = document.createElement('audio'); audio.controls = true; audio.src = data; bubble.appendChild(audio);
    }
    wrap.appendChild(bubble); dom.messages.appendChild(wrap);
    dom.messages.scrollTop = dom.messages.scrollHeight;
  }

  // ---------- Theme ----------
  function initTheme() {
    const saved = localStorage.getItem('minichat_theme') || 'whatsapp';
    document.documentElement.setAttribute('data-theme', saved);
    if (dom.themeSelect) {
      dom.themeSelect.value = saved;
      dom.themeSelect.addEventListener('change', () => {
        const next = dom.themeSelect.value;
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('minichat_theme', next);
      });
    }
  }

  // ---------- MQTT ----------
  function connect() {
    if (client) return;
    room = dom.room.value.trim() || 'lobby';
    nickname = dom.nickname.value.trim() || 'anon-' + Math.random().toString(36).slice(2, 6);
    currentTopic = CONFIG.TOPIC_PREFIX + room;
    localStorage.setItem('minichat_room', room);
    localStorage.setItem('minichat_nickname', nickname);

    let brokerIndex = 0;
    function tryNextBroker() {
      if (brokerIndex >= CONFIG.BROKERS.length) {
        setStatus('All brokers failed', 'error');
        showToast('Could not connect to any MQTT broker.', 'error', 8000);
        return;
      }
      const broker = CONFIG.BROKERS[brokerIndex++];
      setStatus(`Connecting...`, 'connecting');

      const c = mqtt.connect(broker, {
        clientId: myClientId, clean: true, reconnectPeriod: 5000, connectTimeout: 10000, keepalive: 30,
      });

      let connected = false;
      c.on('connect', () => {
        connected = true; client = c; setStatus('Online', 'online'); enableComposer(true);
        c.subscribe(currentTopic, { qos: 0 }, (err) => {
          if (!err) { addSystemMessage(`Joined room "${room}" as ${nickname}`); publish({ type: 'join' }); }
        });
      });
      c.on('message', (topic, payload) => { if (topic === currentTopic) handleIncoming(payload); });
      c.on('error', (err) => {
        if (!connected) { c.end(true); tryNextBroker(); }
      });
      c.on('close', () => { if (client === c) { setStatus('Offline', 'offline'); enableComposer(false); } });
      c.on('reconnect', () => setStatus('Reconnecting...', 'connecting'));
    }
    tryNextBroker();
  }

  function disconnect() {
    if (!client) return;
    publish({ type: 'leave' }); client.end(true); client = null;
    setStatus('Offline', 'offline'); enableComposer(false); addSystemMessage('You left the room');
  }

  function publish(obj) {
    if (!client || !client.connected) return false;
    obj.clientId = myClientId; obj.nickname = nickname; obj.ts = Date.now();
    client.publish(currentTopic, JSON.stringify(obj), { qos: 0 });
    return true;
  }

  function handleIncoming(payload) {
    let msg; try { msg = JSON.parse(payload.toString()); } catch (e) { return; }
    if (!msg || msg.clientId === myClientId) return;
    if (msg.type === 'join') return addSystemMessage(`${msg.nickname || 'anon'} joined`);
    if (msg.type === 'leave') return addSystemMessage(`${msg.nickname || 'anon'} left`);
    if (msg.type === 'msg' && typeof msg.text === 'string' && msg.text.length <= CONFIG.MAX_MSG_LEN) addMessage(msg);
    else if (msg.type === 'img' && typeof msg.data === 'string' && msg.data.startsWith('data:image/')) addMessage(msg);
    else if (msg.type === 'audio' && typeof msg.data === 'string' && msg.data.startsWith('data:audio/')) addMessage(msg);
  }

  // ---------- Sending ----------
  function sendText() {
    const text = dom.text.value.trim();
    if (!text || text.length > CONFIG.MAX_MSG_LEN) return;
    const obj = { type: 'msg', text };
    if (publish(obj)) { addMessage(obj); dom.text.value = ''; dom.text.focus(); }
  }

  function sendImage(file) {
    if (!file || file.size > CONFIG.MAX_IMG_KB * 1024) return showToast('Image too large', 'error');
    const reader = new FileReader();
    reader.onload = () => { const obj = { type: 'img', data: reader.result }; if (publish(obj)) addMessage(obj); };
    reader.readAsDataURL(file);
  }

  async function toggleRecording() {
    if (recording) { if (mediaRecorder) mediaRecorder.stop(); recording = false; dom.audioBtn.textContent = '🎤'; return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream); audioChunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        if (blob.size > CONFIG.MAX_AUDIO_KB * 1024) return showToast('Audio too large', 'error');
        const reader = new FileReader();
        reader.onload = () => { const obj = { type: 'audio', data: reader.result }; if (publish(obj)) addMessage(obj); };
        reader.readAsDataURL(blob);
      };
      mediaRecorder.start(); recording = true; dom.audioBtn.textContent = '⏹';
    } catch (err) { showToast('Microphone access denied', 'error'); }
  }

  // ---------- Init ----------
  function init() {
    initTheme();
    dom.room.value = localStorage.getItem('minichat_room') || 'lobby';
    dom.nickname.value = localStorage.getItem('minichat_nickname') || '';
    dom.connectBtn.addEventListener('click', connect);
    dom.disconnectBtn.addEventListener('click', disconnect);
    dom.composer.addEventListener('submit', (e) => { e.preventDefault(); sendText(); });
    dom.imageBtn.addEventListener('click', () => dom.imageInput.click());
    dom.imageInput.addEventListener('change', () => { sendImage(dom.imageInput.files[0]); dom.imageInput.value = ''; });
    dom.audioBtn.addEventListener('click', toggleRecording);
    setStatus('Offline', 'offline'); enableComposer(false);
  }
  init();
})();
