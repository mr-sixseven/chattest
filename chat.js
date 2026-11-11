(function(){
'use strict';

const CFG={
  BROKERS:['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'],
  PREFIX:'minichat/v2/',
  MAX_MSG:2000, MAX_IMG:200, MAX_AUDIO:200, MAX_FILE:360, MAX_STICKER:400,
  HIST_MAX:300, MAX_KEEP:400, MAX_CHARS:500000,
  PRESENCE:15000, PRESENCE_TTL:45000, TYPING_TTL:2500, CONNECT_MS:8000, SEEN_MAX:3000,
  RATE_N:80, RATE_MS:5000,
  AVATAR_MAX:60000, CROP_SIZE:240, AVATAR_OUT:128
};

const TR={
  en:{
    online:'Online',offline:'Offline',connecting:'Connecting…',reconnecting:'Reconnecting…',tapConnect:'Tap connect to join',
    joined:'Joined "{room}" as {nick}',left:'You left',
    userJoined:'{nick} joined',userLeft:'{nick} left',
    tooBigImg:'Image too big (max {kb} KB)',tooBigAudio:'Audio too big (max {kb} KB)',
    tooBigFile:'File too big (max {kb} KB)',tooBigSticker:'Sticker too big (max {kb} KB)',
    micDenied:'Mic access denied',noBroker:'Could not reach any broker',recording:'Recording…',
    rolled:'🎲 Rolled {n}',coin:'🪙 {r}',ball:'🎱 {r}',
    help:'Commands: /roll /coin /8ball /nick /clear /help — Mods: ?ban @user 1h|30m|2d|forever · ?unban @user · ?bans',
    nickChanged:'Nickname: {nick}',cleared:'Chat cleared',
    today:'Today',yesterday:'Yesterday',typing:'typing…',
    reply:'Reply',copy:'Copy',delete:'Delete',star:'Star',unstar:'Unstar',select:'Select',
    cancel:'Cancel',edited:'edited',deleted:'This message was deleted',youDeleted:'You deleted this',
    you:'You',anon:'anon',members:'Members',copied:'Copied',selCount:'{n} selected',
    searchResults:'{n} found',starredOn:'Showing starred only',
    send:'Send',edit:'Edit',noConn:'Not connected',
    room:'Room',nickname:'Nickname',connect:'Connect',disconnect:'Disconnect',
    theme:'Theme',language:'Language',font:'Font',
    typeMsg:'Type a message…',searchPh:'Search…',
    connection:'Connection',history:'History',appearance:'Appearance',
    mqttMissing:'Chat library failed to load. Check your connection and reload',
    clearHist:'Clear history',clearAsk:'Delete the saved history of this chat?',
    joinRoom:'Join room',cropTitle:'Crop your picture',zoom:'Zoom',usePicture:'Use picture',
    profile:'Profile',changeAvatar:'📷 Picture',removeAvatar:'Remove',pickPicture:'📷 Picture',
    exportImport:'Export / Import',exportJson:'JSON',exportTxt:'TXT',import:'Import',
    image:'Image',file:'Document',sticker:'Sticker',
    bans:'Bans',
    bannedForever:'🔨 {nick} banned forever',
    bannedUntil:'🔨 {nick} banned until {date}',
    unbanOk:'🔓 {nick} unbanned',
    youAreBanned:'You are banned from this room {when}',
    usageBan:'Usage: ?ban @user 1h|30m|2d|forever — or ?unban @user — or ?bans',
    userNotFound:'User not found: {nick}',
    selfBan:'You cannot ban yourself',
    importOk:'Imported {n} messages',
    importErr:'Import failed: {err}',
    nothingToExport:'Nothing to export',
    avatarUpdated:'Picture updated'
  },
  es:{
    online:'En línea',offline:'Desconectado',connecting:'Conectando…',reconnecting:'Reconectando…',tapConnect:'Conecta para unirte',
    joined:'Te uniste a "{room}" como {nick}',left:'Saliste',
    userJoined:'{nick} se unió',userLeft:'{nick} salió',
    tooBigImg:'Imagen muy grande (máx {kb} KB)',tooBigAudio:'Audio muy grande (máx {kb} KB)',
    tooBigFile:'Archivo muy grande (máx {kb} KB)',tooBigSticker:'Sticker muy grande (máx {kb} KB)',
    micDenied:'Micrófono denegado',noBroker:'Sin brokers disponibles',recording:'Grabando…',
    rolled:'🎲 Sacaste {n}',coin:'🪙 {r}',ball:'🎱 {r}',
    help:'Comandos: /roll /coin /8ball /nick /clear /help — Mods: ?ban @user 1h|30m|2d|forever · ?unban @user · ?bans',
    nickChanged:'Apodo: {nick}',cleared:'Chat limpiado',
    today:'Hoy',yesterday:'Ayer',typing:'escribiendo…',
    reply:'Responder',copy:'Copiar',delete:'Eliminar',star:'Destacar',unstar:'Quitar',select:'Seleccionar',
    cancel:'Cancelar',edited:'editado',deleted:'Mensaje eliminado',youDeleted:'Eliminaste esto',
    you:'Tú',anon:'anon',members:'Miembros',copied:'Copiado',selCount:'{n} seleccionados',
    searchResults:'{n} encontrados',starredOn:'Solo destacados',
    send:'Enviar',edit:'Editar',noConn:'Sin conexión',
    room:'Sala',nickname:'Apodo',connect:'Conectar',disconnect:'Desconectar',
    theme:'Tema',language:'Idioma',font:'Fuente',
    typeMsg:'Escribe un mensaje…',searchPh:'Buscar…',
    connection:'Conexión',history:'Historial',appearance:'Apariencia',
    mqttMissing:'No se pudo cargar la librería del chat. Revisa tu conexión y recarga',
    clearHist:'Borrar historial',clearAsk:'¿Borrar el historial guardado de este chat?',
    joinRoom:'Unirse',cropTitle:'Recorta tu foto',zoom:'Zoom',usePicture:'Usar foto',
    profile:'Perfil',changeAvatar:'📷 Foto',removeAvatar:'Quitar',pickPicture:'📷 Foto',
    exportImport:'Exportar / Importar',exportJson:'JSON',exportTxt:'TXT',import:'Importar',
    image:'Imagen',file:'Documento',sticker:'Sticker',
    bans:'Expulsiones',
    bannedForever:'🔨 {nick} expulsado para siempre',
    bannedUntil:'🔨 {nick} expulsado hasta {date}',
    unbanOk:'🔓 {nick} readmitido',
    youAreBanned:'Estás expulsado de esta sala {when}',
    usageBan:'Uso: ?ban @user 1h|30m|2d|forever — o ?unban @user — o ?bans',
    userNotFound:'Usuario no encontrado: {nick}',
    selfBan:'No puedes expulsarte a ti mismo',
    importOk:'Importados {n} mensajes',
    importErr:'Fallo al importar: {err}',
    nothingToExport:'Nada que exportar',
    avatarUpdated:'Foto actualizada'
  }
};

const EMOJIS='😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 👍 👎 👌 ✌️ 🤞 🤟 🤘 👏 🙌 🙏 💪 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 💕 💞 💓 💗 💖 💘 💝 🔥 ⭐ ✨ 💯 🎉 🎊 🎈 🎁 🎂 🍕 🍔 🍟 🍺 ☕ ⚽ 🏀 🎮 🎵 🚀 🌈'.split(' ');
const QUICK=['👍','❤️','😂','😮','😢','🙏'];
const OKEMOJI=/^[\p{Extended_Pictographic}\u200d\ufe0f]{1,12}$/u;

const S={
  topic:'', room:'lobby', nick:'',
  cid:(()=>{
    let c=localStorage.getItem('mc_cid');
    if(!c){c='mc_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-3);localStorage.setItem('mc_cid',c)}
    return c;
  })(),
  lang:'en', theme:'whatsapp',
  peers:new Map(), msgs:new Map(), order:[], lastDate:'',
  replyTo:null, unread:0, typingTimer:null, presenceTimer:null, sweepTimer:null,
  rec:false, recorder:null, chunks:[], lastTyping:0, editingId:null,
  sel:new Set(), selMode:false, starFilter:false,
  mentionIdx:-1, mentionItems:[], dragging:0,
  rl:new Map(), toRead:[], announced:false,
  connecting:false, scope:'', dirty:new Set(), dt:0,
  clients:[], connToken:0, failTimer:null, seen:new Set(), lastHello:0,
  avatar:localStorage.getItem('mc_avatar')||null,
  bans:new Map()
};

const $=(s)=>document.querySelector(s);
const connected=()=>S.clients.some(x=>x.c&&x.c.connected);

const D={
  sidebar:$('#sidebar'), sidebarToggle:$('#sidebarToggle'),
  selfAvatar:$('#selfAvatar'), selfName:$('#selfName'), selfStatus:$('#selfStatus'),
  members:$('#members'), memberCount:$('#memberCount'),
  bansSection:$('#bansSection'), bans:$('#bans'), banCount:$('#banCount'),
  room:$('#room'), nickname:$('#nickname'),
  connectBtn:$('#connectBtn'), disconnectBtn:$('#disconnectBtn'),
  themeSelect:$('#themeSelect'), langSelect:$('#langSelect'),
  fontSize:$('#fontSize'), fontLabel:$('#fontLabel'),
  roomAvatar:$('#roomAvatar'), roomName:$('#roomName'), roomStatus:$('#roomStatus'),
  starBtn:$('#starBtn'), searchBtn:$('#searchBtn'), searchbar:$('#searchbar'),
  searchInput:$('#searchInput'), searchCount:$('#searchCount'), searchClose:$('#searchClose'),
  selbar:$('#selbar'), selClose:$('#selClose'), selCount:$('#selCount'),
  selStar:$('#selStar'), selCopy:$('#selCopy'), selDelete:$('#selDelete'),
  messages:$('#messages'), scrollDown:$('#scrollDown'), unread:$('#unread'),
  dropOverlay:$('#dropOverlay'),
  composerForm:$('#composerForm'), text:$('#text'), sendBtn:$('#sendBtn'),
  emojiBtn:$('#emojiBtn'), attachBtn:$('#attachBtn'), attachMenu:$('#attachMenu'),
  audioBtn:$('#audioBtn'), mentions:$('#mentions'),
  replyPreview:$('#replyPreview'), replyClose:$('#replyClose'),
  imageInput:$('#imageInput'), stickerInput:$('#stickerInput'), fileInput:$('#fileInput'),
  ctx:$('#ctx'), emojiPicker:$('#emojiPicker'),
  lightbox:$('#lightbox'), lightboxImg:$('#lightboxImg'), toasts:$('#toasts'),
  clearHist:$('#clearHist'), connDot:$('#connDot'),
  changeAvatar:$('#changeAvatar'), removeAvatar:$('#removeAvatar'),
  avatarChangeInput:$('#avatarChangeInput'),
  exportJson:$('#exportJson'), exportTxt:$('#exportTxt'),
  importBtn:$('#importBtn'), importInput:$('#importInput'),
  joinScreen:$('#joinScreen'), joinRoom:$('#joinRoom'), joinNick:$('#joinNick'), joinBtn:$('#joinBtn'),
  joinAvatar:$('#joinAvatar'), joinAvatarPick:$('#joinAvatarPick'), joinAvatarClear:$('#joinAvatarClear'),
  joinAvatarInput:$('#joinAvatarInput'),
  cropView:$('#cropView'), cropStage:$('#cropStage'), cropCanvas:$('#cropCanvas'),
  cropZoom:$('#cropZoom'), cropCancel:$('#cropCancel'), cropOk:$('#cropOk')
};

// ===== helpers =====
function t(k,v){let s=(TR[S.lang]&&TR[S.lang][k])||k;if(v)for(const [a,b] of Object.entries(v))s=s.split(`{${a}}`).join(b);return s}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function inits(n){if(!n)return'?';const p=String(n).trim().split(/\s+/);return((p[0][0]||'?')+(p[1]?p[1][0]:'')).toUpperCase().slice(0,2)}
function colorFor(id){let h=0;for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))|0;return`hsl(${Math.abs(h)%360},55%,48%)`}
function fmtTime(ts){return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function fmtDate(ts){
  const d=new Date(ts),td=new Date(),yd=new Date(td);
  td.setHours(0,0,0,0);yd.setDate(yd.getDate()-1);yd.setHours(0,0,0,0);
  const dd=new Date(d);dd.setHours(0,0,0,0);
  if(dd.getTime()===td.getTime())return t('today');
  if(dd.getTime()===yd.getTime())return t('yesterday');
  return d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
}
function toast(m,k='info',to=4000){
  const e=document.createElement('div');e.className='toast '+k;e.textContent=m;
  D.toasts.appendChild(e);
  setTimeout(()=>{e.style.opacity='0';setTimeout(()=>e.remove(),300)},to);
}
function status(s,c=''){D.roomStatus.textContent=s;D.roomStatus.className='sub'+(c?' '+c:'')}
function cssEsc(s){return String(s).replace(/["\\]/g,'\\$&')}
function validAvatar(s){
  return typeof s==='string'&&/^data:image\/(png|jpe?g|webp);base64,/i.test(s)&&s.length<CFG.AVATAR_MAX;
}
function avatarEl(nick,cid,dataUrl,sm){
  const e=document.createElement('div');
  e.className='avatar'+(sm?' sm':'');
  if(dataUrl&&validAvatar(dataUrl)){
    e.style.background='transparent';
    const img=document.createElement('img');
    img.src=dataUrl;img.alt='';img.draggable=false;
    e.appendChild(img);
  }else{
    e.textContent=inits(nick);
    e.style.background=colorFor(cid||'');
  }
  return e;
}

// ===== composer state =====
function syncComposer(){
  const on=connected();
  D.text.disabled=!on;D.sendBtn.disabled=!on;
  D.attachBtn.disabled=D.audioBtn.disabled=D.emojiBtn.disabled=!on;
  D.text.placeholder=t('typeMsg');
}
function canAct(){if(!connected()){toast(t('noConn'),'error',1800);return false}return true}

// ===== rich text =====
function renderRich(raw){
  if(!raw)return'';
  const parts=[];const re=/```([\s\S]*?)```/g;let last=0,m;
  while((m=re.exec(raw))){parts.push({t:'x',v:raw.slice(last,m.index)});parts.push({t:'c',v:m[1]});last=m.index+m[0].length}
  parts.push({t:'x',v:raw.slice(last)});
  return parts.map(p=>p.t==='c'?`<pre><code>${esc(p.v.replace(/^\n/,''))}</code></pre>`:inline(p.v)).join('');
}
function inline(s){
  s=esc(s).replace(/\u0000/g,'');
  const links=[];
  s=s.replace(/(https?:\/\/[^\s<]+)/g,u=>{links.push(u);return'\u0000'+(links.length-1)+'\u0000'});
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s=s.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g,'$1<strong>$2</strong>');
  s=s.replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g,'$1<em>$2</em>');
  s=s.replace(/(^|\W)~([^~\n]+)~(?=\W|$)/g,'$1<del>$2</del>');
  s=s.replace(/\u0000(\d+)\u0000/g,(_,i)=>`<a href="${links[i]}" target="_blank" rel="noopener noreferrer">${links[i]}</a>`);
  s=s.replace(/(^|\s)@([\w-]{1,32})/g,'$1<span class="mention">@$2</span>');
  return s;
}

// ===== sound =====
function sound(){
  try{
    const c=sound.c||(sound.c=new (window.AudioContext||window.webkitAudioContext)());
    const o=c.createOscillator(),g=c.createGain();
    o.connect(g);g.connect(c.destination);
    o.type='sine';o.frequency.value=880;
    g.gain.setValueAtTime(0.0001,c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.06,c.currentTime+.01);
    g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+.25);
    o.start();o.stop(c.currentTime+.26);
  }catch(e){}
}

// ===== System notifications =====
function requestNotif(){
  if(!('Notification' in window))return;
  if(Notification.permission==='default'){
    try{Notification.requestPermission().catch(()=>{})}catch(e){}
  }
}
function showNotification(m){
  if(!('Notification' in window))return;
  if(Notification.permission!=='granted')return;
  if(!document.hidden&&document.hasFocus())return;
  const now=Date.now();
  if(showNotification._t&&now-showNotification._t<1200)return;
  showNotification._t=now;

  let body='';
  if(m.type==='msg')body=m.text||'';
  else if(m.type==='img')body=m.sticker?'🌟 Sticker':'📷 Image';
  else if(m.type==='audio')body='🎤 Voice';
  else if(m.type==='file')body='📄 '+(m.fileName||'File');
  body=String(body).slice(0,180);

  try{
    const n=new Notification(m.nickname||'MiniChat',{body,tag:'mc-'+(m.msgId||now)});
    n.onclick=()=>{window.focus();try{jump(m.msgId)}catch(e){};n.close()};
    setTimeout(()=>{try{n.close()}catch(e){}},7000);
  }catch(e){}
}

// ===== Bans =====
function banKey(){return 'mc_bans_'+S.room}
function loadBans(){
  try{
    const raw=localStorage.getItem(banKey());
    S.bans.clear();
    if(!raw)return;
    const obj=JSON.parse(raw);
    const now=Date.now();
    let changed=false;
    for(const[id,b]of Object.entries(obj||{})){
      if(!b||typeof id!=='string')continue;
      const until=b.until===null?Infinity:Number(b.until);
      if(until!==Infinity&&(!isFinite(until)||until<=now)){changed=true;continue}
      S.bans.set(id,{until,nick:String(b.nick||'anon').slice(0,32),by:String(b.by||'').slice(0,32)});
    }
    if(changed)saveBans();
  }catch(e){S.bans.clear()}
}
function saveBans(){
  try{
    const obj={};
    S.bans.forEach((b,id)=>{obj[id]=b});
    localStorage.setItem(banKey(),JSON.stringify(obj));
  }catch(e){}
}
function isBanned(cid){
  const b=S.bans.get(cid);
  if(!b)return false;
  if(b.until!==Infinity&&b.until<Date.now()){
    S.bans.delete(cid);saveBans();renderBans();
    return false;
  }
  return true;
}
function parseBanDur(s){
  s=String(s||'').toLowerCase().trim();
  if(!s||s==='forever'||s==='perm'||s==='0')return Infinity;
  const m=s.match(/^(\d+)\s*([smhd])$/);
  if(!m)return null;
  const n=parseInt(m[1],10);
  const mult={s:1000,m:60000,h:3600000,d:86400000}[m[2]];
  return Date.now()+n*mult;
}
function fmtBanUntil(u){return u===Infinity?'forever':new Date(u).toLocaleString()}

function doBan(targetId,targetNick,until){
  S.bans.set(targetId,{until,nick:targetNick||'anon',by:S.nick});
  saveBans();
  pub({type:'ban',target:targetId,targetNick:targetNick||'',until:until===Infinity?null:until});
  sys(until===Infinity?t('bannedForever',{nick:targetNick}):t('bannedUntil',{nick:targetNick,date:fmtBanUntil(until)}));
  renderMembers();renderBans();
}
function onBan(m){
  if(typeof m.target!=='string'||!/^[\w-]{1,40}$/.test(m.target))return;
  let until=Infinity;
  if(m.until!==null&&m.until!==undefined){
    until=Number(m.until);
    if(!isFinite(until))return;
  }
  S.bans.set(m.target,{until,nick:String(m.targetNick||'anon').slice(0,32),by:String(m.nickname||'').slice(0,32)});
  saveBans();
  if(m.target===S.cid){
    toast(t('youAreBanned',{when:until===Infinity?'forever':'until '+fmtBanUntil(until)}),'error',8000);
    try{disconnect()}catch(e){}
    return;
  }
  sys(until===Infinity?t('bannedForever',{nick:m.targetNick||'anon'}):t('bannedUntil',{nick:m.targetNick||'anon',date:fmtBanUntil(until)}));
  renderMembers();renderBans();
}
function onUnban(m){
  if(typeof m.target!=='string')return;
  S.bans.delete(m.target);saveBans();
  if(m.target===S.cid)toast('You are no longer banned','success',4000);
  else sys(t('unbanOk',{nick:m.targetNick||'anon'}));
  renderMembers();renderBans();
}
function renderBans(){
  if(!D.bansSection)return;
  const now=Date.now();
  D.bans.innerHTML='';
  let n=0;
  S.bans.forEach((b,id)=>{
    if(b.until!==Infinity&&b.until<now)return;
    n++;
    const li=document.createElement('li');
    const span=document.createElement('span');
    span.textContent=`🔨 ${b.nick||id} · ${fmtBanUntil(b.until)}`;
    const btn=document.createElement('button');
    btn.textContent='Unban';
    btn.onclick=()=>{
      S.bans.delete(id);saveBans();
      pub({type:'unban',target:id,targetNick:b.nick||''});
      renderMembers();renderBans();
    };
    li.append(span,btn);
    D.bans.appendChild(li);
  });
  D.bansSection.hidden=n===0;
  D.banCount.textContent=n;
}

// ===== Sidebar sections =====
function initSections(){
  let st={};
  try{st=JSON.parse(localStorage.getItem('mc_sec')||'{}')||{}}catch(e){st={}}
  document.querySelectorAll('#sidebar details.sec').forEach(d=>{
    if(typeof st[d.id]==='boolean')d.open=st[d.id];
    d.addEventListener('toggle',()=>{
      st[d.id]=d.open;
      try{localStorage.setItem('mc_sec',JSON.stringify(st))}catch(e){}
    });
  });
}

// ===== Theme / lang / font =====
function initTheme(){
  S.theme=localStorage.getItem('mc_theme')||'whatsapp';
  document.documentElement.setAttribute('data-theme',S.theme);
  D.themeSelect.value=S.theme;
  D.themeSelect.onchange=()=>{
    S.theme=D.themeSelect.value;
    document.documentElement.setAttribute('data-theme',S.theme);
    localStorage.setItem('mc_theme',S.theme);
  };
}
function initLang(){
  S.lang=localStorage.getItem('mc_lang')||'en';
  D.langSelect.value=S.lang;
  D.langSelect.onchange=()=>{
    S.lang=D.langSelect.value;
    localStorage.setItem('mc_lang',S.lang);
    refreshI18n();
    S.order.forEach(rerender);
    renderMembers();
  };
  refreshI18n();
}
function refreshI18n(){
  document.documentElement.lang=S.lang;
  document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n)});
  document.querySelectorAll('[data-i18n-ph]').forEach(e=>{e.placeholder=t(e.dataset.i18nPh)});
  status(connLabel());
  D.selfName.textContent=S.nick||t('you');
  D.selfStatus.textContent=connected()?t('online'):(S.connecting?t('connecting'):(S.clients.length?t('reconnecting'):t('offline')));
  D.sendBtn.textContent=S.editingId?'✓':t('send');
  syncComposer();
}
function initFont(){
  const v=parseInt(localStorage.getItem('mc_font')||'100',10);
  D.fontSize.value=v;applyFont(v);
  D.fontSize.oninput=()=>{
    const n=parseInt(D.fontSize.value,10);
    applyFont(n);localStorage.setItem('mc_font',n);
  };
}
function applyFont(v){
  document.documentElement.style.setProperty('--font-scale',v/100);
  D.fontLabel.textContent=v+'%';
}

function updateSelf(){
  D.selfAvatar.innerHTML='';
  if(S.avatar&&validAvatar(S.avatar)){
    D.selfAvatar.style.background='transparent';
    const img=document.createElement('img');
    img.src=S.avatar;img.alt='';
    D.selfAvatar.appendChild(img);
  }else{
    D.selfAvatar.style.background=colorFor(S.cid);
    D.selfAvatar.textContent=inits(S.nick||'You');
  }
  D.removeAvatar.hidden=!(S.avatar&&validAvatar(S.avatar));
  refreshI18n();
}

// ===== Commands =====
function handleCmd(text){
  const p=text.trim().split(/\s+/),c=(p[0]||'').toLowerCase();
  if(c==='/help'){sys(t('help'));return true}
  if(c==='/clear'){clearHistory();return true}
  if(c==='/nick'&&p[1]){
    S.nick=p[1].slice(0,32);D.nickname.value=S.nick;
    localStorage.setItem('mc_nick',S.nick);
    updateSelf();sys(t('nickChanged',{nick:S.nick}));
    return true;
  }
  if(c==='/roll'){sys(t('rolled',{n:Math.floor(Math.random()*100)+1}));return true}
  if(c==='/coin'){sys(t('coin',{r:Math.random()<.5?'Heads!':'Tails!'}));return true}
  if(c==='/8ball'){
    const a=['Yes.','No.','Maybe.','Definitely.','Absolutely not.','Ask again later.','Without a doubt.'];
    sys(t('ball',{r:a[Math.floor(Math.random()*a.length)]}));
    return true;
  }
  if(c==='?ban'||c==='?unban'||c==='?bans')return handleBanCmd(p,c);
  return false;
}
function handleBanCmd(p,c){
  if(!connected()){toast(t('noConn'),'error');return true}
  if(c==='?bans'){
    const now=Date.now();const lines=[];
    S.bans.forEach((b,id)=>{
      if(b.until!==Infinity&&b.until<now)return;
      lines.push(`🔨 ${b.nick||id} · ${fmtBanUntil(b.until)}`);
    });
    if(!lines.length)sys('No bans');else lines.forEach(sys);
    return true;
  }
  const raw=p[1]||'';
  const nick=raw.replace(/^@/,'');
  if(!nick){sys(t('usageBan'));return true}
  let targetId=null;
  S.peers.forEach((peer,id)=>{if(peer.nickname===nick)targetId=id});
  if(!targetId)S.bans.forEach((b,id)=>{if(b.nick===nick)targetId=id});
  if(!targetId){sys(t('userNotFound',{nick}));return true}
  if(targetId===S.cid){sys(t('selfBan'));return true}
  if(c==='?ban'){
    const until=parseBanDur(p[2]||'forever');
    if(until===null){sys(t('usageBan'));return true}
    doBan(targetId,nick,until);
  }else{
    S.bans.delete(targetId);saveBans();
    pub({type:'unban',target:targetId,targetNick:nick});
    sys(t('unbanOk',{nick}));
    renderMembers();renderBans();
  }
  return true;
}

// ===== MQTT =====
// We connect to every broker in CFG.BROKERS at the same time and publish on all of
// them. Each message carries a unique id, so duplicates are dropped on receipt.
// That way two people in the same room always meet, even if one of them can only
// reach a single broker.
function connLabel(){
  if(connected())return t('online');
  if(S.connecting)return t('connecting');
  if(S.clients.length)return t('reconnecting');
  return t('tapConnect');
}
function syncConn(){
  const busy=S.connecting||S.clients.length>0;
  D.connectBtn.disabled=busy;
  D.disconnectBtn.disabled=!busy;
  D.room.disabled=busy;
  D.connDot.className='conn-dot'+(connected()?' on':(busy?' wait':''));
}
function refreshConn(){
  syncConn();syncComposer();
  if(connected())renderTyping();else status(connLabel());
  D.selfStatus.textContent=connected()?t('online'):(S.connecting?t('connecting'):(S.clients.length?t('reconnecting'):t('offline')));
}
function cleanRoom(v){
  return String(v||'lobby').trim().replace(/[^\p{L}\p{N}_-]+/gu,'-').slice(0,32)||'lobby';
}
async function connect(){
  if(S.clients.length||S.connecting)return;
  if(typeof mqtt==='undefined'){toast(t('mqttMissing'),'error',7000);return}
  requestNotif();
  S.room=cleanRoom(D.room.value);
  D.room.value=S.room;
  S.nick=(D.nickname.value.trim()||'anon-'+Math.random().toString(36).slice(2,6)).slice(0,32);
  D.nickname.value=S.nick;
  S.topic=CFG.PREFIX+S.room;

  loadBans();
  if(isBanned(S.cid)){
    const b=S.bans.get(S.cid);
    toast(t('youAreBanned',{when:b.until===Infinity?'forever':'until '+fmtBanUntil(b.until)}),'error',8000);
    status(t('noConn'));
    return;
  }

  const token=++S.connToken;
  S.connecting=true;
  localStorage.setItem('mc_room',S.room);localStorage.setItem('mc_nick',S.nick);
  D.roomName.textContent=S.room;
  D.roomAvatar.textContent='#'+S.room.slice(0,1).toUpperCase();
  D.roomAvatar.style.background=colorFor(S.room);
  updateSelf();refreshConn();

  // Load the saved history BEFORE going online, otherwise it would wipe the
  // "joined" line and anything that arrives while it loads.
  try{await switchScope('room:'+S.room)}catch(e){}
  if(token!==S.connToken)return;
  renderBans();

  const clients=[];
  S.clients=clients;
  refreshConn();
  clearTimeout(S.failTimer);
  S.failTimer=setTimeout(()=>{
    if(token!==S.connToken||connected()||S.announced)return;
    stopClients(false);
    S.connecting=false;S.announced=false;
    refreshConn();status(t('noBroker'));
    toast(t('noBroker'),'error',6000);
  },CFG.CONNECT_MS+2500);

  CFG.BROKERS.forEach(url=>{
    let c;
    try{
      c=mqtt.connect(url,{
        clientId:'mq_'+Math.random().toString(36).slice(2,12)+Date.now().toString(36),
        clean:true,reconnectPeriod:4000,connectTimeout:CFG.CONNECT_MS,keepalive:30
      });
    }catch(e){return}
    clients.push({url,c});
    c.on('connect',()=>{
      if(token!==S.connToken)return;
      c.subscribe(S.topic,{qos:0},err=>{
        if(err||token!==S.connToken)return;
        onBrokerUp();
      });
    });
    c.on('message',(tp,p)=>{if(token===S.connToken&&tp===S.topic)incoming(p)});
    c.on('error',()=>{});
    c.on('close',()=>{if(token===S.connToken)refreshConn()});
    c.on('reconnect',()=>{if(token===S.connToken&&!connected())status(t('reconnecting'))});
  });
  if(!clients.length){
    S.connecting=false;refreshConn();
    toast(t('noBroker'),'error',6000);
  }
}
function onBrokerUp(){
  clearTimeout(S.failTimer);
  S.connecting=false;
  refreshConn();
  if(!S.announced){
    S.announced=true;
    sys(t('joined',{room:S.room,nick:S.nick}));
    pub({type:'join',avatar:S.avatar||undefined});
    clearInterval(S.presenceTimer);clearInterval(S.sweepTimer);
    S.presenceTimer=setInterval(()=>pub({type:'presence'}),CFG.PRESENCE);
    S.sweepTimer=setInterval(sweep,3000);
  }
  // Several brokers can come up within a moment of each other: say hello once.
  const now=Date.now();
  if(now-S.lastHello>3000){
    S.lastHello=now;
    pub({type:'presence'});pub({type:'hello'});
  }
  renderMembers();renderBans();
}
function stopClients(graceful){
  S.connToken++;               // every handler of the old clients becomes a no-op
  clearTimeout(S.failTimer);
  clearInterval(S.presenceTimer);clearInterval(S.sweepTimer);
  const cs=S.clients;S.clients=[];
  cs.forEach(({c})=>{try{c.end(!(graceful&&c.connected))}catch(e){}});
}
function disconnect(){
  if(!S.clients.length&&!S.connecting)return;
  const wasIn=S.announced&&connected();
  if(wasIn){pub({type:'leave'});pub({type:'presence',offline:true})}
  stopClients(true);
  S.connecting=false;S.announced=false;S.peers.clear();
  renderMembers();
  refreshConn();
  if(wasIn)sys(t('left'));
}
function pub(o){
  if(!connected())return false;
  o.clientId=S.cid;o.nickname=S.nick;o.ts=o.ts||Date.now();o.msgId=o.msgId||uid();
  const p=JSON.stringify(o);
  if(p.length>CFG.MAX_CHARS){toast('Payload too big','error');return false}
  let sent=false;
  S.clients.forEach(({c})=>{
    if(!c.connected)return;
    try{c.publish(S.topic,p,{qos:0});sent=true}catch(e){}
  });
  return sent;
}
function incoming(payload){
  let m;try{m=JSON.parse(payload.toString())}catch(e){return}
  if(!m||typeof m!=='object'||typeof m.type!=='string'||typeof m.clientId!=='string')return;
  if(!/^[\w-]{1,40}$/.test(m.clientId)||m.clientId===S.cid)return;
  if(m.msgId!==undefined&&!/^[\w-]{1,40}$/.test(String(m.msgId)))return;
  if(m.msgId!==undefined){            // same packet arriving through another broker
    const k=m.clientId+':'+m.msgId;
    if(S.seen.has(k))return;
    S.seen.add(k);
    if(S.seen.size>CFG.SEEN_MAX)S.seen.delete(S.seen.values().next().value);
  }
  if(rateLimited(m.clientId))return;
  if(isBanned(m.clientId))return;
  m.nickname=String(m.nickname||'anon').slice(0,32);
  m.ts=Date.now();

  {
    const prev=S.peers.get(m.clientId);
    const isChatType=['msg','img','audio','file'].includes(m.type);
    const prevAv=prev?prev.avatar:null;
    let av=prevAv;
    if(m.type==='avatar'&&m.avatar===null)av=null;
    else if(validAvatar(m.avatar))av=m.avatar;
    S.peers.set(m.clientId,{
      nickname:m.nickname,
      lastSeen:m.ts,
      typing:m.type==='typing'?!!m.on:(isChatType?false:(prev?prev.typing:false)),
      typingAt:m.type==='typing'&&m.on?m.ts:(prev?prev.typingAt:0),
      avatar:av
    });
    if(av!==prevAv)rerenderPeer(m.clientId);
    else if(!prev||prev.nickname!==m.nickname)renderMembers();
  }

  switch(m.type){
    case 'join':      sys(t('userJoined',{nick:m.nickname||'anon'}));break;
    case 'leave':     sys(t('userLeft',{nick:m.nickname||'anon'}));S.peers.delete(m.clientId);renderMembers();break;
    case 'presence':  if(m.offline){S.peers.delete(m.clientId);renderMembers()}break;
    case 'typing':    renderTyping();break;
    case 'msg': case 'img': case 'audio': case 'file': onChat(m);renderTyping();break;
    case 'hello':     setTimeout(()=>{pub({type:'presence'});if(S.avatar)pub({type:'avatar',avatar:S.avatar})},100+Math.random()*1400);break;
    case 'avatar':    break;
    case 'ban':       onBan(m);break;
    case 'unban':     onUnban(m);break;
    case 'ack':       onAck(m);break;
    case 'react':     onReact(m);break;
    case 'delete':    onDel(m);break;
    case 'edit':      onEdit(m);break;
  }
}

const OKDATA={
  img:/^data:image\/(png|jpe?g|gif|webp);base64,/,
  audio:/^data:audio\/[\w.+-]+(;[\w=.+-]+)*;base64,/,
  file:/^data:[^,]{0,100};base64,/
};
function clean(m){
  if(!['msg','img','audio','file'].includes(m.type))return null;
  if(typeof m.msgId!=='string'||!m.msgId||m.msgId.length>40)return null;
  const o={type:m.type,msgId:m.msgId,clientId:m.clientId,nickname:m.nickname,ts:m.ts||Date.now()};
  if(m.replyTo&&typeof m.replyTo==='object'){
    o.replyTo={
      msgId:String(m.replyTo.msgId||'').slice(0,40),
      nickname:String(m.replyTo.nickname||'').slice(0,32),
      text:String(m.replyTo.text||'').slice(0,200)
    };
  }
  if(m.type==='msg'){o.text=String(m.text||'').slice(0,CFG.MAX_MSG);return o}
  if(typeof m.data!=='string'||m.data.length>CFG.MAX_CHARS||!OKDATA[m.type].test(m.data))return null;
  o.data=m.data;
  if(m.type==='img'&&m.sticker===true)o.sticker=true;
  if(m.type==='file')o.fileName=String(m.fileName||'file').slice(0,100);
  return o;
}
function rateLimited(id){
  const n=Date.now();let r=S.rl.get(id);
  if(!r||n-r.t>CFG.RATE_MS)r={t:n,c:0};
  r.c++;S.rl.set(id,r);
  return r.c>CFG.RATE_N;
}
function onChat(m){
  m=clean(m);if(!m||S.msgs.has(m.msgId))return;
  pub({type:'ack',msgId:m.msgId,status:'delivered',to:m.clientId});
  const away=document.hidden||!nearBottom();
  if(away){sound();showNotification(m)}
  append(m,false);
  if(away){S.toRead.push([m.msgId,m.clientId]);if(S.toRead.length>100)S.toRead.shift()}
  else setTimeout(()=>pub({type:'ack',msgId:m.msgId,status:'read',to:m.clientId}),800);
}
function flushReads(){
  const a=S.toRead;S.toRead=[];
  a.forEach(([id,cid])=>pub({type:'ack',msgId:id,status:'read',to:cid}));
}
function onAck(m){
  const x=S.msgs.get(m.msgId);if(!x||x.clientId!==S.cid)return;
  if(m.status==='read')x._s='read';
  else if(m.status==='delivered'&&x._s!=='read')x._s='delivered';
  ticks(m.msgId);
}
function onReact(m){
  const x=S.msgs.get(m.msgId);
  if(!x||!OKEMOJI.test(String(m.emoji)))return;
  x.reactions=x.reactions||{};
  if(m.remove){
    if(x.reactions[m.emoji]){
      x.reactions[m.emoji]=x.reactions[m.emoji].filter(i=>i!==m.clientId);
      if(!x.reactions[m.emoji].length)delete x.reactions[m.emoji];
    }
  }else{
    if(!x.reactions[m.emoji])x.reactions[m.emoji]=[];
    if(!x.reactions[m.emoji].includes(m.clientId))x.reactions[m.emoji].push(m.clientId);
  }
  markDirty(m.msgId);reacts(m.msgId);
}
function onDel(m){
  const x=S.msgs.get(m.msgId);
  if(!x||x.clientId!==m.clientId)return;
  x.deleted=true;x.text='';x.data=null;
  markDirty(m.msgId);rerender(m.msgId,true);
}
function onEdit(m){
  const x=S.msgs.get(m.msgId);
  if(!x||x.type!=='msg'||x.clientId!==m.clientId)return;
  x.text=String(m.text||'').slice(0,CFG.MAX_MSG);
  x.edited=true;
  markDirty(m.msgId);rerender(m.msgId);
}
function sweep(){
  const now=Date.now();
  let ch=false;
  S.rl.forEach((r,k)=>{if(now-r.t>CFG.RATE_MS*4)S.rl.delete(k)});
  for(const[id,p]of S.peers){
    if(now-p.lastSeen>CFG.PRESENCE_TTL){S.peers.delete(id);ch=true}
    else if(p.typing&&now-(p.typingAt||0)>CFG.TYPING_TTL+2000)p.typing=false;
  }
  if(ch)renderMembers();
  renderTyping();
}

// ===== Rendering =====
function nearBottom(){return D.messages.scrollHeight-D.messages.scrollTop-D.messages.clientHeight<120}
function toBottom(sm=true){
  D.messages.scrollTo({top:D.messages.scrollHeight,behavior:sm?'smooth':'auto'});
  S.unread=0;updateUnread();D.scrollDown.hidden=true;
}
function updateUnread(){
  document.title=(S.unread>0?'('+S.unread+') ':'')+'MiniChat';
  D.unread.textContent=S.unread>0?(S.unread>99?'99+':S.unread):'';
  D.scrollDown.hidden=S.unread===0&&nearBottom();
}
function preview(m){
  if(m.type==='img')return m.sticker?'🌟 Sticker':'📷 Image';
  if(m.type==='audio')return '🎤 Voice';
  if(m.type==='file')return '📄 '+(m.fileName||'File');
  return m.text||'';
}
function dateDiv(ts){
  const k=fmtDate(ts);
  if(k!==S.lastDate){
    S.lastDate=k;
    const d=document.createElement('div');
    d.className='date';d.textContent=k;
    D.messages.appendChild(d);
  }
}
function sys(text){
  const nb=nearBottom();
  const d=document.createElement('div');
  d.className='date';d.textContent=text;
  D.messages.appendChild(d);
  if(nb)toBottom();
}
function append(m,own){
  const tb=document.getElementById('typingBubble');if(tb)tb.remove();
  const stick=own||(nearBottom()&&!document.hidden);
  S.msgs.set(m.msgId,{...m,_s:own?'sent':'read',_stick:stick});
  markDirty(m.msgId);
  S.order.push(m.msgId);
  dateDiv(m.ts);
  const prev=S.order[S.order.length-2];
  const pv=prev?S.msgs.get(prev):null;
  const grouped=pv&&pv.clientId===m.clientId&&(m.ts-pv.ts)<120000&&!m.replyTo;
  D.messages.appendChild(build(m.msgId,grouped));
  if(stick)toBottom();else{S.unread++;updateUnread()}
  setTimeout(()=>{const x=S.msgs.get(m.msgId);if(x)x._stick=false},3000);
  while(S.order.length>CFG.MAX_KEEP){
    const o=S.order.shift();S.msgs.delete(o);
    const e=D.messages.querySelector(`[data-id="${cssEsc(o)}"]`);
    if(e)e.remove();
  }
}
function rerender(id,force){
  const o=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);
  if(!o)return;
  const g=o.classList.contains('grouped');
  o.replaceWith(build(id,g));
}
function rerenderPeer(cid){
  S.order.forEach(id=>{
    const m=S.msgs.get(id);
    if(m&&m.clientId===cid)rerender(id);
  });
  renderMembers();
}
function build(id,grouped){
  const m=S.msgs.get(id),own=m.clientId===S.cid;
  const el=document.createElement('div');
  el.className='msg'+(own?' own':'')+(grouped?' grouped':'');
  if(S.sel.has(id))el.classList.add('selected');
  el.dataset.id=id;

  const peerAvatar=own?S.avatar:(S.peers.get(m.clientId)||{}).avatar;
  el.appendChild(avatarEl(m.nickname,m.clientId,peerAvatar));

  const w=document.createElement('div');w.className='wrap';el.appendChild(w);
  if(!own){
    const s=document.createElement('div');
    s.className='sender';s.textContent=m.nickname||t('anon');
    s.style.color=colorFor(m.clientId);
    w.appendChild(s);
  }

  const b=document.createElement('div');
  b.className='bubble';
  if(m.type==='img'&&m.sticker&&!m.deleted)b.classList.add('sticker-bubble');
  w.appendChild(b);

  if(m.starred){
    const st=document.createElement('span');
    st.className='star';st.textContent='⭐';
    b.appendChild(st);
  }

  if(m.deleted){
    const i=document.createElement('i');
    i.style.opacity='.6';
    i.textContent=own?t('youDeleted'):t('deleted');
    b.appendChild(i);
  }else{
    if(m.replyTo){
      const q=document.createElement('div');q.className='quote';
      q.innerHTML=`<div class="q-name">${esc(m.replyTo.nickname||'')}</div><div class="q-text">${esc(m.replyTo.text||'')}</div>`;
      q.onclick=()=>jump(m.replyTo.msgId);
      b.appendChild(q);
    }
    if(m.type==='img'&&m.data){
      const img=document.createElement('img');
      img.src=m.data;
      img.onload=()=>{if(m._stick)toBottom(false)};
      img.onclick=()=>{if(!S.selMode)lightbox(m.data)};
      b.appendChild(img);
    }else if(m.type==='audio'&&m.data){
      const a=document.createElement('audio');
      a.controls=true;a.src=m.data;
      b.appendChild(a);
    }else if(m.type==='file'&&m.data){
      const a=document.createElement('a');
      a.className='file-link';
      a.href=m.data;a.download=m.fileName||'file';
      a.innerHTML=`📄 ${esc(m.fileName||'file')}`;
      a.style.color='inherit';
      b.appendChild(a);
    }else{
      const sp=document.createElement('span');
      sp.innerHTML=renderRich(m.text||'');
      b.appendChild(sp);
    }
  }

  const mt=document.createElement('div');mt.className='meta';
  const tm=document.createElement('span');tm.textContent=fmtTime(m.ts);mt.appendChild(tm);
  if(m.edited){const e=document.createElement('span');e.textContent=' · '+t('edited');mt.appendChild(e)}
  if(own&&!m.deleted){
    const tk=document.createElement('span');
    tk.className='ticks '+(m._s||'sent');
    tk.textContent=m._s==='sent'?'✓':'✓✓';
    mt.appendChild(tk);
  }
  b.appendChild(mt);

  if(m.reactions&&Object.keys(m.reactions).length){
    const r=document.createElement('div');r.className='reactions';
    for(const[e,u]of Object.entries(m.reactions)){
      const p=document.createElement('div');
      p.className='reaction'+(u.includes(S.cid)?' mine':'');
      fillReact(p,e,u);
      p.onclick=(ev)=>{ev.stopPropagation();react(id,e)};
      r.appendChild(p);
    }
    w.appendChild(r);
  }

  b.oncontextmenu=(e)=>{e.preventDefault();if(!m.deleted)ctxMenu(id,e.clientX,e.clientY)};
  let lp;
  b.ontouchstart=(e)=>{
    const q=e.touches[0];
    lp=setTimeout(()=>{if(!m.deleted)ctxMenu(id,q.clientX,q.clientY)},550);
  };
  b.ontouchend=b.ontouchmove=b.ontouchcancel=()=>clearTimeout(lp);
  b.ondblclick=()=>{if(!m.deleted&&!S.selMode)react(id,'❤️')};
  b.onclick=(e)=>{if(S.selMode){e.preventDefault();toggleSel(id)}};

  return el;
}
function ticks(id){
  const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);
  if(!el)return;
  const m=S.msgs.get(id);
  const tk=el.querySelector('.ticks');
  if(!tk)return;
  tk.className='ticks '+(m._s||'sent');
  tk.textContent=m._s==='sent'?'✓':'✓✓';
}
function reacts(id){
  const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);
  if(!el)return;
  const w=el.querySelector('.wrap');
  let r=w.querySelector('.reactions');
  if(r)r.remove();
  const m=S.msgs.get(id);
  if(!m.reactions||!Object.keys(m.reactions).length)return;
  r=document.createElement('div');r.className='reactions';
  for(const[e,u]of Object.entries(m.reactions)){
    const p=document.createElement('div');
    p.className='reaction'+(u.includes(S.cid)?' mine':'');
    fillReact(p,e,u);
    p.onclick=()=>react(id,e);
    r.appendChild(p);
  }
  w.appendChild(r);
}
function fillReact(p,e,u){
  p.textContent=e;
  const n=document.createElement('span');
  n.className='n';n.textContent=u.length;
  p.appendChild(n);
}
function jump(id){
  const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);
  if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  const b=el.querySelector('.bubble');
  if(!b)return;
  b.style.outline='2px solid var(--accent)';
  setTimeout(()=>b.style.outline='',1200);
}
function renderMembers(){
  D.members.innerHTML='';
  const selfLi=document.createElement('li');
  selfLi.appendChild(avatarEl(S.nick||t('you'),S.cid,S.avatar,true));
  const selfSpan=document.createElement('span');
  selfSpan.textContent=(S.nick||t('you'))+' ('+t('you').toLowerCase()+')';
  selfLi.appendChild(selfSpan);
  const selfDot=document.createElement('span');selfDot.className='dot';selfLi.appendChild(selfDot);
  D.members.appendChild(selfLi);

  let count=connected()?1:0;
  S.peers.forEach((p,id)=>{
    if(isBanned(id))return;
    count++;
    const li=document.createElement('li');
    li.appendChild(avatarEl(p.nickname,id,p.avatar,true));
    const span=document.createElement('span');span.textContent=p.nickname||t('anon');li.appendChild(span);
    const dot=document.createElement('span');dot.className='dot';li.appendChild(dot);
    D.members.appendChild(li);
  });
  D.memberCount.textContent=count;
}
function renderTyping(){
  const ty=[];
  S.peers.forEach((p,id)=>{if(p.typing&&!isBanned(id))ty.push([id,p])});
  if(ty.length)status(`${ty.slice(0,2).map(x=>x[1].nickname).join(', ')} ${t('typing')}`,'typing');
  else if(connected())status(t('online'));

  let tb=document.getElementById('typingBubble');
  if(ty.length){
    if(!tb){
      tb=document.createElement('div');
      tb.id='typingBubble';
      tb.className='msg';
      tb.appendChild(avatarEl(ty[0][1].nickname,ty[0][0],ty[0][1].avatar));
      const w=document.createElement('div');w.className='wrap';
      const b=document.createElement('div');
      b.className='bubble typing-bubble';
      b.innerHTML='<span></span><span></span><span></span>';
      w.appendChild(b);
      tb.appendChild(w);
      D.messages.appendChild(tb);
    }else D.messages.appendChild(tb);
    if(nearBottom())toBottom();
  }else if(tb)tb.remove();
}

// ===== Reactions / reply / selection =====
function react(id,e){
  if(!canAct())return;
  const m=S.msgs.get(id);
  if(!m)return;
  m.reactions=m.reactions||{};
  const u=m.reactions[e]||(m.reactions[e]=[]);
  const has=u.includes(S.cid);
  if(has){
    m.reactions[e]=u.filter(x=>x!==S.cid);
    if(!m.reactions[e].length)delete m.reactions[e];
    pub({type:'react',msgId:id,emoji:e,remove:true});
  }else{
    u.push(S.cid);
    pub({type:'react',msgId:id,emoji:e});
  }
  markDirty(id);reacts(id);
}
function setReply(id){
  const m=S.msgs.get(id);
  if(!m||m.deleted)return;
  S.replyTo={msgId:id,nickname:m.nickname||t('anon'),text:preview(m)};
  D.replyPreview.hidden=false;
  D.replyPreview.querySelector('.rp-name').textContent=m.nickname||t('anon');
  D.replyPreview.querySelector('.rp-text').textContent=preview(m);
  D.text.focus();
}
function clearReply(){S.replyTo=null;D.replyPreview.hidden=true}

function toggleSel(id){
  if(S.sel.has(id))S.sel.delete(id);
  else S.sel.add(id);
  if(S.sel.size===0)exitSel();
  else{
    S.selMode=true;D.selbar.hidden=false;
    D.selCount.textContent=t('selCount',{n:S.sel.size});
    const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);
    if(el)el.classList.toggle('selected',S.sel.has(id));
  }
}
function exitSel(){
  S.selMode=false;S.sel.clear();
  D.selbar.hidden=true;
  D.messages.querySelectorAll('.msg.selected').forEach(m=>m.classList.remove('selected'));
}

// ===== Context menu =====
function ctxMenu(id,x,y){
  D.ctx.innerHTML='';
  const m=S.msgs.get(id);
  if(!m)return;
  const own=m.clientId===S.cid;
  const row=document.createElement('div');row.className='emoji-row';
  QUICK.forEach(e=>{
    const b=document.createElement('button');
    b.type='button';b.textContent=e;
    b.onclick=()=>{react(id,e);hideCtx()};
    row.appendChild(b);
  });
  D.ctx.appendChild(row);

  const add=(label,fn)=>{
    const b=document.createElement('button');
    b.type='button';b.textContent=label;
    b.onclick=()=>{fn();hideCtx()};
    D.ctx.appendChild(b);
  };
  add('↩️ '+t('reply'),()=>setReply(id));
  add('☑️ '+t('select'),()=>{S.selMode=true;toggleSel(id)});
  if(m.type==='msg'){
    add('📋 '+t('copy'),()=>{
      navigator.clipboard.writeText(m.text||'').then(()=>toast(t('copied'),'success',1500));
    });
  }
  add(m.starred?'☆ '+t('unstar'):'⭐ '+t('star'),()=>{
    m.starred=!m.starred;
    restar(id);
    if(S.starFilter)applyStar();
  });
  if(own&&m.type==='msg')add('✏️ '+t('edit'),()=>startEdit(id));
  if(own&&!m.deleted)add('🗑️ '+t('delete'),()=>delMine(m,id));
  if(!own&&m.clientId&&!isBanned(m.clientId)){
    add('🔨 Ban forever',()=>{
      if(confirm(`Ban ${m.nickname} forever?`))doBan(m.clientId,m.nickname,Infinity);
    });
  }

  D.ctx.hidden=false;
  const r=D.ctx.getBoundingClientRect();
  D.ctx.style.left=Math.min(x,innerWidth-r.width-8)+'px';
  D.ctx.style.top=Math.min(y,innerHeight-r.height-8)+'px';
}
function hideCtx(){D.ctx.hidden=true}

// ===== Emoji picker =====
function showEmoji(){
  if(!D.emojiPicker.dataset.f){
    EMOJIS.forEach(e=>{
      const b=document.createElement('button');
      b.type='button';b.textContent=e;
      b.onclick=()=>{insertText(e);hideEmoji();D.text.focus()};
      D.emojiPicker.appendChild(b);
    });
    D.emojiPicker.dataset.f='1';
  }
  const r=D.emojiBtn.getBoundingClientRect();
  D.emojiPicker.style.left=r.left+'px';
  D.emojiPicker.style.bottom=(innerHeight-r.top+6)+'px';
  D.emojiPicker.hidden=false;
}
function hideEmoji(){D.emojiPicker.hidden=true}
function insertText(txt){
  const el=D.text,s=el.selectionStart||0,e=el.selectionEnd||0;
  el.value=el.value.slice(0,s)+txt+el.value.slice(e);
  el.selectionStart=el.selectionEnd=s+txt.length;
  autoResize(el);
}
function autoResize(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,140)+'px';
}
function lightbox(src){D.lightboxImg.src=src;D.lightbox.hidden=false}
function closeLightbox(){D.lightbox.hidden=true;D.lightboxImg.src=''}

// ===== Send =====
function sendText(){
  if(S.editingId){commitEdit();return}
  const text=D.text.value.trim();
  if(!text)return;
  if(handleCmd(text)){D.text.value='';autoResize(D.text);return}
  if(text.length>CFG.MAX_MSG)return toast('Message too long','error');
  const msgId=uid();
  const payload={type:'msg',msgId,text,replyTo:S.replyTo?{...S.replyTo}:undefined};
  if(!pub(payload))return;
  append({...payload,clientId:S.cid,nickname:S.nick,ts:Date.now()},true);
  D.text.value='';autoResize(D.text);clearReply();
  pub({type:'typing',on:false});
}
function readURL(f){
  return new Promise((res,rej)=>{
    const r=new FileReader();
    r.onload=()=>res(r.result);
    r.onerror=()=>rej(r.error);
    r.readAsDataURL(f);
  });
}
function shrink(f,q){
  return new Promise(res=>{
    const u=URL.createObjectURL(f),im=new Image();
    im.onload=()=>{
      URL.revokeObjectURL(u);
      const k=Math.min(1,1024/Math.max(im.width,im.height));
      const c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(im.width*k));
      c.height=Math.max(1,Math.round(im.height*k));
      const g=c.getContext('2d');
      g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
      g.drawImage(im,0,0,c.width,c.height);
      res(c.toDataURL('image/jpeg',q));
    };
    im.onerror=()=>{URL.revokeObjectURL(u);res(null)};
    im.src=u;
  });
}
async function packImage(f){
  if(f.type==='image/gif'&&f.size<=CFG.MAX_IMG*1024)return readURL(f);
  for(const q of[.75,.55,.4]){
    const d=await shrink(f,q);
    if(d&&d.length<=CFG.MAX_IMG*1370)return d;
  }
  return null;
}
function packSticker(f){
  return new Promise(res=>{
    const u=URL.createObjectURL(f),im=new Image();
    im.onload=()=>{
      URL.revokeObjectURL(u);
      const k=Math.min(1,512/Math.max(im.width,im.height));
      const c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(im.width*k));
      c.height=Math.max(1,Math.round(im.height*k));
      const g=c.getContext('2d');
      g.drawImage(im,0,0,c.width,c.height);
      let d=c.toDataURL('image/png');
      if(d.length>CFG.MAX_STICKER*1400)d=c.toDataURL('image/jpeg',.85);
      res(d);
    };
    im.onerror=()=>{URL.revokeObjectURL(u);res(null)};
    im.src=u;
  });
}
async function sendImage(f,asSticker){
  if(!f)return;
  if(!connected())return toast(t('noConn'),'error');
  let data=null;
  try{data=asSticker?await packSticker(f):await packImage(f)}catch(e){}
  if(!data)return toast(asSticker?t('tooBigSticker',{kb:CFG.MAX_STICKER}):t('tooBigImg',{kb:CFG.MAX_IMG}),'error');
  const p={type:'img',msgId:uid(),data,replyTo:S.replyTo?{...S.replyTo}:undefined};
  if(asSticker)p.sticker=true;
  if(!pub(p))return;
  append({...p,clientId:S.cid,nickname:S.nick,ts:Date.now()},true);
  clearReply();
}
function sendFile(f){
  if(!f)return;
  if(!connected())return toast(t('noConn'),'error');
  if(f.size>CFG.MAX_FILE*1024)return toast(t('tooBigFile',{kb:CFG.MAX_FILE}),'error');
  readURL(f).then(data=>{
    const p={type:'file',msgId:uid(),data,fileName:f.name.slice(0,100)};
    if(!pub(p))return;
    append({...p,clientId:S.cid,nickname:S.nick,ts:Date.now()},true);
    clearReply();
  });
}
async function toggleRec(){
  if(!S.rec&&!connected())return toast(t('noConn'),'error');
  if(S.rec){
    if(S.recorder)S.recorder.stop();
    S.rec=false;D.audioBtn.textContent='🎤';
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    S.recorder=new MediaRecorder(stream);S.chunks=[];
    S.recorder.ondataavailable=e=>{if(e.data.size)S.chunks.push(e.data)};
    S.recorder.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(S.chunks,{type:(S.recorder&&S.recorder.mimeType)||'audio/webm'});
      if(blob.size>CFG.MAX_AUDIO*1024)return toast(t('tooBigAudio',{kb:CFG.MAX_AUDIO}),'error');
      const r=new FileReader();
      r.onload=()=>{
        const msgId=uid();
        const p={type:'audio',msgId,data:r.result};
        if(!pub(p))return;
        append({...p,clientId:S.cid,nickname:S.nick,ts:Date.now()},true);
      };
      r.readAsDataURL(blob);
    };
    S.recorder.start();S.rec=true;D.audioBtn.textContent='⏹';
    toast(t('recording'),'info',2000);
  }catch(e){toast(t('micDenied'),'error')}
}

// ===== Search / star =====
function search(q){
  const s=q.trim().toLowerCase();
  if(!s){
    D.messages.querySelectorAll('.msg').forEach(m=>m.style.outline='');
    D.searchCount.textContent='';
    return;
  }
  let n=0;
  D.messages.querySelectorAll('.msg').forEach(el=>{
    const m=S.msgs.get(el.dataset.id);
    const h=((m&&m.text)||'')+' '+((m&&m.fileName)||'');
    if(h.toLowerCase().includes(s)){
      el.style.outline='2px solid var(--accent)';
      n++;
    }else el.style.outline='';
  });
  D.searchCount.textContent=t('searchResults',{n});
}
function applyStar(){
  D.messages.querySelectorAll('.msg').forEach(el=>{
    const m=S.msgs.get(el.dataset.id);
    el.hidden=S.starFilter&&!(m&&m.starred);
  });
  D.starBtn.classList.toggle('active',S.starFilter);
  if(S.starFilter)toast(t('starredOn'),'info',1800);
}

// ===== Mentions =====
function updateMentions(){
  const text=D.text.value;
  const pos=D.text.selectionStart;
  const upto=text.slice(0,pos);
  const m=upto.match(/@([\w-]{0,32})$/);
  if(!m){D.mentions.hidden=true;S.mentionIdx=-1;return}
  const q=m[1].toLowerCase();
  const cands=[];
  S.peers.forEach((p,id)=>{
    if(p.nickname&&!isBanned(id)&&p.nickname.toLowerCase().includes(q))cands.push(p.nickname);
  });
  if(!cands.length){D.mentions.hidden=true;return}
  S.mentionItems=cands.slice(0,6);
  S.mentionIdx=0;
  D.mentions.innerHTML='';
  S.mentionItems.forEach((n,i)=>{
    const el=document.createElement('div');
    el.className='m-item'+(i===0?' active':'');
    el.innerHTML=`<div class="avatar sm" style="background:${colorFor(n)}">${esc(inits(n))}</div><span>${esc(n)}</span>`;
    el.onclick=()=>insertMention(n);
    D.mentions.appendChild(el);
  });
  D.mentions.hidden=false;
}
function insertMention(nick){
  const text=D.text.value;
  const pos=D.text.selectionStart;
  const upto=text.slice(0,pos);
  const m=upto.match(/@([\w-]{0,32})$/);
  if(!m)return;
  const before=text.slice(0,m.index);
  const after=text.slice(pos);
  D.text.value=before+'@'+nick+' '+after;
  D.text.selectionStart=D.text.selectionEnd=before.length+nick.length+2;
  D.mentions.hidden=true;S.mentionIdx=-1;
  autoResize(D.text);
}

// ===== Edit / delete =====
function delMine(m,id){
  m.deleted=true;m.text='';m.data=null;
  pub({type:'delete',msgId:id});
  markDirty(id);
  rerender(id,true);
}
function restar(id){
  markDirty(id);
  rerender(id);
}
function startEdit(id){
  if(!canAct())return;
  const m=S.msgs.get(id);
  if(!m)return;
  S.editingId=id;
  D.text.value=m.text||'';
  autoResize(D.text);
  D.text.focus();
  D.sendBtn.textContent='✓';
}
function commitEdit(){
  if(!S.editingId)return;
  const id=S.editingId;
  const m=S.msgs.get(id);
  if(!m||!D.text.value.trim())return;
  m.text=D.text.value.trim();
  m.edited=true;
  pub({type:'edit',msgId:id,text:m.text});
  markDirty(id);
  rerender(id);
  S.editingId=null;
  D.text.value='';
  autoResize(D.text);
  D.sendBtn.textContent=t('send');
}

// ===== Join screen & crop =====
const Crop={
  img:null,scale:1,minScale:1,offsetX:0,offsetY:0,
  size:CFG.CROP_SIZE,dragging:false,
  sx:0,sy:0,dx:0,dy:0,ctx:null
};
function renderJoinAvatar(){
  D.joinAvatar.innerHTML='';
  if(S.avatar&&validAvatar(S.avatar)){
    D.joinAvatar.style.background='transparent';
    const img=document.createElement('img');
    img.src=S.avatar;img.alt='';
    D.joinAvatar.appendChild(img);
    D.joinAvatarClear.hidden=false;
  }else{
    D.joinAvatar.style.background=colorFor(S.cid);
    D.joinAvatar.textContent=inits(D.joinNick.value||'You');
    D.joinAvatarClear.hidden=true;
  }
}
function drawCrop(){
  const c=Crop;
  if(!c.ctx||!c.img)return;
  c.ctx.clearRect(0,0,c.size,c.size);
  c.ctx.save();
  c.ctx.beginPath();
  c.ctx.arc(c.size/2,c.size/2,c.size/2,0,Math.PI*2);
  c.ctx.clip();
  c.ctx.drawImage(c.img,c.offsetX,c.offsetY,c.img.width*c.scale,c.img.height*c.scale);
  c.ctx.restore();
}
function clampCrop(){
  const c=Crop;
  const w=c.img.width*c.scale;
  const h=c.img.height*c.scale;
  if(c.offsetX>0)c.offsetX=0;
  if(c.offsetY>0)c.offsetY=0;
  if(c.offsetX<c.size-w)c.offsetX=c.size-w;
  if(c.offsetY<c.size-h)c.offsetY=c.size-h;
}
function setupCrop(img){
  const cv=D.cropCanvas;
  cv.width=Crop.size;cv.height=Crop.size;
  Crop.img=img;Crop.ctx=cv.getContext('2d');
  const s=Crop.size/Math.min(img.width,img.height);
  Crop.minScale=s;Crop.scale=s;
  Crop.offsetX=(Crop.size-img.width*s)/2;
  Crop.offsetY=(Crop.size-img.height*s)/2;
  D.cropZoom.value='1';
  drawCrop();
}
function openCrop(file){
  const img=new Image();
  const url=URL.createObjectURL(file);
  img.onload=()=>{URL.revokeObjectURL(url);setupCrop(img);D.cropView.hidden=false};
  img.onerror=()=>{URL.revokeObjectURL(url);toast('Could not load image','error')};
  img.src=url;
}
function applyCrop(){
  if(!Crop.img)return;
  const out=document.createElement('canvas');
  const K=CFG.AVATAR_OUT;
  out.width=K;out.height=K;
  const g=out.getContext('2d');
  g.save();
  g.beginPath();
  g.arc(K/2,K/2,K/2,0,Math.PI*2);
  g.clip();
  const k=K/Crop.size;
  g.drawImage(
    Crop.img,
    Crop.offsetX*k, Crop.offsetY*k,
    Crop.img.width*Crop.scale*k,
    Crop.img.height*Crop.scale*k
  );
  g.restore();

  let data=out.toDataURL('image/png');
  if(data.length>CFG.AVATAR_MAX){
    data=out.toDataURL('image/jpeg',0.88);
  }
  if(!validAvatar(data)){toast('Image too big','error');return}

  S.avatar=data;
  try{localStorage.setItem('mc_avatar',data)}catch(e){}
  D.cropView.hidden=true;Crop.img=null;
  renderJoinAvatar();updateSelf();
  if(connected())pub({type:'avatar',avatar:data});
  toast(t('avatarUpdated'),'success',2000);
}
function initCrop(){
  D.cropStage.addEventListener('pointerdown',e=>{
    if(!Crop.img)return;
    Crop.dragging=true;
    Crop.sx=e.clientX;Crop.sy=e.clientY;
    Crop.dx=Crop.offsetX;Crop.dy=Crop.offsetY;
    try{D.cropStage.setPointerCapture(e.pointerId)}catch(_){}
  });
  D.cropStage.addEventListener('pointermove',e=>{
    if(!Crop.dragging||!Crop.img)return;
    Crop.offsetX=Crop.dx+(e.clientX-Crop.sx);
    Crop.offsetY=Crop.dy+(e.clientY-Crop.sy);
    clampCrop();drawCrop();
  });
  const stop=()=>{Crop.dragging=false};
  D.cropStage.addEventListener('pointerup',stop);
  D.cropStage.addEventListener('pointercancel',stop);
  D.cropZoom.oninput=()=>{
    if(!Crop.img)return;
    const z=parseFloat(D.cropZoom.value)||1;
    const newScale=Crop.minScale*z;
    const cx=Crop.size/2,cy=Crop.size/2;
    const ix=(cx-Crop.offsetX)/Crop.scale;
    const iy=(cy-Crop.offsetY)/Crop.scale;
    Crop.scale=newScale;
    Crop.offsetX=cx-ix*Crop.scale;
    Crop.offsetY=cy-iy*Crop.scale;
    clampCrop();drawCrop();
  };
  D.cropCancel.onclick=()=>{D.cropView.hidden=true;Crop.img=null};
  D.cropOk.onclick=applyCrop;
}
function initJoin(){
  D.joinRoom.value=localStorage.getItem('mc_room')||'lobby';
  D.joinNick.value=localStorage.getItem('mc_nick')||'';
  renderJoinAvatar();
  D.joinNick.oninput=renderJoinAvatar;
  D.joinAvatarPick.onclick=()=>D.joinAvatarInput.click();
  D.joinAvatarClear.onclick=()=>{
    S.avatar=null;localStorage.removeItem('mc_avatar');
    renderJoinAvatar();updateSelf();
  };
  D.joinAvatarInput.onchange=()=>{
    const f=D.joinAvatarInput.files[0];
    D.joinAvatarInput.value='';
    if(f)openCrop(f);
  };
  D.joinBtn.onclick=()=>{
    const room=cleanRoom(D.joinRoom.value);
    const nick=(D.joinNick.value.trim()||'anon-'+Math.random().toString(36).slice(2,6)).slice(0,32);
    D.joinRoom.value=room;D.joinNick.value=nick;
    D.room.value=room;D.nickname.value=nick;
    S.nick=nick;S.room=room;
    localStorage.setItem('mc_room',room);
    localStorage.setItem('mc_nick',nick);
    D.joinScreen.hidden=true;
    updateSelf();
    connect();
  };
  D.joinNick.onkeydown=e=>{if(e.key==='Enter')D.joinBtn.click()};
  D.joinRoom.onkeydown=e=>{if(e.key==='Enter')D.joinBtn.click()};
}

// ===== Export / Import =====
function downloadBlob(text,name,mime){
  const blob=new Blob([text],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=name;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportJson(){
  if(!S.order.length)return toast(t('nothingToExport'),'info');
  const messages=S.order.map(id=>{
    const m=S.msgs.get(id);
    const o={};
    for(const k in m)if(k[0]!=='_')o[k]=m[k];
    return o;
  });
  const data={v:1,room:S.room,exportedAt:new Date().toISOString(),messages};
  downloadBlob(JSON.stringify(data,null,2),`minichat-${S.room}-${Date.now()}.json`,'application/json');
}
function exportTxt(){
  if(!S.order.length)return toast(t('nothingToExport'),'info');
  const lines=[];
  lines.push(`# MiniChat export`);
  lines.push(`# Room: ${S.room}`);
  lines.push(`# Exported: ${new Date().toISOString()}`);
  lines.push(`# Messages: ${S.order.length}`);
  let lastDate='';
  for(const id of S.order){
    const m=S.msgs.get(id);
    const d=fmtDate(m.ts);
    if(d!==lastDate){
      lines.push('');lines.push(`## ${d}`);lastDate=d;
    }
    const time=fmtTime(m.ts);
    const nick=m.nickname||'anon';
    let body='';
    if(m.deleted)body='[deleted]';
    else if(m.type==='img')body=m.sticker?'[sticker]':'[image]';
    else if(m.type==='audio')body='[audio]';
    else if(m.type==='file')body=`[file: ${m.fileName||'file'}]`;
    else body=(m.text||'').replace(/\n/g,'\n  ');
    lines.push(`[${time}] ${nick}: ${body}`);
  }
  downloadBlob(lines.join('\n'),`minichat-${S.room}-${Date.now()}.txt`,'text/plain');
}
async function importJson(file){
  try{
    const text=await file.text();
    const data=JSON.parse(text);
    if(!data||!Array.isArray(data.messages))throw new Error('Bad format');
    let n=0;
    for(const raw of data.messages){
      const c=clean(raw);
      if(!c||S.msgs.has(c.msgId))continue;
      if(raw.starred===true)c.starred=true;
      if(raw.edited===true)c.edited=true;
      S.msgs.set(c.msgId,{...c,_s:c.clientId===S.cid?'delivered':'read'});
      S.order.push(c.msgId);
      markDirty(c.msgId);
      n++;
    }
    rebuildAll();
    toast(t('importOk',{n}),'success',3500);
  }catch(e){
    toast(t('importErr',{err:e.message||e}),'error',6000);
  }
}

// ===== Wire =====
function wire(){
  D.connectBtn.onclick=()=>{requestNotif();connect()};
  D.disconnectBtn.onclick=disconnect;
  D.room.onkeydown=e=>{if(e.key==='Enter'&&!D.room.disabled)connect()};
  D.nickname.onkeydown=e=>{if(e.key==='Enter'){D.nickname.blur();if(!S.clients.length&&!S.connecting)connect()}};
  D.nickname.onchange=()=>{
    const n=D.nickname.value.trim().slice(0,32);
    if(!n){D.nickname.value=S.nick;return}
    if(n===S.nick)return;
    S.nick=n;D.nickname.value=n;
    localStorage.setItem('mc_nick',n);
    updateSelf();renderMembers();
    if(connected()){pub({type:'presence'});sys(t('nickChanged',{nick:n}))}
  };
  D.selfAvatar.onclick=()=>D.avatarChangeInput.click();
  initSections();

  D.composerForm.onsubmit=(e)=>{e.preventDefault();sendText()};

  D.text.oninput=()=>{
    autoResize(D.text);updateMentions();
    if(!connected())return;
    const now=Date.now();
    if(now-S.lastTyping>1000){pub({type:'typing',on:true});S.lastTyping=now}
    clearTimeout(S.typingTimer);
    S.typingTimer=setTimeout(()=>pub({type:'typing',on:false}),CFG.TYPING_TTL);
  };
  D.text.onkeydown=(e)=>{
    if(!D.mentions.hidden){
      if(e.key==='ArrowDown'){e.preventDefault();S.mentionIdx=Math.min(S.mentionIdx+1,S.mentionItems.length-1);hlMention();return}
      if(e.key==='ArrowUp'){e.preventDefault();S.mentionIdx=Math.max(S.mentionIdx-1,0);hlMention();return}
      if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();insertMention(S.mentionItems[S.mentionIdx]);return}
      if(e.key==='Escape'){D.mentions.hidden=true;return}
    }
    if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();sendText()}
    if(e.key==='Escape'&&S.editingId){
      S.editingId=null;D.text.value='';autoResize(D.text);
      D.sendBtn.textContent=t('send');
    }
  };
  function hlMention(){
    D.mentions.querySelectorAll('.m-item').forEach((el,i)=>el.classList.toggle('active',i===S.mentionIdx));
  }

  D.emojiBtn.onclick=showEmoji;
  D.attachBtn.onclick=()=>{D.attachMenu.hidden=!D.attachMenu.hidden};
  D.attachMenu.onclick=e=>{
    const b=e.target.closest('button');
    if(!b)return;
    const a=b.dataset.a;
    D.attachMenu.hidden=true;
    if(a==='image')D.imageInput.click();
    else if(a==='sticker')D.stickerInput.click();
    else if(a==='file')D.fileInput.click();
  };
  D.imageInput.onchange=()=>{sendImage(D.imageInput.files[0],false);D.imageInput.value=''};
  D.stickerInput.onchange=()=>{sendImage(D.stickerInput.files[0],true);D.stickerInput.value=''};
  D.fileInput.onchange=()=>{sendFile(D.fileInput.files[0]);D.fileInput.value=''};
  D.audioBtn.onclick=toggleRec;
  D.clearHist.onclick=()=>{if(confirm(t('clearAsk')))clearHistory()};
  D.replyClose.onclick=clearReply;

  D.changeAvatar.onclick=()=>D.avatarChangeInput.click();
  D.removeAvatar.onclick=()=>{
    S.avatar=null;localStorage.removeItem('mc_avatar');
    updateSelf();
    if(connected())pub({type:'avatar',avatar:null});
  };
  D.avatarChangeInput.onchange=()=>{
    const f=D.avatarChangeInput.files[0];
    D.avatarChangeInput.value='';
    if(f)openCrop(f);
  };

  D.exportJson.onclick=exportJson;
  D.exportTxt.onclick=exportTxt;
  D.importBtn.onclick=()=>D.importInput.click();
  D.importInput.onchange=()=>{
    const f=D.importInput.files[0];
    D.importInput.value='';
    if(f)importJson(f);
  };

  D.selClose.onclick=exitSel;
  D.selStar.onclick=()=>{
    S.sel.forEach(id=>{const m=S.msgs.get(id);if(m)m.starred=true});
    S.sel.forEach(restar);exitSel();
  };
  D.selCopy.onclick=()=>{
    const txt=Array.from(S.sel).map(id=>S.msgs.get(id)).filter(Boolean).map(preview).join('\n');
    navigator.clipboard.writeText(txt).then(()=>toast(t('copied'),'success',1500));
    exitSel();
  };
  D.selDelete.onclick=()=>{
    S.sel.forEach(id=>{
      const m=S.msgs.get(id);
      if(m&&m.clientId===S.cid)delMine(m,id);
    });
    exitSel();
  };

  D.starBtn.onclick=()=>{S.starFilter=!S.starFilter;applyStar()};

  D.searchBtn.onclick=()=>{
    D.searchbar.hidden=!D.searchbar.hidden;
    if(!D.searchbar.hidden)D.searchInput.focus();
    else search('');
  };
  D.searchClose.onclick=()=>{D.searchbar.hidden=true;search('')};
  D.searchInput.oninput=e=>search(e.target.value);

  D.scrollDown.onclick=()=>toBottom();
  D.messages.onscroll=()=>{
    if(nearBottom()){
      S.unread=0;updateUnread();
      if(!document.hidden)flushReads();
    }else D.scrollDown.hidden=false;
  };

  document.addEventListener('click',e=>{
    if(!D.ctx.hidden&&!D.ctx.contains(e.target))hideCtx();
    if(!D.emojiPicker.hidden&&!D.emojiPicker.contains(e.target)&&e.target!==D.emojiBtn)hideEmoji();
    if(!D.attachMenu.hidden&&!D.attachMenu.contains(e.target)&&e.target!==D.attachBtn)D.attachMenu.hidden=true;
    if(!D.mentions.hidden&&!D.mentions.contains(e.target)&&e.target!==D.text)D.mentions.hidden=true;
  });
  D.lightbox.onclick=closeLightbox;

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){
      if(!D.cropView.hidden){D.cropView.hidden=true;Crop.img=null;return}
      if(S.selMode){exitSel();return}
      hideCtx();hideEmoji();closeLightbox();
    }
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){
      e.preventDefault();D.searchbar.hidden=false;D.searchInput.focus();
    }
  });

  const hasFiles=e=>!!(e.dataTransfer&&Array.from(e.dataTransfer.types||[]).includes('Files'));
  document.addEventListener('dragenter',e=>{
    e.preventDefault();
    if(hasFiles(e)){S.dragging++;D.dropOverlay.hidden=false}
  });
  document.addEventListener('dragover',e=>e.preventDefault());
  document.addEventListener('dragleave',e=>{
    e.preventDefault();
    S.dragging=Math.max(0,S.dragging-1);
    if(!S.dragging)D.dropOverlay.hidden=true;
  });
  document.addEventListener('drop',e=>{
    e.preventDefault();S.dragging=0;D.dropOverlay.hidden=true;
    if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length)handleFiles(e.dataTransfer.files);
  });
  document.addEventListener('paste',e=>{
    if(!e.clipboardData)return;
    Array.from(e.clipboardData.items||[]).forEach(it=>{
      if(it.type&&it.type.startsWith('image/')){
        const f=it.getAsFile();
        if(f)sendImage(f,false);
      }
    });
  });

  D.sidebarToggle.onclick=()=>D.sidebar.classList.toggle('open');
  D.messages.addEventListener('click',()=>{
    if(innerWidth<=720)D.sidebar.classList.remove('open');
  });

  document.addEventListener('visibilitychange',()=>{
    if(!document.hidden&&nearBottom()){
      S.unread=0;updateUnread();flushReads();
    }
  });
}
function handleFiles(files){
  if(!canAct())return;
  Array.from(files).forEach(f=>{
    if(f.type.startsWith('image/'))sendImage(f,false);
    else sendFile(f);
  });
}

// ===== IndexedDB history =====
const DB={
  open(){
    return this.p||(this.p=new Promise(res=>{
      try{
        const r=indexedDB.open('minichat',1);
        r.onupgradeneeded=()=>{
          r.result.createObjectStore('msgs',{keyPath:'k'}).createIndex('scope','scope');
        };
        r.onsuccess=()=>res(r.result);
        r.onerror=()=>res(null);
      }catch(e){res(null)}
    }));
  },
  async run(fn){
    const db=await this.open();
    if(!db)return null;
    return new Promise(res=>{
      try{
        fn(db.transaction('msgs','readwrite').objectStore('msgs'),res);
      }catch(e){res(null)}
    });
  },
  all(scope){
    return this.run((s,res)=>{
      const q=s.index('scope').getAll(scope);
      q.onsuccess=()=>res(q.result||[]);
      q.onerror=()=>res([]);
    }).then(r=>r||[]);
  },
  put(recs){
    return this.run((s,res)=>{
      recs.forEach(r=>s.put(r));
      s.transaction.oncomplete=()=>res(true);
    });
  },
  del(keys){
    return this.run((s,res)=>{
      keys.forEach(k=>s.delete(k));
      s.transaction.oncomplete=()=>res(true);
    });
  }
};
function toRec(sc,m){
  const o={};
  for(const k in m)if(k[0]!=='_')o[k]=m[k];
  return{k:sc+'|'+m.msgId,scope:sc,ts:m.ts,m:JSON.parse(JSON.stringify(o))};
}
function markDirty(id){
  if(!S.scope)return;
  S.dirty.add(id);
  clearTimeout(S.dt);
  S.dt=setTimeout(flushDirty,500);
}
async function flushDirty(){
  const sc=S.scope,ids=[...S.dirty];
  S.dirty.clear();
  if(!sc||!ids.length)return;
  const recs=ids.map(id=>S.msgs.get(id)).filter(Boolean).map(m=>toRec(sc,m));
  try{await DB.put(recs)}catch(e){}
}
function addRecords(recs){
  for(const r of recs){
    const m=r&&r.m;
    if(!m||typeof m.msgId!=='string'||S.msgs.has(m.msgId))continue;
    S.msgs.set(m.msgId,{...m,_s:m.clientId===S.cid?'delivered':'read'});
    S.order.push(m.msgId);
  }
}
function rebuildAll(){
  S.order.sort((a,b)=>S.msgs.get(a).ts-S.msgs.get(b).ts);
  while(S.order.length>CFG.MAX_KEEP)S.msgs.delete(S.order.shift());
  D.messages.innerHTML='';S.lastDate='';
  S.order.forEach((id,i)=>{
    const m=S.msgs.get(id);
    const pv=i?S.msgs.get(S.order[i-1]):null;
    dateDiv(m.ts);
    D.messages.appendChild(build(id,!!(pv&&pv.clientId===m.clientId&&(m.ts-pv.ts)<120000&&!m.replyTo)));
  });
  toBottom(false);
}
async function switchScope(scope){
  if(S.scope===scope)return;
  await flushDirty();
  S.scope=scope;
  S.msgs.clear();S.order=[];S.toRead=[];
  D.messages.innerHTML='';S.lastDate='';
  loadBans();renderBans();
  const recs=(await DB.all(scope)).sort((a,b)=>a.ts-b.ts);
  if(S.scope!==scope)return;
  if(recs.length>CFG.HIST_MAX)DB.del(recs.slice(0,recs.length-CFG.HIST_MAX).map(r=>r.k));
  addRecords(recs.slice(-CFG.HIST_MAX));
  rebuildAll();
}
async function clearHistory(){
  const sc=S.scope;S.dirty.clear();
  if(sc)await DB.del((await DB.all(sc)).map(r=>r.k));
  D.messages.innerHTML='';
  S.msgs.clear();S.order=[];S.lastDate='';
  sys(t('cleared'));
}

// ===== Init =====
function init(){
  initTheme();initLang();initFont();initCrop();initJoin();wire();

  D.room.value=localStorage.getItem('mc_room')||'lobby';
  D.nickname.value=localStorage.getItem('mc_nick')||'';
  try{localStorage.removeItem('mc_ghost')}catch(e){}
  S.nick=D.nickname.value;

  D.roomName.textContent=D.room.value;
  D.roomAvatar.textContent='#'+(D.room.value[0]||'').toUpperCase();
  D.roomAvatar.style.background=colorFor(D.room.value);

  updateSelf();renderMembers();renderBans();syncConn();syncComposer();
}
init();
})();