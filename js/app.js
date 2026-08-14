/* ═══════════════════════════════════════════════════════════════════════
   MiniChat · js/app.js
═══════════════════════════════════════════════════════════════════════ */
'use strict';

const STATE = {
  myId: uuid(),
  myNick: '',
  currentRoom: null,
  topic: null,
  client: null,
  inRoom: false,
  soundOn: true,
  hbTimer: null,
  pruneTimer: null,
  typingStopTimer: null,
  typingActive: false,
  lastTypingSent: 0,
  lastMsg: null,
  pendingScroll: 0,
  emptyState: null,
  unread: 0,
  peers: new Map(),
  typers: new Map(),
  reactions: new Map()
};

function sendMessage(){
  const ta = $('#msgInput');
  const text = ta.value.trim().slice(0, CONFIG.MAX_MSG_LEN);
  if (!text || !STATE.inRoom) return;
  
  const isCmd = text.startsWith('/dado') || text.startsWith('/moneda');
  const payload = { 
    t:'m', 
    id: STATE.myId, 
    mid: uuid(), 
    nick: STATE.myNick, 
    text: text, 
    ts: Date.now(),
    isCommandResult: isCmd
  };
  
  try { STATE.client && STATE.client.publish(STATE.topic, JSON.stringify(payload)); } catch(e){}
  STATE.lastMsg = { id: STATE.myId, ts: Date.now() };
  appendMsg(payload, true);
  ta.value = '';
  ta.style.height = 'auto';
  $('#sendBtn').disabled = true;
  if (STATE.typingActive) sendTypingEvent(false);
  ta.focus();
}

function onComposerInput(){
  const ta = $('#msgInput');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 132) + 'px';
  const hasText = ta.value.trim().length > 0;
  $('#sendBtn').disabled = !hasText;
  if (hasText){
    if (Date.now() - STATE.lastTypingSent > 2000){
      sendTypingEvent(true);
      STATE.lastTypingSent = Date.now();
    }
    clearTimeout(STATE.typingStopTimer);
    STATE.typingStopTimer = setTimeout(() => sendTypingEvent(false), 2500);
  } else if (STATE.typingActive){
    sendTypingEvent(false);
  }
}

const EMOJIS = [
  '😀','😂','🤣','😊','😅','😭','😍','🤔','😴','🤯','😱','🥶','😎','🤓','🤡','👻',
  '💀','👽','🤖','💩','🔥','✨','🌈','⚡','❤️','💔','💯','👍','👎','👀','🙌','👏',
  '🫡','🤝','🎉','🎮','🍕','🌮','🚀','⭐','🏆','💬','❓','❗',
];

function buildEmojiPanel(){
  const panel = $('#emojiPanel');
  EMOJIS.forEach(ch => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = ch;
    b.title = 'Insert ' + ch;
    b.addEventListener('click', () => {
      const ta = $('#msgInput');
      ta.setRangeText(ch, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
    });
    panel.appendChild(b);
  });
}

function applyTheme(color){
  document.documentElement.style.setProperty('--ember', color);
  localStorage.setItem(CONFIG.LS_KEYS.THEME, color);
}

function enterRoom(room){
  STATE.currentRoom = room;
  STATE.topic = CONFIG.TOPIC_PREFIX + room;
  STATE.inRoom = true;
  localStorage.setItem(CONFIG.LS_KEYS.ROOM, room);
  STATE.peers.clear(); STATE.typers.clear(); STATE.reactions.clear();
  STATE.lastMsg = null; STATE.pendingScroll = 0;
  const box = $('#messages');
  box.innerHTML = '';
  STATE.emptyState = el('div', 'empty');
  STATE.emptyState.innerHTML =
    '<span class="big">🫧</span><h3>' + t('emptyTitle') + '</h3>' +
    '<p>' + t('emptyDesc') + '</p>';
  box.appendChild(STATE.emptyState);
  $('#roomName').textContent = room;
  $('#jumpBtn').hidden = true;
  renderTyping();
  updateOnline();
  $('#lobby').hidden = true;
  $('#chat').hidden = false;
  history.replaceState(null, '', location.pathname + '?sala=' + encodeURIComponent(room));
  addSystem(t('entered', {room, nick: STATE.myNick}));
  connectToRoom();
  setTimeout(() => $('#msgInput').focus(), 80);
}

function leaveRoom(){
  if (!STATE.inRoom) return;
  STATE.inRoom = false;
  clearInterval(STATE.hbTimer); clearInterval(STATE.pruneTimer); clearTimeout(STATE.typingStopTimer);
  stopRecording();
  if (STATE.client){
    try {
      STATE.client.publish(STATE.topic, JSON.stringify({ t:'p', e:'leave', id: STATE.myId, nick: STATE.myNick }));
      STATE.client.end(false);
    } catch(e){}
    STATE.client = null;
  }
  STATE.currentRoom = null; STATE.topic = null;
  $('#chat').hidden = true;
  $('#lobby').hidden = false;
  history.replaceState(null, '', location.pathname);
}

function onJoinSubmit(e){
  e.preventDefault();
  const room = $('#roomInput').value.trim().toLowerCase().replace(/\s+/g, '-');
  if (!/^[a-z0-9_-]{1,40}$/.test(room)){
    $('#roomError').hidden = false;
    const inp = $('#roomInput');
    inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake');
    return;
  }
  $('#roomError').hidden = true;
  $('#roomInput').value = room;
  enterRoom(room);
}

async function copyRoomLink(){
  const url = location.origin + location.pathname + '?sala=' + encodeURIComponent(STATE.currentRoom);
  try {
    await navigator.clipboard.writeText(url);
    toast(t('copyLink'));
  } catch(e){
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(t('copyLink')); }
    catch(e2){ toast('Copy failed 😕'); }
    ta.remove();
  }
}

function toggleSound(){
  STATE.soundOn = !STATE.soundOn;
  localStorage.setItem(CONFIG.LS_KEYS.SOUND, STATE.soundOn ? 'on' : 'off');
  updateSoundBtn();
  if (STATE.soundOn){ ensureAudio(); blip([880, 1175]); }
  toast(STATE.soundOn ? t('soundOn') : t('soundOff'));
}

function updateSoundBtn(){
  const b = $('#soundBtn');
  b.textContent = STATE.soundOn ? '🔔' : '🔕';
  b.setAttribute('aria-pressed', String(STATE.soundOn));
}

function rollNick(){
  STATE.myNick = buildNick();
  localStorage.setItem(CONFIG.LS_KEYS.NICK, STATE.myNick);
  const d = $('#nickDisplay');
  d.textContent = STATE.myNick;
  d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
  const btn = $('#diceBtn');
  btn.classList.remove('rolling'); void btn.offsetWidth; btn.classList.add('rolling');
}

const FLOATY = ['🍕','🐧','🚀','🤖','💬','🌮','👾','⭐','🦊','🧋','🎮','🌙','🍩','⚡','🐙','🎲'];
function spawnFloaties(n = 14){
  const box = $('#floaties');
  for (let i = 0; i < n; i++){
    const s = document.createElement('span');
    s.textContent = pick(FLOATY);
    s.style.left = (Math.random() * 100) + 'vw';
    s.style.fontSize = (16 + Math.random() * 26) + 'px';
    const dur = 16 + Math.random() * 22;
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-Math.random() * dur) + 's';
    box.appendChild(s);
  }
}

function bindUI(){
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  $('#diceBtn').addEventListener('click', rollNick);
  $('#joinForm').addEventListener('submit', onJoinSubmit);
  $('#roomInput').addEventListener('input', () => { $('#roomError').hidden = true; });
  
  $('#leaveBtn').addEventListener('click', leaveRoom);
  $('#copyBtn').addEventListener('click', copyRoomLink);
  $('#soundBtn').addEventListener('click', toggleSound);
  
  $('#themeBtn').addEventListener('click', e => {
    e.stopPropagation();
    $('#themePanel').hidden = !$('#themePanel').hidden;
  });
  document.querySelectorAll('.theme-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.color);
      $('#themePanel').hidden = true;
    });
  });
  document.addEventListener('click', e => {
    if (!$('#themePanel').hidden && !$('#themePanel').contains(e.target)) $('#themePanel').hidden = true;
  });

  $('#sendForm').addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
  const input = $('#msgInput');
  input.addEventListener('input', onComposerInput);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });
  
  // Multimedia Events
  $('#imgBtn').addEventListener('click', () => $('#imgFile').click());
  $('#imgFile').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) sendImageFile(f);
    e.target.value = '';
  });
  $('#audioBtn').addEventListener('click', toggleRecording);
  input.addEventListener('paste', e => {
    const f = [...(e.clipboardData?.files || [])].find(x => x.type.startsWith('image/'));
    if (f){ e.preventDefault(); sendImageFile(f); }
  });

  $('#emojiBtn').addEventListener('click', e => {
    e.stopPropagation();
    const panel = $('#emojiPanel');
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    $('#emojiBtn').setAttribute('aria-expanded', String(willOpen));
  });
  document.addEventListener('click', e => {
    const panel = $('#emojiPanel');
    if (!panel.hidden && !panel.contains(e.target)) panel.hidden = true;
  });
  
  $('#jumpBtn').addEventListener('click', () => { scrollBottom(true); resetJump(); });
  $('#messages').addEventListener('scroll', () => { if (nearBottom()) resetJump(); });
  
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden){ STATE.unread = 0; document.title = '💬 MiniChat'; }
  });
}

function init(){
  const saved = localStorage.getItem(CONFIG.LS_KEYS.NICK);
  if (saved && saved.trim().length > 2){
    STATE.myNick = saved.trim();
  } else {
    STATE.myNick = buildNick();
    localStorage.setItem(CONFIG.LS_KEYS.NICK, STATE.myNick);
  }
  $('#nickDisplay').textContent = STATE.myNick;
  
  STATE.soundOn = localStorage.getItem(CONFIG.LS_KEYS.SOUND) !== 'off';
  updateSoundBtn();
  
  const savedTheme = localStorage.getItem(CONFIG.LS_KEYS.THEME);
  if (savedTheme) applyTheme(savedTheme);
  
  const savedLang = localStorage.getItem(CONFIG.LS_KEYS.LANG);
  const browserLang = navigator.language.slice(0, 2);
  const defaultLang = savedLang || (['es','en','cn'].includes(browserLang) ? browserLang : 'en');
  setLanguage(defaultLang);
  
  spawnFloaties();
  buildEmojiPanel();
  bindUI();
  
  const byUrl = new URLSearchParams(location.search).get('sala');
  if (byUrl){
    const room = byUrl.trim().toLowerCase();
    if (/^[a-z0-9_-]{1,40}$/.test(room)){ enterRoom(room); return; }
    $('#roomInput').value = byUrl;
  } else {
    const last = localStorage.getItem(CONFIG.LS_KEYS.ROOM);
    if (last) $('#roomInput').value = last;
  }
}
init();

window.addEventListener('pagehide', () => {
  if (STATE.inRoom && STATE.client){
    try {
      STATE.client.publish(STATE.topic, JSON.stringify({ t:'p', e:'leave', id: STATE.myId, nick: STATE.myNick }));
      STATE.client.end(true);
    } catch(e){}
  }
});