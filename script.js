/* ═══════════════════════════════════════════════════════════════════════
   MiniChat · script.js
   Anonymous real-time chat via MQTT over WebSockets.
   
   Features:
   - Multilingual (ES/EN/CN)
   - Color Themes
   - Smart Links & Game Commands (/dado, /moneda)
   - Emoji Reactions
   
   Event Types (JSON "t" field):
     t:'m'  → message       { id, mid, nick, text, ts, react? }
     t:'r'  → reaction      { mid, emoji, id, add:true|false }
     t:'p'  → presence      { e:'join'|'hb'|'leave', id, nick }
     t:'ty' → typing        { id, nick, on:true|false }
═══════════════════════════════════════════════════════════════════════ */
'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   1 · CONFIGURATION & CONSTANTS
═══════════════════════════════════════════════════════════════════════ */
const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
];
const TOPIC_PREFIX   = 'minichat-es/v1/';
const HEARTBEAT_MS   = 15000;
const PEER_TTL_MS    = 45000;
const GROUP_MS       = 3 * 60 * 1000;
const MAX_MSG_LEN    = 500;
const TYPING_TIMEOUT = 5000;
const LS_NICK  = 'minichat:nick';
const LS_SOUND = 'minichat:sonido';
const LS_ROOM  = 'minichat:ultimaSala';
const LS_LANG  = 'minichat:idioma';
const LS_THEME = 'minichat:tema';

/* ═══════════════════════════════════════════════════════════════════════
   2 · INTERNATIONALIZATION (I18N)
═══════════════════════════════════════════════════════════════════════ */
const I18N = {
  es: {
    tagline: "Chat anónimo en tiempo real · MQTT sobre WebSockets",
    nickLabel: "Tu nick",
    changeNick: "Cambiar",
    roomLabel: "Sala",
    enterBtn: "Entrar →",
    hint: "Quien escriba el mismo nombre de sala verá tus mensajes al instante. ¡Comparte el nombre (o el enlace) con tus amigos!",
    roomError: "⚠️ Nombre de sala no válido: usa solo letras, números, guiones y guiones bajos.",
    footer: "Sin registro · Sin instalar nada · Los mensajes viajan por un broker MQTT público y no quedan guardados: no compartas datos privados.",
    leaveBtn: "Cambiar sala",
    placeholder: "Escribe un mensaje…",
    sendBtn: "Enviar ➤",
    newMsg: "↓ Nuevo mensaje",
    newMsgs: "↓ {n} mensajes nuevos",
    typingOne: "{n} está escribiendo…",
    typingTwo: "{n} y {m} están escribiendo…",
    typingMany: "{n} personas están escribiendo…",
    entered: "Has entrado en #{room} como {nick}",
    joined: "{nick} ha entrado en la sala",
    left: "{nick} ha salido de la sala",
    emptyTitle: "Nadie ha hablado todavía",
    emptyDesc: "Sé quien rompa el hielo… o comparte la sala para que llegue más gente.",
    copyLink: "🔗 Enlace de la sala copiado",
    soundOn: "🔔 Sonidos activados",
    soundOff: "🔕 Sonidos silenciados",
    dice: "🎲 Ha sacado un **{n}**",
    coin: "🪙 Ha salido **{n}**"
  },
  en: {
    tagline: "Anonymous real-time chat · MQTT over WebSockets",
    nickLabel: "Your nick",
    changeNick: "Change",
    roomLabel: "Room",
    enterBtn: "Enter →",
    hint: "Anyone who types the same room name will see your messages instantly. Share the name (or link) with friends!",
    roomError: "⚠️ Invalid room name: use only letters, numbers, hyphens and underscores.",
    footer: "No registration · No install · Messages travel via public MQTT broker and are not stored: do not share private data.",
    leaveBtn: "Change room",
    placeholder: "Type a message…",
    sendBtn: "Send ➤",
    newMsg: "↓ New message",
    newMsgs: "↓ {n} new messages",
    typingOne: "{n} is typing…",
    typingTwo: "{n} and {m} are typing…",
    typingMany: "{n} people are typing…",
    entered: "You entered #{room} as {nick}",
    joined: "{nick} has joined the room",
    left: "{nick} has left the room",
    emptyTitle: "No one has spoken yet",
    emptyDesc: "Be the first to break the ice… or share the room to get more people.",
    copyLink: "🔗 Room link copied",
    soundOn: "🔔 Sounds enabled",
    soundOff: "🔕 Sounds muted",
    dice: "🎲 Rolled a **{n}**",
    coin: "🪙 Landed on **{n}**"
  },
  cn: {
    tagline: "匿名实时聊天 · 基于 MQTT over WebSockets",
    nickLabel: "你的昵称",
    changeNick: "更换",
    roomLabel: "房间",
    enterBtn: "进入 →",
    hint: "输入相同房间名称的人将立即看到您的消息。与朋友分享名称（或链接）！",
    roomError: "⚠️ 无效的房间名称：仅使用字母、数字、连字符和下划线。",
    footer: "无需注册 · 无需安装 · 消息通过公共 MQTT 代理传输且不存储：请勿分享私人数据。",
    leaveBtn: "更换房间",
    placeholder: "输入消息…",
    sendBtn: "发送 ➤",
    newMsg: "↓ 新消息",
    newMsgs: "↓ {n} 条新消息",
    typingOne: "{n} 正在输入…",
    typingTwo: "{n} 和 {m} 正在输入…",
    typingMany: "{n} 人正在输入…",
    entered: "你以 {nick} 的身份进入了 #{room}",
    joined: "{nick} 加入了房间",
    left: "{nick} 离开了房间",
    emptyTitle: "还没有人说话",
    emptyDesc: "做第一个打破沉默的人……或者分享房间让更多人加入。",
    copyLink: "🔗 房间链接已复制",
    soundOn: "🔔 声音已开启",
    soundOff: "🔕 声音已静音",
    dice: "🎲 掷出了 **{n}**",
    coin: "🪙 结果是 **{n}**"
  }
};

let currentLang = 'es';

function setLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  localStorage.setItem(LS_LANG, lang);
  
  // Update static elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[lang][key]) el.placeholder = I18N[lang][key];
  });

  // Update active button state
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function t(key, vars = {}) {
  let str = I18N[currentLang][key] || key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(`{${k}}`, v);
  }
  return str;
}

/* ═══════════════════════════════════════════════════════════════════════
   3 · NICK GENERATOR
═══════════════════════════════════════════════════════════════════════ */
const NOMBRES = [
  ['🐧','Pingüino','m'],['🦊','Zorro','m'],['🦆','Pato','m'],['🐺','Lobo','m'],
  ['🐱','Gato','m'],['🐶','Perrito','m'],['🐼','Panda','m'],['🐨','Koala','m'],
  ['🐯','Tigre','m'],['🦁','León','m'],['🦅','Águila','f'],['🦉','Búho','m'],
  ['🐬','Delfín','m'],['🦈','Tiburón','m'],['🐙','Pulpo','m'],['🦑','Calamar','m'],
  ['🐢','Tortuga','f'],['🦎','Lagarto','m'],['🐸','Rana','f'],['🦔','Erizo','m'],
  ['🦝','Mapache','m'],['🦫','Castor','m'],['🦦','Nutria','f'],['🦨','Mofeta','f'],
  ['🐿️','Ardilla','f'],['🐹','Hámster','m'],['🐰','Conejo','m'],['🦇','Murciélago','m'],
  ['🦩','Flamenco','m'],['🦢','Cisne','m'],['🦜','Loro','m'],['🐦','Pajarito','m'],
  ['🐴','Caballo','m'],['🦄','Unicornio','m'],['🐮','Vaca','f'],['🐷','Cerdito','m'],
  ['🐑','Oveja','f'],['🐐','Cabra','f'],['🦌','Ciervo','m'],['🦬','Bisonte','m'],
  ['🐘','Elefante','m'],['🦏','Rinoceronte','m'],['🦛','Hipopótamo','m'],['🐪','Camello','m'],
  ['🦙','Llama','f'],['🦘','Canguro','m'],['🦡','Tejón','m'],['🦥','Perezoso','m'],
  ['🦧','Orangután','m'],['🦍','Gorila','m'],['🐒','Monito','m'],['🐊','Cocodrilo','m'],
  ['🐉','Dragón','m'],['🦖','T-Rex','m'],['🦕','Brontosaurio','m'],['🐋','Ballena','f'],
  ['🦭','Foquita','f'],['🦚','PavoReal','m'],['🐓','Gallo','m'],['🐤','Pollito','m'],
  ['🍕','Pizza','f'],['🍔','Hamburguesa','f'],['🌭','Perrito','m'],['🍟','PatataFrita','f'],
  ['🌮','Taco','m'],['🌯','Burrito','m'],['🥑','Aguacate','m'],['🍣','Sushi','m'],
  ['🍜','Ramen','m'],['🍩','Dónut','m'],['🍪','Galleta','f'],['🧁','Cupcake','m'],
  ['🎂','Pastel','m'],['🍰','Tarta','f'],['🍦','Helado','m'],['🍫','Chocolate','m'],
  ['🍬','Caramelo','m'],['🍭','Piruleta','f'],['🥐','Croissant','m'],['🥨','Pretzel','m'],
  ['🧇','Gofre','m'],['🥞','Tortita','f'],['🍿','Palomita','f'],['🍉','Sandía','f'],
  ['🍓','Fresa','f'],['🍒','Cereza','f'],['🍑','Melocotón','m'],['🍍','Piña','f'],
  ['🥭','Mango','m'],['🍋','Limón','m'],['🥝','Kiwi','m'],['🫐','Arándano','m'],
  ['🥥','Coco','m'],['🍵','Matcha','m'],['☕','Cafelito','m'],['🧋','BobaTea','m'],
  ['🥟','Dumpling','m'],['🍙','Onigiri','m'],['🍤','Gambita','f'],['🫓','Arepa','f'],
  ['🤖','Robot','m'],['🎮','Mando','m'],['🕹️','Joystick','m'],['📼','Casete','m'],
  ['💾','Disquete','m'],['📻','Radio','f'],['📺','Tele','f'],['💡','Bombilla','f'],
  ['🔦','Linterna','f'],['🔮','BolaCristal','f'],['🎲','Dado','m'],['🧩','Puzzle','m'],
  ['🎈','Globo','m'],['🎪','Circo','m'],['🎩','Sombrero','m'],['⌚','Reloj','m'],
  ['⚙️','Engranaje','m'],['📦','Paquete','m'],['🗿','Moái','m'],['🪩','BolaDisco','f'],
  ['🎺','Trompeta','f'],['🎸','Guitarra','f'],['🥁','Batería','f'],['🎻','Violín','m'],
  ['🧸','Peluche','m'],['🪀','Yoyó','m'],['🎳','Bolos','m'],['🪄','Varita','f'],
  ['🌌','Galaxia','f'],['⭐','Estrella','f'],['🌟','Supernova','f'],['☄️','Cometa','m'],
  ['🪐','Planeta','m'],['🌙','Luna','f'],['🌕','LunaLlena','f'],['☀️','Sol','m'],
  ['🌈','Arcoíris','m'],['🌠','EstrellaFugaz','f'],['🛰️','Satélite','m'],['🔭','Telescopio','m'],
  ['👽','Alien','m'],['🧑‍🚀','Astronauta','m'],['💫','Nebulosa','f'],['🕳️','AgujeroNegro','m'],
  ['🛸','Ovni','m'],['🚀','Cohete','m'],
  ['🧪','Matraz','m'],['⚗️','Alambique','m'],['🧬','ADN','m'],['🦠','Microbio','m'],
  ['⚛️','Átomo','m'],['⚡','Electrón','m'],['🔬','Microscopio','m'],['🧲','Imán','m'],
  ['💊','Píldora','f'],['🔋','Batería','f'],['🌡️','Termómetro','m'],['🧠','Cerebro','m'],
  ['💎','Cristal','m'],['🪨','Meteorito','m'],['🌋','Volcán','m'],['🌪️','Tornado','m'],
  ['👾','Invasor','m'],['🏆','Campeón','m'],['🗡️','Espada','f'],['🛡️','Escudo','m'],
  ['🏹','Arquero','m'],['🧙','Mago','m'],['🧝','Elfo','m'],['🧟','Zombi','m'],
  ['🧛','Vampiro','m'],['💣','Bomba','f'],['🍄','Champiñón','m'],['💰','Tesoro','m'],
  ['🗝️','LlaveAntigua','f'],['🎯','Diana','f'],['🔥','Fénix','m'],['⚔️','Espadachín','m'],
  ['🧱','Bloque','m'],['🤺','Esgrimista','m'],['🐲','Dragoncito','m'],['💠','Gema','f'],
];
const ADJETIVOS = [
  ['Turbo','Turbo'],['Galáctico','Galáctica'],['Cósmico','Cósmica'],['Legendario','Legendaria'],
  ['Cuántico','Cuántica'],['Ninja','Ninja'],['Pixelado','Pixelada'],['Sigiloso','Sigilosa'],
  ['Radiante','Radiante'],['Salvaje','Salvaje'],['Místico','Mística'],['Épico','Épica'],
  ['Supersónico','Supersónica'],['Fantasma','Fantasma'],['Dorado','Dorada'],['Plateado','Plateada'],
  ['Veloz','Veloz'],['Zen','Zen'],['Caótico','Caótica'],['Glacial','Glacial'],
  ['Volcánico','Volcánica'],['Lunar','Lunar'],['Solar','Solar'],['Estelar','Estelar'],
  ['Neón','Neón'],['Retro','Retro'],['Cibernético','Cibernética'],['Mágico','Mágica'],
  ['Sabio','Sabia'],['Travieso','Traviesa'],['Feroz','Feroz'],['Tranquilo','Tranquila'],
  ['Brillante','Brillante'],['Nocturno','Nocturna'],['Eléctrico','Eléctrica'],['Tropical','Tropical'],
  ['Ártico','Ártica'],['Feliz','Feliz'],['Gruñón','Gruñona'],['Dormilón','Dormilona'],
  ['Saltarín','Saltarina'],['Volador','Voladora'],['Invisible','Invisible'],['Millonario','Millonaria'],
  ['Pirata','Pirata'],['Samurái','Samurái'],['Atómico','Atómica'],['Biónico','Biónica'],
  ['Crujiente','Crujiente'],['Deluxe','Deluxe'],['Ultra','Ultra'],['Mega','Mega'],
  ['Hiperactivo','Hiperactiva'],['Ancestral','Ancestral'],['Misterioso','Misteriosa'],['Peludo','Peluda'],
  ['Diminuto','Diminuta'],['Gigante','Gigante'],['Parlanchín','Parlanchina'],['Chiflado','Chiflada'],
  ['Espacial','Espacial'],['Interdimensional','Interdimensional'],
];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function buildNick(){
  const [emoji, nombre, genero] = pick(NOMBRES);
  const adj = pick(ADJETIVOS)[genero === 'f' ? 1 : 0];
  const num = 10 + Math.floor(Math.random() * 990);
  return `${emoji} ${nombre}${adj}${num}`;
}

/* ═══════════════════════════════════════════════════════════════════════
   4 · UTILITIES
═══════════════════════════════════════════════════════════════════════ */
const $  = sel => document.querySelector(sel);
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};
const fmtTime = d => String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10));

function nickColor(str){
  let h = 0;
  for (const ch of String(str)) h = (h + ch.codePointAt(0)) % 360;
  return `hsl(${h} 72% 68%)`;
}

function emojiOf(nick){
  const first = String(nick || '').split(/\s+/)[0] || '';
  try { return /\p{Extended_Pictographic}/u.test(first) ? first : '💬'; }
  catch(e){ return first || '💬'; }
}

let toastTimer = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
}

/* ═══════════════════════════════════════════════════════════════════════
   5 · STATE
═══════════════════════════════════════════════════════════════════════ */
const myId   = uuid();
let myNick   = '';
let currentRoom = null;
let topic    = null;
let client   = null;
let inRoom   = false;
let soundOn  = true;
let hbTimer = null, pruneTimer = null;
let typingStopTimer = null, typingActive = false, lastTypingSent = 0;
let lastMsg = null;
let pendingScroll = 0;
let emptyState = null;
let unread = 0;
const peers  = new Map();
const typers = new Map();
const reactions = new Map(); // mid -> Map(emoji -> Set(ids))

/* ═══════════════════════════════════════════════════════════════════════
   6 · AUDIO
═══════════════════════════════════════════════════════════════════════ */
let audioCtx = null;
function ensureAudio(){
  if (!audioCtx){
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
function blip(freqs = [880, 1174], dur = .09, vol = .12){
  if (!soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  freqs.forEach((f, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + i*dur);
    g.gain.linearRampToValueAtTime(vol, t0 + i*dur + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + i*dur + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t0 + i*dur);
    o.stop(t0 + i*dur + dur + .05);
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   7 · MQTT CONNECTION
═══════════════════════════════════════════════════════════════════════ */
function connectToRoom(){
  if (typeof mqtt === 'undefined'){
    setConn('error');
    toast('⚠️ MQTT.js library failed to load');
    return;
  }
  setConn('connecting');
  openBroker(0);
}
function openBroker(i){
  if (i >= BROKERS.length){
    setConn('error');
    toast('😵 No brokers responding. Check connection.');
    return;
  }
  let connectedOnce = false, switched = false;
  const c = mqtt.connect(BROKERS[i], {
    clientId: 'minichat_' + Math.random().toString(16).slice(2, 10),
    keepalive: 30,
    clean: true,
    reconnectPeriod: 3000,
    connectTimeout: 10000,
    protocolVersion: 4,
    will: {
      topic,
      payload: JSON.stringify({ t:'p', e:'leave', id: myId, nick: myNick }),
      qos: 0,
      retain: false,
    },
  });
  client = c;
  c.on('connect', () => {
    if (c !== client) return;
    connectedOnce = true;
    setConn('ok');
    c.subscribe(topic, { qos: 0 }, err => {
      if (err){ toast('⚠️ Join error'); return; }
      try { c.publish(topic, JSON.stringify({ t:'p', e:'join', id: myId, nick: myNick, ts: Date.now() })); }
      catch(e){}
    });
    clearInterval(hbTimer);
    hbTimer = setInterval(() => {
      if (inRoom && client === c){
        try { c.publish(topic, JSON.stringify({ t:'p', e:'hb', id: myId, nick: myNick, ts: Date.now() })); }
        catch(e){}
      }
    }, HEARTBEAT_MS);
    clearInterval(pruneTimer);
    pruneTimer = setInterval(prunePeers, 10000);
  });
  c.on('message', (_t, payload) => { if (c === client) handleMessage(payload); });
  c.on('reconnect', () => { if (c === client) setConn('reconnecting'); });
  c.on('offline',   () => { if (c === client) setConn('reconnecting'); });
  c.on('close', () => {
    if (c !== client || switched) return;
    if (!connectedOnce){
      switched = true;
      c.end(true);
      openBroker(i + 1);
    } else {
      setConn('reconnecting');
    }
  });
  c.on('error', err => console.warn('[MiniChat MQTT]', err && err.message));
}

function handleMessage(raw){
  let p;
  try { p = JSON.parse(raw.toString()); } catch(e){ return; }
  if (!p || typeof p !== 'object' || p.id === myId) return;

  if (p.t === 'm'){
    p.nick = String(p.nick || '❔').slice(0, 60);
    p.text = String(p.text || '').slice(0, 600);
    if (!p.text) return;
    lastMsg = { id: p.id, ts: Date.now() };
    appendMsg(p, false);
    blip([740, 988]);
    bumpUnread();
  }
  else if (p.t === 'r'){
    handleReaction(p);
  }
  else if (p.t === 'p')  handlePresence(p);
  else if (p.t === 'ty') handleTyping(p);
}

function setConn(state){
  const box = $('#connStatus');
  box.className = 'conn conn--' + state;
  const labels = { ok:'Online', connecting:'Connecting…', reconnecting:'Reconnecting…', error:'Offline' };
  box.querySelector('.conn-text').textContent = labels[state] || '';
}

/* ═══════════════════════════════════════════════════════════════════════
   8 · PRESENCE & TYPING
═══════════════════════════════════════════════════════════════════════ */
function handlePresence(p){
  const nick = String(p.nick || '❔').slice(0, 60);
  if (p.e === 'join'){
    if (peers.has(p.id)){ peers.get(p.id).last = Date.now(); return; }
    peers.set(p.id, { nick, last: Date.now() });
    addSystem(t('joined', {nick}));
    blip([523, 784], .07, .07);
    bumpUnread();
    updateOnline();
    setTimeout(() => {
      if (!inRoom || !client) return;
      try { client.publish(topic, JSON.stringify({ t:'p', e:'hb', id: myId, nick: myNick, ts: Date.now() })); }
      catch(e){}
    }, 300 + Math.random() * 1200);
  } else if (p.e === 'hb'){
    const u = peers.get(p.id);
    if (u) u.last = Date.now();
    else { peers.set(p.id, { nick, last: Date.now() }); updateOnline(); }
  } else if (p.e === 'leave'){
    if (peers.delete(p.id)){
      const t = typers.get(p.id);
      if (t){ clearTimeout(t.timer); typers.delete(p.id); renderTyping(); }
      addSystem(t('left', {nick}));
      blip([392, 294], .07, .06);
      updateOnline();
    }
  }
}
function prunePeers(){
  const now = Date.now();
  let changed = false;
  for (const [id, u] of peers){
    if (now - u.last > PEER_TTL_MS){
      peers.delete(id);
      changed = true;
      const t = typers.get(id);
      if (t){ clearTimeout(t.timer); typers.delete(id); }
    }
  }
  if (changed){ updateOnline(); renderTyping(); }
}
function updateOnline(){
  $('#onlineCount').textContent = String(peers.size + 1);
}

function sendTypingEvent(on){
  if (!inRoom || !client) return;
  typingActive = on;
  try { client.publish(topic, JSON.stringify({ t:'ty', id: myId, nick: myNick, on })); }
  catch(e){}
}
function handleTyping(p){
  const nick = String(p.nick || '❔').slice(0, 60);
  if (p.on){
    let t = typers.get(p.id);
    if (!t){ t = {}; typers.set(p.id, t); }
    t.nick = nick;
    clearTimeout(t.timer);
    t.timer = setTimeout(() => { typers.delete(p.id); renderTyping(); }, TYPING_TIMEOUT);
    renderTyping();
  } else {
    const t = typers.get(p.id);
    if (t){ clearTimeout(t.timer); typers.delete(p.id); renderTyping(); }
  }
}
function renderTyping(){
  const bar = $('#typingBar'), txt = $('#typingText');
  const list = [...typers.values()].map(t => t.nick);
  if (!list.length){ bar.classList.remove('on'); txt.textContent = ''; return; }
  bar.classList.add('on');
  if (list.length === 1) txt.textContent = t('typingOne', {n: list[0]});
  else if (list.length === 2) txt.textContent = t('typingTwo', {n: list[0], m: list[1]});
  else txt.textContent = t('typingMany', {n: list.length});
}

/* ═══════════════════════════════════════════════════════════════════════
   9 · RENDERING & LOGIC
═══════════════════════════════════════════════════════════════════════ */
function linkify(text){
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

function parseCommands(text){
  if (text.startsWith('/dado')) return t('dice', {n: 1 + Math.floor(Math.random() * 6)});
  if (text.startsWith('/moneda')) return t('coin', {n: Math.random() > 0.5 ? (currentLang==='cn'?'正面':'Heads') : (currentLang==='cn'?'反面':'Tails')});
  return text;
}

function appendMsg(p, mine){
  if (emptyState){ emptyState.remove(); emptyState = null; }
  const mid = p.mid || uuid();
  p.mid = mid;
  
  const row = el('div', 'msg ' + (mine ? 'msg--mine' : 'msg--other'));
  const grouped = !p.replyTo && lastMsg && lastMsg.id === p.id && (Date.now() - lastMsg.ts) < GROUP_MS;
  if (grouped) row.classList.add('msg--grouped');
  
  const body = el('div', 'msg-body');
  if (!mine){
    const av = el('div', 'avatar', emojiOf(p.nick));
    row.appendChild(av);
    if (!grouped){
      const meta = el('div', 'meta');
      const who  = el('b', 'who', p.nick);
      who.style.color = nickColor(p.nick);
      meta.appendChild(who);
      meta.appendChild(el('time', '', fmtTime(new Date())));
      body.appendChild(meta);
    }
  }
  
  const bubble = el('div', 'bubble');
  bubble.dataset.mid = mid;
  
  // Process text (commands + links)
  let finalText = p.text;
  if (!p.isCommandResult) finalText = parseCommands(finalText);
  bubble.innerHTML = linkify(finalText);
  
  // Reaction Bar
  const rBar = el('div', 'reaction-bar');
  REACT_EMOJIS.forEach(emoji => {
    const btn = el('button', 'react-btn', emoji);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleReaction(mid, emoji);
    });
    rBar.appendChild(btn);
  });
  bubble.appendChild(rBar);
  
  // Render existing reactions
  const rContainer = el('div', 'bubble-reactions');
  renderReactionsForMsg(mid, rContainer);
  bubble.appendChild(rContainer);
  
  body.appendChild(bubble);
  if (mine) body.appendChild(el('time', 'msg-time', fmtTime(new Date())));
  row.appendChild(body);
  $('#messages').appendChild(row);
  
  if (mine || nearBottom()) scrollBottom(true);
  else {
    pendingScroll++;
    const jb = $('#jumpBtn');
    jb.hidden = false;
    jb.textContent = pendingScroll === 1 ? t('newMsg') : t('newMsgs', {n: pendingScroll});
  }
}

function addSystem(text){
  const box = $('#messages');
  box.appendChild(el('div', 'sys', text));
  if (nearBottom()) scrollBottom(true);
}

function nearBottom(){
  const m = $('#messages');
  return m.scrollHeight - m.scrollTop - m.clientHeight < 160;
}
function scrollBottom(smooth){
  const m = $('#messages');
  m.scrollTo({ top: m.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}
function resetJump(){ pendingScroll = 0; $('#jumpBtn').hidden = true; }
function bumpUnread(){
  if (document.hidden){
    unread++;
    document.title = `(${unread}) 💬 MiniChat`;
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   10 · REACTIONS
═══════════════════════════════════════════════════════════════════════ */
const REACT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

function toggleReaction(mid, emoji){
  if (!reactions.has(mid)) reactions.set(mid, new Map());
  const map = reactions.get(mid);
  if (!map.has(emoji)) map.set(emoji, new Set());
  
  const set = map.get(emoji);
  const isAdding = !set.has(myId);
  
  if (isAdding) set.add(myId);
  else set.delete(myId);
  
  if (set.size === 0) {
    map.delete(emoji);
    if (map.size === 0) reactions.delete(mid);
  }
  
  // Publish
  if (client && inRoom) {
    try {
      client.publish(topic, JSON.stringify({
        t: 'r',
        mid,
        emoji,
        id: myId,
        add: isAdding
      }));
    } catch(e){}
  }
  
  // Update UI locally
  updateReactionUI(mid);
}

function handleReaction(p){
  const { mid, emoji, id, add } = p;
  if (!reactions.has(mid)) reactions.set(mid, new Map());
  const map = reactions.get(mid);
  if (!map.has(emoji)) map.set(emoji, new Set());
  
  const set = map.get(emoji);
  if (add) set.add(id);
  else set.delete(id);
  
  if (set.size === 0) {
    map.delete(emoji);
    if (map.size === 0) reactions.delete(mid);
  }
  
  updateReactionUI(mid);
}

function updateReactionUI(mid){
  const bubble = document.querySelector(`.bubble[data-mid="${CSS.escape(mid)}"]`);
  if (!bubble) return;
  const container = bubble.querySelector('.bubble-reactions');
  if (container) {
    container.innerHTML = '';
    renderReactionsForMsg(mid, container);
  }
}

function renderReactionsForMsg(mid, container){
  if (!reactions.has(mid)) return;
  const map = reactions.get(mid);
  map.forEach((set, emoji) => {
    if (set.size === 0) return;
    const tag = el('span', 'react-tag', `${emoji} ${set.size}`);
    if (set.has(myId)) tag.classList.add('mine');
    tag.addEventListener('click', () => toggleReaction(mid, emoji));
    container.appendChild(tag);
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   11 · COMPOSITOR & THEMES
═══════════════════════════════════════════════════════════════════════ */
function sendMessage(){
  const ta = $('#msgInput');
  const text = ta.value.trim().slice(0, MAX_MSG_LEN);
  if (!text || !inRoom) return;
  
  const isCmd = text.startsWith('/dado') || text.startsWith('/moneda');
  const payload = { 
    t:'m', 
    id: myId, 
    mid: uuid(), 
    nick: myNick, 
    text: isCmd ? text : text, 
    ts: Date.now(),
    isCommandResult: isCmd
  };
  
  try { client && client.publish(topic, JSON.stringify(payload)); } catch(e){}
  lastMsg = { id: myId, ts: Date.now() };
  appendMsg(payload, true);
  ta.value = '';
  ta.style.height = 'auto';
  $('#sendBtn').disabled = true;
  if (typingActive) sendTypingEvent(false);
  ta.focus();
}

function onComposerInput(){
  const ta = $('#msgInput');
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 132) + 'px';
  const hasText = ta.value.trim().length > 0;
  $('#sendBtn').disabled = !hasText;
  if (hasText){
    if (Date.now() - lastTypingSent > 2000){
      sendTypingEvent(true);
      lastTypingSent = Date.now();
    }
    clearTimeout(typingStopTimer);
    typingStopTimer = setTimeout(() => sendTypingEvent(false), 2500);
  } else if (typingActive){
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
  localStorage.setItem(LS_THEME, color);
}

/* ═══════════════════════════════════════════════════════════════════════
   12 · ROOM MANAGEMENT
═══════════════════════════════════════════════════════════════════════ */
function enterRoom(room){
  currentRoom = room;
  topic = TOPIC_PREFIX + room;
  inRoom = true;
  localStorage.setItem(LS_ROOM, room);
  peers.clear(); typers.clear(); reactions.clear();
  lastMsg = null; pendingScroll = 0;
  const box = $('#messages');
  box.innerHTML = '';
  emptyState = el('div', 'empty');
  emptyState.innerHTML =
    '<span class="big">🫧</span><h3>' + t('emptyTitle') + '</h3>' +
    '<p>' + t('emptyDesc') + '</p>';
  box.appendChild(emptyState);
  $('#roomName').textContent = room;
  $('#jumpBtn').hidden = true;
  renderTyping();
  updateOnline();
  $('#lobby').hidden = true;
  $('#chat').hidden = false;
  history.replaceState(null, '', location.pathname + '?sala=' + encodeURIComponent(room));
  addSystem(t('entered', {room, nick: myNick}));
  connectToRoom();
  setTimeout(() => $('#msgInput').focus(), 80);
}

function leaveRoom(){
  if (!inRoom) return;
  inRoom = false;
  clearInterval(hbTimer); clearInterval(pruneTimer); clearTimeout(typingStopTimer);
  if (client){
    try {
      client.publish(topic, JSON.stringify({ t:'p', e:'leave', id: myId, nick: myNick }));
      client.end(false);
    } catch(e){}
    client = null;
  }
  currentRoom = null; topic = null;
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
  const url = location.origin + location.pathname + '?sala=' + encodeURIComponent(currentRoom);
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
  soundOn = !soundOn;
  localStorage.setItem(LS_SOUND, soundOn ? 'on' : 'off');
  updateSoundBtn();
  if (soundOn){ ensureAudio(); blip([880, 1175]); }
  toast(soundOn ? t('soundOn') : t('soundOff'));
}
function updateSoundBtn(){
  const b = $('#soundBtn');
  b.textContent = soundOn ? '🔔' : '🔕';
  b.setAttribute('aria-pressed', String(soundOn));
}

function rollNick(){
  myNick = buildNick();
  localStorage.setItem(LS_NICK, myNick);
  const d = $('#nickDisplay');
  d.textContent = myNick;
  d.classList.remove('pop'); void d.offsetWidth; d.classList.add('pop');
  const btn = $('#diceBtn');
  btn.classList.remove('rolling'); void btn.offsetWidth; btn.classList.add('rolling');
}

/* ═══════════════════════════════════════════════════════════════════════
   13 · BACKGROUND & UI BINDING
═══════════════════════════════════════════════════════════════════════ */
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
  // Language Selector
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
  });

  // Lobby
  $('#diceBtn').addEventListener('click', rollNick);
  $('#joinForm').addEventListener('submit', onJoinSubmit);
  $('#roomInput').addEventListener('input', () => { $('#roomError').hidden = true; });
  
  // Chat Header
  $('#leaveBtn').addEventListener('click', leaveRoom);
  $('#copyBtn').addEventListener('click', copyRoomLink);
  $('#soundBtn').addEventListener('click', toggleSound);
  
  // Theme Panel
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

  // Composer
  $('#sendForm').addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
  const input = $('#msgInput');
  input.addEventListener('input', onComposerInput);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });
  
  // Emojis
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
  
  // Jump Button
  $('#jumpBtn').addEventListener('click', () => { scrollBottom(true); resetJump(); });
  $('#messages').addEventListener('scroll', () => { if (nearBottom()) resetJump(); });
  
  // Audio Unlock
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  
  // Unread Counter
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden){ unread = 0; document.title = '💬 MiniChat'; }
  });
}

function init(){
  // Load Nick
  const saved = localStorage.getItem(LS_NICK);
  if (saved && saved.trim().length > 2){
    myNick = saved.trim();
  } else {
    myNick = buildNick();
    localStorage.setItem(LS_NICK, myNick);
  }
  $('#nickDisplay').textContent = myNick;
  
  // Load Sound
  soundOn = localStorage.getItem(LS_SOUND) !== 'off';
  updateSoundBtn();
  
  // Load Theme
  const savedTheme = localStorage.getItem(LS_THEME);
  if (savedTheme) applyTheme(savedTheme);
  
  // Load Language
  const savedLang = localStorage.getItem(LS_LANG);
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
    const last = localStorage.getItem(LS_ROOM);
    if (last) $('#roomInput').value = last;
  }
}
init();

window.addEventListener('pagehide', () => {
  if (inRoom && client){
    try {
      client.publish(topic, JSON.stringify({ t:'p', e:'leave', id: myId, nick: myNick }));
      client.end(true);
    } catch(e){}
  }
});