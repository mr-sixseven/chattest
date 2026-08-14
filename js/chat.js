'use strict';
const polls = new Map();
let prevMsg = null;

function connectToRoom(){
  if (typeof mqtt === 'undefined'){ setConn('error'); toast('⚠️ MQTT.js library failed to load'); return; }
  setConn('connecting'); openBroker(0);
}
function openBroker(i){
  if (i >= CONFIG.BROKERS.length){ setConn('error'); toast('😵 No brokers responding.'); return; }
  let connectedOnce = false, switched = false;
  const c = mqtt.connect(CONFIG.BROKERS[i], {
    clientId: 'minichat_' + Math.random().toString(16).slice(2, 10),
    keepalive: 30, clean: true, reconnectPeriod: 3000, connectTimeout: 10000, protocolVersion: 4,
    will: { topic: STATE.topic, payload: JSON.stringify({ t:'p', e:'leave', id: STATE.myId, nick: STATE.myNick }), qos: 0, retain: false },
  });
  STATE.client = c;
  c.on('connect', () => {
    if (c !== STATE.client) return; connectedOnce = true; setConn('ok');
    c.subscribe(STATE.topic, { qos: 0 }, err => {
      if (err){ toast('⚠️ Join error'); return; }
      try { c.publish(STATE.topic, JSON.stringify({ t:'p', e:'join', id: STATE.myId, nick: STATE.myNick, ts: Date.now() })); } catch(e){}
    });
    clearInterval(STATE.hbTimer);
    STATE.hbTimer = setInterval(() => {
      if (STATE.inRoom && STATE.client === c){ try { c.publish(STATE.topic, JSON.stringify({ t:'p', e:'hb', id: STATE.myId, nick: STATE.myNick, ts: Date.now() })); } catch(e){} }
    }, CONFIG.HEARTBEAT_MS);
    clearInterval(STATE.pruneTimer); STATE.pruneTimer = setInterval(prunePeers, 10000);
  });
  c.on('message', (_t, payload) => { if (c === STATE.client) handleMessage(payload); });
  c.on('reconnect', () => { if (c === STATE.client) setConn('reconnecting'); });
  c.on('offline', () => { if (c === STATE.client) setConn('reconnecting'); });
  c.on('close', () => {
    if (c !== STATE.client || switched) return;
    if (!connectedOnce){ switched = true; c.end(true); openBroker(i + 1); } else { setConn('reconnecting'); }
  });
  c.on('error', err => console.warn('[MiniChat MQTT]', err && err.message));
}
function handleMessage(raw){
  let p; try { p = JSON.parse(raw.toString()); } catch(e){ return; }
  if (!p || typeof p !== 'object' || p.id === STATE.myId) return;
  if (p.t === 'm'){
    p.nick = String(p.nick || '❔').slice(0, 60); p.text = String(p.text || '').slice(0, 600);
    if (!p.text) return;
    appendMsg(p, false); blip([740, 988]); bumpUnread();
  }
  else if (p.t === 'i'){
    p.nick = String(p.nick || '❔').slice(0, 60);
    if (typeof p.img !== 'string' || !/^data:image\/[a-z0-9+.-]+;base64,/.test(p.img) || p.img.length > 300000) return;
    appendMsg(p, false); blip([740, 988]); bumpUnread();
  }
  else if (p.t === 'a'){
    p.nick = String(p.nick || '❔').slice(0, 60);
    if (typeof p.audio !== 'string' || !/^data:audio\/[a-z0-9+.-]+;base64,/.test(p.audio) || p.audio.length > 300000) return;
    appendMsg(p, false); blip([740, 988]); bumpUnread();
  }
  else if (p.t === 'r'){ handleReaction(p); }
  else if (p.t === 'v'){ handleVote(p); }
  else if (p.t === 'p') handlePresence(p);
  else if (p.t === 'ty') handleTyping(p);
}
function setConn(state){
  const box = $('#connStatus'); box.className = 'conn conn--' + state;
  const labels = { ok:'Online', connecting:'Connecting…', reconnecting:'Reconnecting…', error:'Offline' };
  box.querySelector('.conn-text').textContent = labels[state] || '';
}
function handlePresence(p){
  const nick = String(p.nick || '❔').slice(0, 60);
  if (p.e === 'join'){
    if (STATE.peers.has(p.id)){ STATE.peers.get(p.id).last = Date.now(); return; }
    STATE.peers.set(p.id, { nick, last: Date.now() }); addSystem(t('joined', {nick})); blip([523, 784], .07, .07); bumpUnread(); updateOnline();
    setTimeout(() => { if (!STATE.inRoom || !STATE.client) return; try { STATE.client.publish(STATE.topic, JSON.stringify({ t:'p', e:'hb', id: STATE.myId, nick: STATE.myNick, ts: Date.now() })); } catch(e){} }, 300 + Math.random() * 1200);
  } else if (p.e === 'hb'){
    const u = STATE.peers.get(p.id); if (u) u.last = Date.now(); else { STATE.peers.set(p.id, { nick, last: Date.now() }); updateOnline(); }
  } else if (p.e === 'leave'){
    if (STATE.peers.delete(p.id)){
      const t = STATE.typers.get(p.id); if (t){ clearTimeout(t.timer); STATE.typers.delete(p.id); renderTyping(); }
      addSystem(t('left', {nick})); blip([392, 294], .07, .06); updateOnline();
    }
  }
}
function prunePeers(){
  const now = Date.now(); let changed = false;
  for (const [id, u] of STATE.peers){
    if (now - u.last > CONFIG.PEER_TTL_MS){ STATE.peers.delete(id); changed = true; const t = STATE.typers.get(id); if (t){ clearTimeout(t.timer); STATE.typers.delete(id); } }
  }
  if (changed){ updateOnline(); renderTyping(); }
}
function updateOnline(){ $('#onlineCount').textContent = String(STATE.peers.size + 1); }
function sendTypingEvent(on){
  if (!STATE.inRoom || !STATE.client) return; STATE.typingActive = on;
  try { STATE.client.publish(STATE.topic, JSON.stringify({ t:'ty', id: STATE.myId, nick: STATE.myNick, on })); } catch(e){}
}
function handleTyping(p){
  const nick = String(p.nick || '❔').slice(0, 60);
  if (p.on){
    let t = STATE.typers.get(p.id); if (!t){ t = {}; STATE.typers.set(p.id, t); }
    t.nick = nick; clearTimeout(t.timer); t.timer = setTimeout(() => { STATE.typers.delete(p.id); renderTyping(); }, CONFIG.TYPING_TIMEOUT); renderTyping();
  } else { const t = STATE.typers.get(p.id); if (t){ clearTimeout(t.timer); STATE.typers.delete(p.id); renderTyping(); } }
}
function renderTyping(){
  const bar = $('#typingBar'), txt = $('#typingText');
  const list = [...STATE.typers.values()].map(t => t.nick);
  if (!list.length){ bar.classList.remove('on'); txt.textContent = ''; return; }
  bar.classList.add('on');
  if (list.length === 1) txt.textContent = t('typingOne', {n: list[0]});
  else if (list.length === 2) txt.textContent = t('typingTwo', {n: list[0], m: list[1]});
  else txt.textContent = t('typingMany', {n: list.length});
}
function linkify(text){
  const urlRegex = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}
function parseCommands(text){
  if (text.startsWith('/dado')) return t('dice', {n: 1 + Math.floor(Math.random() * 6)});
  if (text.startsWith('/moneda')) return t('coin', {n: Math.random() > 0.5 ? (currentLang==='cn'?'正面':'Heads') : (currentLang==='cn'?'反面':'Tails')});
  if (text.startsWith('/8ball')) {
    const answers = currentLang === 'es' ? ['Sí', 'No', 'Quizás', 'Nunca', 'Definitivamente'] :
                    currentLang === 'cn' ? ['是', '否', '也许', '绝不', '肯定'] :
                    ['Yes', 'No', 'Maybe', 'Never', 'Definitely'];
    return `🎱 ${answers[Math.floor(Math.random() * answers.length)]}`;
  }
  if (text.startsWith('/lorem')) return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
  if (text.startsWith('/encuesta')) {
    const parts = text.slice(10).trim().split(' ').filter(x => x.length > 0);
    if (parts.length < 3) return '⚠️ Uso: /encuesta Pregunta? Opción1 Opción2 [ÍndiceCorrecto]';
    const question = parts[0];
    const options = parts.slice(1, -1);
    let correctIndex = null;
    const last = parts[parts.length - 1];
    const idx = parseInt(last);
    if (!isNaN(idx) && idx >= 0 && idx < options.length) { correctIndex = idx; } else { options.push(last); }
    if (options.length > 25) return '⚠️ Máximo 25 opciones';
    const pollMid = uuid();
    const pollData = { mid: pollMid, question, options, votes: new Map(), correctIndex, creator: STATE.myNick };
    options.forEach((_, i) => pollData.votes.set(i, new Set()));
    polls.set(pollMid, pollData);
    return `POLL:${pollMid}:${question}:${options.join('|')}:${correctIndex !== null ? correctIndex : -1}:${STATE.myNick}`;
  }
  return text;
}
function appendMsg(p, mine){
  if (STATE.emptyState){ STATE.emptyState.remove(); STATE.emptyState = null; }
  const mid = p.mid || uuid(); p.mid = mid;
  const grouped = prevMsg && prevMsg.id === p.id && (Date.now() - prevMsg.ts) < CONFIG.GROUP_MS;
  const row = el('div', 'msg ' + (mine ? 'msg--mine' : 'msg--other'));
  if (grouped) row.classList.add('msg--grouped');
  const body = el('div', 'msg-body');
  if (!mine){
    row.appendChild(el('div', 'avatar', emojiOf(p.nick)));
    if (!grouped){
      const meta = el('div', 'meta');
      const who = el('b', 'who', p.nick); who.style.color = nickColor(p.nick);
      meta.appendChild(who); meta.appendChild(el('time', '', fmtTime(new Date())));
      body.appendChild(meta);
    }
  }
  const bubble = el('div', 'bubble'); bubble.dataset.mid = mid;

  // 1) REFERENCIA DE RESPUESTA (clicable)
  if (p.replyTo){
    const ref = el('div', 'msg-reply-ref');
    ref.appendChild(el('span', 'reply-ref-nick', '↩ ' + p.replyTo.nick));
    ref.appendChild(el('span', 'reply-ref-text', p.replyTo.text));
    ref.addEventListener('click', () => {
      const target = document.querySelector(`.bubble[data-mid="${CSS.escape(p.replyTo.mid)}"]`);
      if (target){
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        target.classList.add('highlight');
        setTimeout(() => target.classList.remove('highlight'), 2000);
      } else { toast('El mensaje original ya no está en pantalla 😕'); }
    });
    bubble.appendChild(ref);
  }

  // 2) Contenido
  if (p.img){
    const im = document.createElement('img'); im.src = p.img; im.className = 'bubble-img'; im.loading = 'lazy';
    im.addEventListener('click', () => openLightbox(p.img)); bubble.classList.add('bubble--img'); bubble.appendChild(im);
  } else if (p.audio){
    const au = document.createElement('audio'); au.controls = true; au.preload = 'none'; au.src = p.audio;
    bubble.classList.add('bubble--audio'); bubble.appendChild(au);
  } else if (typeof p.text === 'string' && p.text.startsWith('POLL:')){
    renderPoll(bubble, p.text, mid, p.nick);
    } else {
    let finalText = p.text;
    if (!p.isCommandResult) finalText = parseCommands(finalText);
    const txt = el('div', 'bubble-text');
    txt.innerHTML = linkify(finalText);
    bubble.appendChild(txt);   // ← ahora el texto va en un hijo, no pisa la referencia
  }

  if (mine) bubble.appendChild(el('div', 'msg-time', fmtTime(new Date())));

  // 3) Barra hover: reacciones + BOTÓN RESPONDER visible
  const rBar = el('div', 'reaction-bar');
  CONFIG.REACT_EMOJIS.forEach(emoji => {
    const btn = el('button', 'react-btn', emoji);
    btn.addEventListener('click', (e) => { e.stopPropagation(); toggleReaction(mid, emoji); });
    rBar.appendChild(btn);
  });
  const replyBtn = el('button', 'react-btn', '↩');
  replyBtn.title = 'Responder';
  replyBtn.addEventListener('click', (e) => { e.stopPropagation(); startReply(p); });
  rBar.appendChild(replyBtn);
  bubble.appendChild(rBar);

  const rContainer = el('div', 'bubble-reactions'); renderReactionsForMsg(mid, rContainer); bubble.appendChild(rContainer);

  // 4) Clic derecho también responde
  bubble.addEventListener('contextmenu', (e) => { e.preventDefault(); startReply(p); });

  body.appendChild(bubble); row.appendChild(body); $('#messages').appendChild(row);
  prevMsg = { id: p.id, ts: Date.now() };

  if (mine || nearBottom()) scrollBottom(true);
  else { STATE.pendingScroll++; const jb = $('#jumpBtn'); jb.hidden = false; jb.textContent = STATE.pendingScroll === 1 ? t('newMsg') : t('newMsgs', {n: STATE.pendingScroll}); }
}
function renderPoll(bubble, pollString, msgMid, creatorNick){
  const parts = pollString.split(':');
  const pollMid = parts[1]; 
  const question = parts[2]; 
  const options = parts[3].split('|');
  const correctIndex = parseInt(parts[4]) === -1 ? null : parseInt(parts[4]);
  
  let pollData = polls.get(pollMid);
  if (!pollData){
    pollData = { mid: pollMid, question, options, votes: new Map(), correctIndex, creator: creatorNick };
    options.forEach((_, idx) => pollData.votes.set(idx, new Set()));
    polls.set(pollMid, pollData);
  }
  
  const cont = el('div', 'poll-container');
  cont.appendChild(el('div', 'poll-title', `📊 ${question}`));
  
  options.forEach((option, idx) => {
    const btn = el('button', 'poll-option', option);
    btn.addEventListener('click', () => castVote(pollMid, idx));
    cont.appendChild(btn);
  });
  
  // Creamos el contenedor de resultados con un ID único basado en pollMid
  const resultsDiv = el('div', 'poll-results');
  resultsDiv.id = `poll-results-${pollMid}`;
  cont.appendChild(resultsDiv);
  
  bubble.appendChild(cont);
  
  // Actualizamos pasando el msgMid (el de la burbuja) y el pollMid
  updatePollDisplay(msgMid, pollMid);
}

function castVote(pollMid, optionIdx){
  const poll = polls.get(pollMid); 
  if (!poll) return;
  
  // Borramos votos anteriores de este usuario
  for (const [, voters] of poll.votes) voters.delete(STATE.myId);
  poll.votes.get(optionIdx).add(STATE.myId);
  
  // Enviamos el voto
  if (STATE.client && STATE.inRoom){ 
    try { 
      STATE.client.publish(STATE.topic, JSON.stringify({ t: 'v', pollMid, optionIdx, id: STATE.myId })); 
    } catch(e){} 
  }
  
  // Buscamos la burbuja que contiene esta encuesta para actualizarla
  // Necesitamos encontrar qué msgMid corresponde a este pollMid
  // Como no tenemos un mapa inverso, buscamos todas las burbujas con encuestas
  document.querySelectorAll('.bubble').forEach(b => {
    const container = b.querySelector('.poll-container');
    if (container) {
      // Verificamos si esta burbuja contiene esta encuesta específica
      const results = b.querySelector(`#poll-results-${CSS.escape(pollMid)}`);
      if (results) {
        updatePollDisplay(b.dataset.mid, pollMid);
      }
    }
  });
}

function handleVote(p){
  const poll = polls.get(p.pollMid); 
  if (!poll) return;
  
  for (const [, voters] of poll.votes) voters.delete(p.id);
  if (poll.votes.has(p.optionIdx)) poll.votes.get(p.optionIdx).add(p.id);
  
  // Actualizamos la UI
  document.querySelectorAll('.bubble').forEach(b => {
    const results = b.querySelector(`#poll-results-${CSS.escape(p.pollMid)}`);
    if (results) {
      updatePollDisplay(b.dataset.mid, p.pollMid);
    }
  });
}

function updatePollDisplay(msgMid, pollMid){
  const poll = polls.get(pollMid); 
  if (!poll) return;
  
  // Buscamos la burbuja por el ID del mensaje
  const bubble = document.querySelector(`.bubble[data-mid="${CSS.escape(msgMid)}"]`);
  if (!bubble) return;
  
  // Buscamos el contenedor de resultados específico
  const res = bubble.querySelector(`#poll-results-${CSS.escape(pollMid)}`);
  if (!res) return;
  
  res.innerHTML = '';
  const total = [...poll.votes.values()].reduce((s, v) => s + v.size, 0);
  
  poll.options.forEach((option, idx) => {
    const count = poll.votes.get(idx) ? poll.votes.get(idx).size : 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    
    const row = el('div', 'poll-result-row');
    const bar = el('div', 'poll-result-bar'); 
    bar.style.width = `${pct}%`;
    
    if (poll.correctIndex !== null && idx === poll.correctIndex) bar.classList.add('correct');
    
    row.appendChild(bar);
    row.appendChild(el('span', 'poll-result-text', `${option} — ${count} (${pct}%)`));
    res.appendChild(row);
  });
  
  const hasVoted = [...poll.votes.values()].some(v => v.has(STATE.myId));
  bubble.querySelectorAll('.poll-option').forEach(b => { b.disabled = hasVoted; });
}
function addSystem(text){ const box = $('#messages'); box.appendChild(el('div', 'sys', text)); if (nearBottom()) scrollBottom(true); }
function nearBottom(){ const m = $('#messages'); return m.scrollHeight - m.scrollTop - m.clientHeight < 160; }
function scrollBottom(smooth){ const m = $('#messages'); m.scrollTo({ top: m.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }); }
function resetJump(){ STATE.pendingScroll = 0; $('#jumpBtn').hidden = true; }
function bumpUnread(){ if (document.hidden){ STATE.unread++; document.title = `(${STATE.unread}) 💬 MiniChat`; } }
function openLightbox(src){ const lb = el('div', 'lightbox'); const im = document.createElement('img'); im.src = src; lb.appendChild(im); lb.addEventListener('click', () => lb.remove()); document.body.appendChild(lb); }
function toggleReaction(mid, emoji){
  if (!STATE.reactions.has(mid)) STATE.reactions.set(mid, new Map());
  const map = STATE.reactions.get(mid); if (!map.has(emoji)) map.set(emoji, new Set());
  const set = map.get(emoji); const isAdding = !set.has(STATE.myId);
  if (isAdding) set.add(STATE.myId); else set.delete(STATE.myId);
  if (set.size === 0){ map.delete(emoji); if (map.size === 0) STATE.reactions.delete(mid); }
  if (STATE.client && STATE.inRoom){ try { STATE.client.publish(STATE.topic, JSON.stringify({ t: 'r', mid, emoji, id: STATE.myId, add: isAdding })); } catch(e){} }
  updateReactionUI(mid);
}
function handleReaction(p){
  const { mid, emoji, id, add } = p;
  if (!STATE.reactions.has(mid)) STATE.reactions.set(mid, new Map());
  const map = STATE.reactions.get(mid); if (!map.has(emoji)) map.set(emoji, new Set());
  const set = map.get(emoji); if (add) set.add(id); else set.delete(id);
  if (set.size === 0){ map.delete(emoji); if (map.size === 0) STATE.reactions.delete(mid); }
  updateReactionUI(mid);
}
function updateReactionUI(mid){
  const bubble = document.querySelector(`.bubble[data-mid="${CSS.escape(mid)}"]`);
  if (!bubble) return; const container = bubble.querySelector('.bubble-reactions');
  if (container){ container.innerHTML = ''; renderReactionsForMsg(mid, container); }
}
function renderReactionsForMsg(mid, container){
  if (!STATE.reactions.has(mid)) return;
  STATE.reactions.get(mid).forEach((set, emoji) => {
    if (set.size === 0) return;
    const tag = el('span', 'react-tag', `${emoji} ${set.size}`);
    if (set.has(STATE.myId)) tag.classList.add('mine');
    tag.addEventListener('click', () => toggleReaction(mid, emoji));
    container.appendChild(tag);
  });
}
function clearChat(){ $('#messages').innerHTML = ''; STATE.reactions.clear(); polls.clear(); prevMsg = null; toast('Chat cleared locally 🗑️'); }
function clearHighlights(){ document.querySelectorAll('.highlight-match').forEach(x => x.classList.remove('highlight-match')); }
function searchMessages(query){
  clearHighlights();
  if (!query) return;
  let first = null;
  document.querySelectorAll('.bubble').forEach(b => {
    if (b.innerText.toLowerCase().includes(query.toLowerCase())){
      b.classList.add('highlight-match');
      if (!first) first = b;
    }
  });
  if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
}