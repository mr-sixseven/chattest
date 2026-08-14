/* ═══════════════════════════════════════════════════════════════════════
   MiniChat · script.js
   Chat anónimo en tiempo real mediante MQTT sobre WebSockets, sin backend.

   Tipos de evento (JSON con campo "t"):
     t:'m'  → mensaje de chat   { id, mid, nick, text,  ts, replyTo? }
     t:'i'  → imagen            { id, mid, nick, img,   ts, replyTo? }
     t:'a'  → nota de voz       { id, mid, nick, audio, ts, replyTo? }
     t:'p'  → presencia         { e:'join'|'hb'|'leave', id, nick }
     t:'ty' → escribiendo…      { id, nick, on:true|false }

   "mid" es el identificador único de cada mensaje (para respuestas).
═══════════════════════════════════════════════════════════════════════ */
'use strict';

/* ═══════════════════════════════════════════════════════════════════════
   1 · CONFIGURACIÓN Y CONSTANTES
═══════════════════════════════════════════════════════════════════════ */
/** Brokers MQTT públicos con WebSockets TLS. Se prueban en orden. */
const BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',      // EMQX público
  'wss://broker.hivemq.com:8884/mqtt',   // HiveMQ público (respaldo)
];
const TOPIC_PREFIX   = 'minichat-es/v1/'; // prefijo para evitar colisiones
const HEARTBEAT_MS   = 15000;             // latido de presencia cada 15 s
const PEER_TTL_MS    = 45000;             // olvidar tras 45 s de silencio
const GROUP_MS       = 3 * 60 * 1000;     // agrupar mensajes seguidos (3 min)
const MAX_MSG_LEN    = 500;               // longitud máxima de mensaje
const TYPING_TIMEOUT = 5000;              // caducidad del "escribiendo…"
/* Límites multimedia: los brokers públicos cortan paquetes de ~256 KB */
const IMG_MAX_DIM    = 1280;              // lado máximo de imagen remuestreada
const IMG_MAX_KB     = 150;               // peso binario objetivo de imagen
const AUDIO_MAX_SEC  = 15;                // duración máxima de nota de voz
const AUDIO_MAX_KB   = 180;               // peso máximo del audio grabado
const MAX_MEDIA_B64  = 300000;            // caracteres base64 aceptados
const LS_NICK  = 'minichat:nick';         // claves de localStorage
const LS_SOUND = 'minichat:sonido';
const LS_ROOM  = 'minichat:ultimaSala';

/* ═══════════════════════════════════════════════════════════════════════
   2 · GENERADOR DE NICKS
   ~190 nombres × ~60 adjetivos × 990 números ≈ 11 millones de combos
═══════════════════════════════════════════════════════════════════════ */
const NOMBRES = [
  /* 🐾 Animales */
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
  /* 🍕 Comida */
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
  /* 🤖 Objetos */
  ['🤖','Robot','m'],['🎮','Mando','m'],['🕹️','Joystick','m'],['📼','Casete','m'],
  ['💾','Disquete','m'],['📻','Radio','f'],['📺','Tele','f'],['💡','Bombilla','f'],
  ['🔦','Linterna','f'],['🔮','BolaCristal','f'],['🎲','Dado','m'],['🧩','Puzzle','m'],
  ['🎈','Globo','m'],['🎪','Circo','m'],['🎩','Sombrero','m'],['⌚','Reloj','m'],
  ['⚙️','Engranaje','m'],['📦','Paquete','m'],['🗿','Moái','m'],['🪩','BolaDisco','f'],
  ['🎺','Trompeta','f'],['🎸','Guitarra','f'],['🥁','Batería','f'],['🎻','Violín','m'],
  ['🧸','Peluche','m'],['🪀','Yoyó','m'],['🎳','Bolos','m'],['🪄','Varita','f'],
  /* 🌌 Espacio */
  ['🌌','Galaxia','f'],['⭐','Estrella','f'],['🌟','Supernova','f'],['☄️','Cometa','m'],
  ['🪐','Planeta','m'],['🌙','Luna','f'],['🌕','LunaLlena','f'],['☀️','Sol','m'],
  ['🌈','Arcoíris','m'],['🌠','EstrellaFugaz','f'],['🛰️','Satélite','m'],['🔭','Telescopio','m'],
  ['👽','Alien','m'],['🧑‍🚀','Astronauta','m'],['💫','Nebulosa','f'],['🕳️','AgujeroNegro','m'],
  ['🛸','Ovni','m'],['🚀','Cohete','m'],
  /* 🧪 Ciencia */
  ['🧪','Matraz','m'],['⚗️','Alambique','m'],['🧬','ADN','m'],['🦠','Microbio','m'],
  ['⚛️','Átomo','m'],['⚡','Electrón','m'],['🔬','Microscopio','m'],['🧲','Imán','m'],
  ['💊','Píldora','f'],['🔋','Batería','f'],['🌡️','Termómetro','m'],['🧠','Cerebro','m'],
  ['💎','Cristal','m'],['🪨','Meteorito','m'],['🌋','Volcán','m'],['🌪️','Tornado','m'],
  /* 🎮 Videojuegos */
  ['👾','Invasor','m'],['🏆','Campeón','m'],['🗡️','Espada','f'],['🛡️','Escudo','m'],
  ['🏹','Arquero','m'],['🧙','Mago','m'],['🧝','Elfo','m'],['🧟','Zombi','m'],
  ['🧛','Vampiro','m'],['💣','Bomba','f'],['🍄','Champiñón','m'],['💰','Tesoro','m'],
  ['🗝️','LlaveAntigua','f'],['🎯','Diana','f'],['🔥','Fénix','m'],['⚔️','Espadachín','m'],
  ['🧱','Bloque','m'],['🤺','Esgrimista','m'],['🐲','Dragoncito','m'],['💠','Gema','f'],
];
/** Adjetivos como [masculino, femenino] para que el nick concuerde. */
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
const EMOJIS_RAROS = ['🦖','👽','🤖','🛸','💀','🎃','🫠'];
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
/** Construye un nick del tipo  🐧 PingüinoTurbo381 */
function buildNick(){
  const [emoji, nombre, genero] = pick(NOMBRES);
  const adj = pick(ADJETIVOS)[genero === 'f' ? 1 : 0];
  const num = 10 + Math.floor(Math.random() * 990);       // 10 – 999
  return `${emoji} ${nombre}${adj}${num}`;
}

/* ═══════════════════════════════════════════════════════════════════════
   3 · UTILIDADES DOM Y VARIAS
═══════════════════════════════════════════════════════════════════════ */
const $  = sel => document.querySelector(sel);
/** Crea un elemento con clase y texto opcionales (textContent = sin XSS). */
const el = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};
const fmtTime = d =>
  String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
const uuid = () => (crypto.randomUUID
  ? crypto.randomUUID()
  : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,10));
/** Color estable por nick. */
function nickColor(str){
  let h = 0;
  for (const ch of String(str)) h = (h + ch.codePointAt(0)) % 360;
  return `hsl(${h} 72% 68%)`;
}
/** Extrae el emoji inicial de un nick. */
function emojiOf(nick){
  const first = String(nick || '').split(/\s+/)[0] || '';
  try { return /\p{Extended_Pictographic}/u.test(first) ? first : '💬'; }
  catch(e){ return first || '💬'; }
}
/** Toast flotante de avisos. */
let toastTimer = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
}

/* ═══════════════════════════════════════════════════════════════════════
   4 · ESTADO GLOBAL
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
/* Respuestas y multimedia */
let replyTo = null;                 // {mid, nick, text} del mensaje respondido
const msgIndex = new Map();         // mid → resumen del mensaje pintado
let mediaRecorder = null, audioChunks = [], isRecording = false, recTimer = null;

/** Guarda el resumen de un mensaje para poder responderlo después. */
function msgIndexSet(mid, data){
  msgIndex.set(mid, data);
  if (msgIndex.size > 400) msgIndex.delete(msgIndex.keys().next().value);
}
/** Sanea un replyTo recibido (evita datos raros). */
function cleanReply(r){
  if (!r || typeof r !== 'object') return undefined;
  const mid  = String(r.mid || '').slice(0, 64);
  const nick = String(r.nick || '❔').slice(0, 60);
  const text = String(r.text || '').slice(0, 120);
  return mid ? { mid, nick, text } : undefined;
}
/** Añade la respuesta en curso a un payload y la limpia. */
function attachReply(payload){
  if (replyTo){
    payload.replyTo = { mid: replyTo.mid, nick: replyTo.nick, text: String(replyTo.text || '').slice(0, 120) };
    clearReply();
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   5 · SONIDO (WebAudio, sin archivos externos)
═══════════════════════════════════════════════════════════════════════ */
let audioCtx = null;
function ensureAudio(){
  if (!audioCtx){
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){ /* navegador sin WebAudio: silencio */ }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}
/** Pequeño "blip" de dos tonos. */
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
   6 · MQTT: CONEXIÓN, BROKERS Y EVENTOS
═══════════════════════════════════════════════════════════════════════ */
function connectToRoom(){
  if (typeof mqtt === 'undefined'){
    setConn('error');
    toast('⚠️ No se pudo cargar la librería MQTT.js');
    return;
  }
  setConn('connecting');
  openBroker(0);
}
/** Intenta conectar con el broker i-ésimo; si falla, pasa al siguiente. */
function openBroker(i){
  if (i >= BROKERS.length){
    setConn('error');
    toast('😵 Ningún broker responde. Revisa tu conexión.');
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
    /* Testamento MQTT: si desaparecemos sin despedirnos, el broker avisa. */
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
      if (err){ toast('⚠️ Problema al unirse a la sala'); return; }
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
/** Enrutador de mensajes entrantes. Ignora los propios. */
function handleMessage(raw){
  let p;
  try { p = JSON.parse(raw.toString()); } catch(e){ return; }
  if (!p || typeof p !== 'object' || p.id === myId) return;

  if (p.t === 'm'){                              // ── mensaje de chat ──
    p.nick = String(p.nick || '❔ Anónimo').slice(0, 60);
    p.text = String(p.text || '').slice(0, 600);
    if (!p.text) return;
    p.replyTo = cleanReply(p.replyTo);
    lastMsg = { id: p.id, ts: Date.now() };
    appendMsg(p, false);
    blip([740, 988]);
    bumpUnread();
  }
  else if (p.t === 'i'){                         // ── imagen ──
    p.nick = String(p.nick || '❔ Anónimo').slice(0, 60);
    if (typeof p.img !== 'string'
        || !/^data:image\/[a-z0-9+.-]+;base64,/.test(p.img)
        || p.img.length > MAX_MEDIA_B64) return;
    p.replyTo = cleanReply(p.replyTo);
    lastMsg = { id: p.id, ts: Date.now() };
    appendMsg(p, false);
    blip([740, 988]);
    bumpUnread();
  }
  else if (p.t === 'a'){                         // ── nota de voz ──
    p.nick = String(p.nick || '❔ Anónimo').slice(0, 60);
    if (typeof p.audio !== 'string'
        || !/^data:audio\/[a-z0-9+.-]+;base64,/.test(p.audio)
        || p.audio.length > MAX_MEDIA_B64) return;
    p.replyTo = cleanReply(p.replyTo);
    lastMsg = { id: p.id, ts: Date.now() };
    appendMsg(p, false);
    blip([740, 988]);
    bumpUnread();
  }
  else if (p.t === 'p')  handlePresence(p);      // ── presencia ──
  else if (p.t === 'ty') handleTyping(p);        // ── escribiendo… ──
}
/** Indicador de estado de conexión en la cabecera. */
function setConn(state){
  const box = $('#connStatus');
  box.className = 'conn conn--' + state;
  const labels = { ok:'En línea', connecting:'Conectando…', reconnecting:'Reconectando…', error:'Sin conexión' };
  box.querySelector('.conn-text').textContent = labels[state] || '';
}

/* ═══════════════════════════════════════════════════════════════════════
   7 · PRESENCIA: contador de usuarios, entradas y salidas
═══════════════════════════════════════════════════════════════════════ */
function handlePresence(p){
  const nick = String(p.nick || '❔').slice(0, 60);
  if (p.e === 'join'){
    if (peers.has(p.id)){ peers.get(p.id).last = Date.now(); return; }
    peers.set(p.id, { nick, last: Date.now() });
    addSystem(`${nick} ha entrado en la sala`);
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
      addSystem(`${nick} ha salido de la sala`);
      blip([392, 294], .07, .06);
      updateOnline();
    }
  }
}
/** Elimina usuarios que llevan demasiado tiempo sin dar señales. */
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
  $('#onlinePill').title = peers.size
    ? `Conectado con ${peers.size} persona${peers.size > 1 ? 's' : ''} más`
    : 'Solo tú por aquí… de momento';
}

/* ═══════════════════════════════════════════════════════════════════════
   8 · INDICADOR "ESCRIBIENDO…"
═══════════════════════════════════════════════════════════════════════ */
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
  txt.textContent =
    list.length === 1 ? `${list[0]} está escribiendo…` :
    list.length === 2 ? `${list[0]} y ${list[1]} están escribiendo…` :
    `${list.length} personas están escribiendo…`;
}

/* ═══════════════════════════════════════════════════════════════════════
   9 · RENDERIZADO DE MENSAJES Y SCROLL AUTOMÁTICO
═══════════════════════════════════════════════════════════════════════ */
function appendMsg(p, mine){
  if (emptyState){ emptyState.remove(); emptyState = null; }
  const mid = p.mid || uuid();
  p.mid = mid;
  msgIndexSet(mid, { mid, nick: p.nick, text: p.text || '', img: !!p.img, audio: !!p.audio });

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
  /* Cabecera de respuesta (si la hay) */
  if (p.replyTo){
    const rep = el('div', 'reply-header');
    const rn  = el('span', 'reply-nick', '↩ ' + p.replyTo.nick);
    rn.style.color = nickColor(p.replyTo.nick);
    rep.appendChild(rn);
    rep.appendChild(el('span', 'reply-text', p.replyTo.text || '…'));
    rep.addEventListener('click', () => scrollToMsg(p.replyTo.mid));
    bubble.appendChild(rep);
  }
  /* Contenido: imagen, audio o texto */
  if (p.img){
    const im = document.createElement('img');
    im.src = p.img;
    im.alt = 'Imagen de ' + p.nick;
    im.className = 'bubble-img';
    im.loading = 'lazy';
    im.addEventListener('click', () => openLightbox(p.img));
    bubble.classList.add('bubble--img');
    bubble.appendChild(im);
  } else if (p.audio){
    const au = document.createElement('audio');
    au.controls = true;
    au.preload = 'none';
    au.src = p.audio;
    bubble.classList.add('bubble--audio');
    bubble.appendChild(au);
  } else {
    bubble.appendChild(document.createTextNode(p.text));
  }
  body.appendChild(bubble);
  if (mine) body.appendChild(el('time', 'msg-time', fmtTime(new Date())));
  row.appendChild(body);
  $('#messages').appendChild(row);
  /* Scroll automático inteligente */
  if (mine || nearBottom()) scrollBottom(true);
  else {
    pendingScroll++;
    const jb = $('#jumpBtn');
    jb.hidden = false;
    jb.textContent = pendingScroll === 1 ? '↓ Nuevo mensaje' : `↓ ${pendingScroll} mensajes nuevos`;
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
/** Título de la pestaña con contador cuando hay mensajes sin leer. */
function bumpUnread(){
  if (document.hidden){
    unread++;
    document.title = `(${unread}) 💬 MiniChat`;
  }
}
/** Salta hasta el mensaje original de una respuesta. */
function scrollToMsg(mid){
  if (!mid) return;
  const b = $('#messages').querySelector(`.bubble[data-mid="${CSS.escape(mid)}"]`);
  if (!b){ toast('Ese mensaje ya no está en pantalla'); return; }
  b.scrollIntoView({ behavior:'smooth', block:'center' });
  b.classList.add('highlight');
  setTimeout(() => b.classList.remove('highlight'), 1600);
}

/* ═══════════════════════════════════════════════════════════════════════
   10 · COMPOSITOR: enviar, Enter, auto-crecer, emojis
═══════════════════════════════════════════════════════════════════════ */
function sendMessage(){
  const ta = $('#msgInput');
  const text = ta.value.trim().slice(0, MAX_MSG_LEN);
  if (!text || !inRoom) return;
  const payload = { t:'m', id: myId, mid: uuid(), nick: myNick, text, ts: Date.now() };
  attachReply(payload);
  try { client && client.publish(topic, JSON.stringify(payload)); } catch(e){}
  lastMsg = { id: myId, ts: Date.now() };
  appendMsg(payload, true);
  ta.value = '';
  ta.style.height = 'auto';
  $('#sendBtn').disabled = true;
  if (typingActive) sendTypingEvent(false);
  ta.focus();
}
/** Input del compositor: auto-altura, botón Enviar y "escribiendo…". */
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
    b.title = 'Insertar ' + ch;
    b.addEventListener('click', () => {
      const ta = $('#msgInput');
      ta.setRangeText(ch, ta.selectionStart, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();
    });
    panel.appendChild(b);
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   11 · MULTIMEDIA: IMÁGENES, NOTAS DE VOZ Y LIGHTBOX
═══════════════════════════════════════════════════════════════════════ */
/** Redimensiona y comprime una imagen para que quepa en el paquete MQTT. */
function compressImage(file, maxDim = IMG_MAX_DIM, maxKB = IMG_MAX_KB){
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width  * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const cv = Object.assign(document.createElement('canvas'), { width: w, height: h });
      const ctx = cv.getContext('2d');
      ctx.fillStyle = '#fff';               // fondo para PNG con transparencia
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let q = .85, out;
      do {
        out = cv.toDataURL('image/jpeg', q);
        q -= .1;
      } while (out.length * .75 > maxKB * 1024 && q >= .3);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('imagen no válida')); };
    img.src = url;
  });
}
/** Envía una imagen (comprimida) a la sala. */
async function sendImageFile(file){
  if (!inRoom || !client) return;
  if (!file || !file.type.startsWith('image/')){ toast('Solo se admiten imágenes'); return; }
  toast('🖼️ Comprimiendo imagen…');
  try {
    const dataUrl = await compressImage(file);
    const payload = { t:'i', id: myId, mid: uuid(), nick: myNick, img: dataUrl, ts: Date.now() };
    attachReply(payload);
    try { client.publish(topic, JSON.stringify(payload)); } catch(e){ return; }
    lastMsg = { id: myId, ts: Date.now() };
    appendMsg(payload, true);
  } catch(e){ toast('No se pudo procesar la imagen 😕'); }
}
/** Alterna grabación de nota de voz (máx. AUDIO_MAX_SEC segundos). */
async function toggleRecording(){
  if (isRecording){ stopRecording(); return; }
  if (!inRoom || !client) return;
  if (!window.MediaRecorder || !navigator.mediaDevices){
    toast('Tu navegador no permite grabar audio 😕'); return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg']
      .find(t => MediaRecorder.isTypeSupported(t));
    if (!mime){ stream.getTracks().forEach(t => t.stop()); toast('Formato de audio no soportado 😕'); return; }
    mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
    audioChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      audioChunks = [];
      if (!blob.size){ toast('No se grabó nada 😕'); return; }
      if (blob.size > AUDIO_MAX_KB * 1024){ toast('La nota es demasiado larga 😕'); return; }
      const fr = new FileReader();
      fr.onloadend = () => {
        if (!inRoom || !client) return;
        const payload = { t:'a', id: myId, mid: uuid(), nick: myNick, audio: fr.result, ts: Date.now() };
        attachReply(payload);
        try { client.publish(topic, JSON.stringify(payload)); } catch(e){ return; }
        lastMsg = { id: myId, ts: Date.now() };
        appendMsg(payload, true);
        blip([880, 1174]);
      };
      fr.readAsDataURL(blob);
    };
    mediaRecorder.start(250);
    isRecording = true;
    const btn = $('#audioBtn');
    btn.textContent = '⏹️';
    btn.classList.add('recording');
    toast(`🎙️ Grabando… máximo ${AUDIO_MAX_SEC} s. Toca ⏹️ para enviar`);
    recTimer = setTimeout(stopRecording, AUDIO_MAX_SEC * 1000);
  } catch(e){ toast('🎤 Permiso de micrófono denegado'); }
}
function stopRecording(){
  clearTimeout(recTimer);
  if (!isRecording) return;
  isRecording = false;
  const btn = $('#audioBtn');
  btn.textContent = '🎙️';
  btn.classList.remove('recording');
  try { if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop(); } catch(e){}
}
/** Visor de imágenes a pantalla completa (clic para cerrar). */
function openLightbox(src){
  const lb = el('div', 'lightbox');
  const im = document.createElement('img');
  im.src = src;
  im.alt = 'Imagen ampliada';
  lb.appendChild(im);
  lb.addEventListener('click', () => lb.remove());
  document.body.appendChild(lb);
}

/* ═══════════════════════════════════════════════════════════════════════
   12 · RESPUESTAS: barra, swipe y clic derecho
═══════════════════════════════════════════════════════════════════════ */
function showReplyPreview(mid){
  const s = msgIndex.get(mid);
  if (!s) return;
  replyTo = {
    mid:  s.mid,
    nick: s.nick,
    text: s.text || (s.img ? '📷 Imagen' : s.audio ? '🎵 Nota de voz' : 'Mensaje'),
  };
  const rn = $('#replyNick');
  rn.textContent = '↩ ' + s.nick;
  rn.style.color = nickColor(s.nick);
  $('#replyText').textContent = replyTo.text;
  $('#replyBar').hidden = false;
  $('#msgInput').focus();
}
function clearReply(){
  replyTo = null;
  const bar = $('#replyBar');
  if (bar) bar.hidden = true;
}
/** Swipe-to-reply: deslizar una burbuja hacia la derecha. */
function initSwipeReply(){
  const box = $('#messages');
  let sw = null;
  box.addEventListener('touchstart', e => {
    const bubble = e.target.closest && e.target.closest('.bubble');
    if (!bubble || e.touches.length !== 1){ sw = null; return; }
    sw = { x: e.touches[0].clientX, y: e.touches[0].clientY, bubble, moved: false };
  }, { passive: true });
  box.addEventListener('touchmove', e => {
    if (!sw) return;
    const dx = e.touches[0].clientX - sw.x;
    const dy = e.touches[0].clientY - sw.y;
    if (!sw.moved){
      if (Math.abs(dx) < 14 || Math.abs(dx) < Math.abs(dy)){ sw = null; return; } // era scroll
      sw.moved = true;
    }
    if (dx > 0) sw.bubble.style.transform = `translateX(${Math.min(dx, 90)}px)`;
  }, { passive: true });
  box.addEventListener('touchend', e => {
    if (!sw) return;
    const { bubble, moved, x } = sw;
    const dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : x) - x;
    sw = null;
    bubble.style.transition = 'transform .18s ease';
    bubble.style.transform = '';
    setTimeout(() => { bubble.style.transition = ''; }, 200);
    if (moved && dx > 70) showReplyPreview(bubble.dataset.mid);
  }, { passive: true });
  /* En escritorio: clic derecho sobre la burbuja */
  box.addEventListener('contextmenu', e => {
    const bubble = e.target.closest && e.target.closest('.bubble');
    if (!bubble) return;
    e.preventDefault();
    showReplyPreview(bubble.dataset.mid);
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   13 · LOBBY, SALAS, COPIAR ENLACE Y SONIDO
═══════════════════════════════════════════════════════════════════════ */
function enterRoom(room){
  currentRoom = room;
  topic = TOPIC_PREFIX + room;
  inRoom = true;
  localStorage.setItem(LS_ROOM, room);
  /* Reinicio de la interfaz de la sala */
  peers.clear(); typers.clear(); msgIndex.clear();
  lastMsg = null; pendingScroll = 0;
  clearReply(); stopRecording();
  const box = $('#messages');
  box.innerHTML = '';
  emptyState = el('div', 'empty');
  emptyState.innerHTML =
    '<span class="big">🫧</span><h3>Nadie ha hablado todavía</h3>' +
    '<p>Sé quien rompa el hielo… o comparte la sala para que llegue más gente.</p>';
  box.appendChild(emptyState);
  $('#roomName').textContent = room;
  $('#jumpBtn').hidden = true;
  renderTyping();
  updateOnline();
  $('#lobby').hidden = true;
  $('#chat').hidden = false;
  history.replaceState(null, '', location.pathname + '?sala=' + encodeURIComponent(room));
  addSystem(`Has entrado en #${room} como ${myNick}`);
  connectToRoom();
  setTimeout(() => $('#msgInput').focus(), 80);
}
function leaveRoom(){
  if (!inRoom) return;
  inRoom = false;
  clearInterval(hbTimer); clearInterval(pruneTimer); clearTimeout(typingStopTimer);
  stopRecording(); clearReply();
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
    toast('🔗 Enlace de la sala copiado');
  } catch(e){
    const ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('🔗 Enlace copiado'); }
    catch(e2){ toast('No se pudo copiar 😕'); }
    ta.remove();
  }
}
function toggleSound(){
  soundOn = !soundOn;
  localStorage.setItem(LS_SOUND, soundOn ? 'on' : 'off');
  updateSoundBtn();
  if (soundOn){ ensureAudio(); blip([880, 1175]); }
  toast(soundOn ? '🔔 Sonidos activados' : '🔕 Sonidos silenciados');
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
   14 · FONDO: EMOJIS FLOTANTES
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

/* ═══════════════════════════════════════════════════════════════════════
   15 · ENLACE DE EVENTOS (UI)
═══════════════════════════════════════════════════════════════════════ */
function bindUI(){
  /* Lobby */
  $('#diceBtn').addEventListener('click', rollNick);
  $('#joinForm').addEventListener('submit', onJoinSubmit);
  $('#roomInput').addEventListener('input', () => { $('#roomError').hidden = true; });
  /* Chat: cabecera */
  $('#leaveBtn').addEventListener('click', leaveRoom);
  $('#copyBtn').addEventListener('click', copyRoomLink);
  $('#soundBtn').addEventListener('click', toggleSound);
  /* Compositor: Enviar también con Enter (Shift+Enter = salto de línea) */
  $('#sendForm').addEventListener('submit', e => { e.preventDefault(); sendMessage(); });
  const input = $('#msgInput');
  input.addEventListener('input', onComposerInput);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }
  });
  /* Pegar imagen desde el portapapeles (Ctrl+V) */
  input.addEventListener('paste', e => {
    const f = [...(e.clipboardData?.files || [])].find(x => x.type.startsWith('image/'));
    if (f){ e.preventDefault(); sendImageFile(f); }
  });
  /* Imágenes: botón + selector de archivo */
  $('#imgBtn').addEventListener('click', () => $('#imgFile').click());
  $('#imgFile').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) sendImageFile(f);
    e.target.value = '';
  });
  /* Notas de voz */
  $('#audioBtn').addEventListener('click', toggleRecording);
  /* Respuestas: barra y cancelación */
  $('#replyClose').addEventListener('click', () => { clearReply(); input.focus(); });
  input.addEventListener('keydown', e => { if (e.key === 'Escape' && replyTo) clearReply(); });
  initSwipeReply();
  /* Panel de emojis */
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
  /* Pill "nuevos mensajes" + reset al llegar al fondo */
  $('#jumpBtn').addEventListener('click', () => { scrollBottom(true); resetJump(); });
  $('#messages').addEventListener('scroll', () => { if (nearBottom()) resetJump(); });
  /* Desbloqueo de audio con el primer gesto (política de los navegadores) */
  window.addEventListener('pointerdown', ensureAudio, { once: true });
  /* Contador de no leídos en el título de la pestaña */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden){ unread = 0; document.title = '💬 MiniChat'; }
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   16 · INICIALIZACIÓN Y SALIDA
═══════════════════════════════════════════════════════════════════════ */
function init(){
  const saved = localStorage.getItem(LS_NICK);
  if (saved && saved.trim().length > 2){
    myNick = saved.trim();
  } else {
    myNick = buildNick();
    localStorage.setItem(LS_NICK, myNick);
  }
  $('#nickDisplay').textContent = myNick;
  soundOn = localStorage.getItem(LS_SOUND) !== 'off';
  updateSoundBtn();
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
/* Despedida al cerrar la pestaña (el LWT cubre los cierres abruptos). */
window.addEventListener('pagehide', () => {
  if (inRoom && client){
    try {
      client.publish(topic, JSON.stringify({ t:'p', e:'leave', id: myId, nick: myNick }));
      client.end(true);
    } catch(e){}
  }
});