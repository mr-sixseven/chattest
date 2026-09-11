(function(){
'use strict';

const CFG={
  BROKERS:['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt'],
  PREFIX:'minichat/v2/',
  MAX_MSG:2000, MAX_IMG:200, MAX_AUDIO:200, MAX_FILE:500, MAX_CHARS:500000,
  PRESENCE:15000, PRESENCE_TTL:45000, TYPING_TTL:2500
};

const TR={
  en:{online:'Online',offline:'Offline',connecting:'Connecting…',reconnecting:'Reconnecting…',tapConnect:'Tap connect to join',
    joined:'Joined "{room}" as {nick}',left:'You left',userJoined:'{nick} joined',userLeft:'{nick} left',
    tooBigImg:'Image too big (max {kb} KB)',tooBigAudio:'Audio too big (max {kb} KB)',tooBigFile:'File too big (max {kb} KB)',
    micDenied:'Mic access denied',noBroker:'Could not reach any broker',recording:'Recording…',
    rolled:'🎲 Rolled {n}',coin:'🪙 {r}',ball:'🎱 {r}',help:'Commands: /roll /coin /8ball /nick /clear /help',
    nickChanged:'Nickname: {nick}',cleared:'Chat cleared',
    today:'Today',yesterday:'Yesterday',typing:'typing…',
    reply:'Reply',copy:'Copy',delete:'Delete',star:'Star',unstar:'Unstar',select:'Select',
    cancel:'Cancel',edited:'edited',deleted:'This message was deleted',youDeleted:'You deleted this',
    you:'You',anon:'anon',members:'Members',copied:'Copied',selCount:'{n} selected',
    searchResults:'{n} found',noStarred:'No starred',starredOn:'Showing starred only',
    forward:'Forward',forwardTo:'Forward to…',forwarded:'{n} forwarded',send:'Send'},
  es:{online:'En línea',offline:'Desconectado',connecting:'Conectando…',reconnecting:'Reconectando…',tapConnect:'Conecta para unirte',
    joined:'Te uniste a "{room}" como {nick}',left:'Saliste',userJoined:'{nick} se unió',userLeft:'{nick} salió',
    tooBigImg:'Imagen muy grande (máx {kb} KB)',tooBigAudio:'Audio muy grande (máx {kb} KB)',tooBigFile:'Archivo muy grande (máx {kb} KB)',
    micDenied:'Micrófono denegado',noBroker:'Sin brokers disponibles',recording:'Grabando…',
    rolled:'🎲 Sacaste {n}',coin:'🪙 {r}',ball:'🎱 {r}',help:'Comandos: /roll /coin /8ball /nick /clear /help',
    nickChanged:'Apodo: {nick}',cleared:'Chat limpiado',
    today:'Hoy',yesterday:'Ayer',typing:'escribiendo…',
    reply:'Responder',copy:'Copiar',delete:'Eliminar',star:'Destacar',unstar:'Quitar',select:'Seleccionar',
    cancel:'Cancelar',edited:'editado',deleted:'Mensaje eliminado',youDeleted:'Eliminaste esto',
    you:'Tú',anon:'anon',members:'Miembros',copied:'Copiado',selCount:'{n} seleccionados',
    searchResults:'{n} encontrados',noStarred:'Sin destacados',starredOn:'Solo destacados',
    forward:'Reenviar',forwardTo:'Reenviar a…',forwarded:'{n} reenviados',send:'Enviar'}
};

const EMOJIS='😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🥵 🥶 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 👍 👎 👌 ✌️ 🤞 🤟 🤘 👏 🙌 🙏 💪 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 💕 💞 💓 💗 💖 💘 💝 🔥 ⭐ ✨ 💯 🎉 🎊 🎈 🎁 🎂 🍕 🍔 🍟 🍺 ☕ ⚽ 🏀 🎮 🎵 🚀 🌈'.split(' ');
const QUICK=['👍','❤️','😂','😮','😢','🙏'];

const S={
  client:null, topic:'', room:'lobby', nick:'', cid:'mc_'+Math.random().toString(36).slice(2,10),
  lang:'en', theme:'whatsapp',
  peers:new Map(), msgs:new Map(), order:[], lastDate:'',
  replyTo:null, unread:0, typingTimer:null, presenceTimer:null, sweepTimer:null,
  rec:false, recorder:null, chunks:[], lastTyping:0, editingId:null,
  sel:new Set(), selMode:false, starFilter:false,
  mentionIdx:-1, mentionItems:[], dragging:0
};

const $=(s)=>document.querySelector(s);
const D={
  sidebar:$('#sidebar'), sidebarToggle:$('#sidebarToggle'),
  selfAvatar:$('#selfAvatar'), selfName:$('#selfName'), selfStatus:$('#selfStatus'),
  members:$('#members'), memberCount:$('#memberCount'),
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
  imageInput:$('#imageInput'), fileInput:$('#fileInput'),
  ctx:$('#ctx'), emojiPicker:$('#emojiPicker'),
  lightbox:$('#lightbox'), lightboxImg:$('#lightboxImg'), toasts:$('#toasts')
};

function t(k,v){let s=(TR[S.lang]&&TR[S.lang][k])||k;if(v)for(const [a,b] of Object.entries(v))s=s.replace(`{${a}}`,b);return s}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function inits(n){if(!n)return'?';const p=String(n).trim().split(/\s+/);return((p[0][0]||'?')+(p[1]?p[1][0]:'')).toUpperCase().slice(0,2)}
function colorFor(id){let h=0;for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))|0;return`hsl(${Math.abs(h)%360},55%,48%)`}
function fmtTime(ts){return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function fmtDate(ts){const d=new Date(ts),td=new Date(),yd=new Date(td);td.setHours(0,0,0,0);yd.setDate(yd.getDate()-1);yd.setHours(0,0,0,0);const dd=new Date(d);dd.setHours(0,0,0,0);if(dd.getTime()===td.getTime())return t('today');if(dd.getTime()===yd.getTime())return t('yesterday');return d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}
function toast(m,k='info',to=4000){const e=document.createElement('div');e.className='toast '+k;e.textContent=m;D.toasts.appendChild(e);setTimeout(()=>{e.style.opacity='0';setTimeout(()=>e.remove(),300)},to)}
function status(s,c=''){D.roomStatus.textContent=s;D.roomStatus.className='sub'+(c?' '+c:'')}
function cssEsc(s){return String(s).replace(/["\\]/g,'\\$&')}

// rich text
function renderRich(raw){
  if(!raw)return'';
  const parts=[];const re=/```([\s\S]*?)```/g;let last=0,m;
  while((m=re.exec(raw))){parts.push({t:'x',v:raw.slice(last,m.index)});parts.push({t:'c',v:m[1]});last=m.index+m[0].length}
  parts.push({t:'x',v:raw.slice(last)});
  return parts.map(p=>p.t==='c'?`<pre><code>${esc(p.v.replace(/^\n/,''))}</code></pre>`:inline(p.v)).join('');
}
function inline(s){
  s=esc(s);
  s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
  s=s.replace(/(^|\W)\*([^*\n]+)\*(?=\W|$)/g,'$1<strong>$2</strong>');
  s=s.replace(/(^|\W)_([^_\n]+)_(?=\W|$)/g,'$1<em>$2</em>');
  s=s.replace(/(^|\W)~([^~\n]+)~(?=\W|$)/g,'$1<del>$2</del>');
  s=s.replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
  s=s.replace(/(^|\s)@([\w-]{1,32})/g,'$1<span class="mention">@$2</span>');
  return s;
}

function sound(){
  try{const c=sound.c||(sound.c=new (window.AudioContext||window.webkitAudioContext)());const o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.type='sine';o.frequency.value=880;g.gain.setValueAtTime(0.0001,c.currentTime);g.gain.exponentialRampToValueAtTime(0.06,c.currentTime+.01);g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+.25);o.start();o.stop(c.currentTime+.26)}catch(e){}
}

// theme/lang/font
function initTheme(){
  S.theme=localStorage.getItem('mc_theme')||'whatsapp';
  document.documentElement.setAttribute('data-theme',S.theme);
  D.themeSelect.value=S.theme;
  D.themeSelect.onchange=()=>{S.theme=D.themeSelect.value;document.documentElement.setAttribute('data-theme',S.theme);localStorage.setItem('mc_theme',S.theme)};
}
function initLang(){
  S.lang=localStorage.getItem('mc_lang')||'en';
  D.langSelect.value=S.lang;
  D.langSelect.onchange=()=>{S.lang=D.langSelect.value;localStorage.setItem('mc_lang',S.lang);refreshI18n();S.order.forEach(rerender)};
  refreshI18n();
}
function refreshI18n(){
  if(S.client&&S.client.connected)status(t('online'));
  else status(t('tapConnect'));
  D.selfName.textContent=S.nick||t('you');
  D.selfStatus.textContent=(S.client&&S.client.connected)?t('online'):t('offline');
  D.sendBtn.textContent=S.editingId?'✓':t('send');
}
function initFont(){
  const v=parseInt(localStorage.getItem('mc_font')||'100',10);
  D.fontSize.value=v;applyFont(v);
  D.fontSize.oninput=()=>{const n=parseInt(D.fontSize.value,10);applyFont(n);localStorage.setItem('mc_font',n)};
}
function applyFont(v){document.documentElement.style.setProperty('--font-scale',v/100);D.fontLabel.textContent=v+'%'}

function updateSelf(){
  D.selfAvatar.textContent=inits(S.nick||'You');
  D.selfAvatar.style.background=colorFor(S.cid);
  refreshI18n();
}

// commands
function handleCmd(text){
  const p=text.trim().split(/\s+/),c=p[0].toLowerCase();
  if(c==='/help'){sys(t('help'));return true}
  if(c==='/clear'){D.messages.innerHTML='';S.msgs.clear();S.order=[];S.lastDate='';sys(t('cleared'));return true}
  if(c==='/nick'&&p[1]){S.nick=p[1];D.nickname.value=S.nick;localStorage.setItem('mc_nick',S.nick);updateSelf();sys(t('nickChanged',{nick:S.nick}));return true}
  if(c==='/roll'){sys(t('rolled',{n:Math.floor(Math.random()*100)+1}));return true}
  if(c==='/coin'){sys(t('coin',{r:Math.random()<.5?'Heads!':'Tails!'}));return true}
  if(c==='/8ball'){const a=['Yes.','No.','Maybe.','Definitely.','Absolutely not.','Ask again later.','Without a doubt.'];sys(t('ball',{r:a[Math.floor(Math.random()*a.length)]}));return true}
  return false;
}

// mqtt
function connect(){
  if(S.client)return;
  S.room=(D.room.value||'lobby').trim();
  S.nick=(D.nickname.value||'anon-'+Math.random().toString(36).slice(2,6)).trim();
  S.topic=CFG.PREFIX+S.room;
  localStorage.setItem('mc_room',S.room);localStorage.setItem('mc_nick',S.nick);
  D.roomName.textContent=S.room;
  D.roomAvatar.textContent='#'+S.room.slice(0,1).toUpperCase();
  D.roomAvatar.style.background=colorFor(S.room);
  updateSelf();
  let i=0;
  function next(){
    if(i>=CFG.BROKERS.length){status(t('noBroker'));toast(t('noBroker'),'error',6000);return}
    const b=CFG.BROKERS[i++];
    status(t('connecting'));
    const c=mqtt.connect(b,{clientId:S.cid,clean:true,reconnectPeriod:5000,connectTimeout:10000,keepalive:30});
    let ok=false;
    c.on('connect',()=>{
      ok=true;S.client=c;status(t('online'));
      D.connectBtn.disabled=true;D.disconnectBtn.disabled=false;D.text.disabled=false;D.sendBtn.disabled=false;
      updateSelf();
      c.subscribe(S.topic,{qos:0},err=>{
        if(!err){
          sys(t('joined',{room:S.room,nick:S.nick}));
          pub({type:'join'});
          pub({type:'presence'});
          S.presenceTimer=setInterval(()=>pub({type:'presence'}),CFG.PRESENCE);
          S.sweepTimer=setInterval(sweep,10000);
          renderMembers();
        }
      });
    });
    c.on('message',(tp,p)=>{if(tp===S.topic)incoming(p)});
    c.on('error',e=>{if(!ok){c.end(true);next()}});
    c.on('close',()=>{if(S.client===c){status(t('offline'));D.text.disabled=true;D.sendBtn.disabled=true}});
    c.on('reconnect',()=>status(t('reconnecting')));
  }
  next();
}
function disconnect(){
  if(!S.client)return;
  pub({type:'leave'});pub({type:'presence',offline:true});
  clearInterval(S.presenceTimer);clearInterval(S.sweepTimer);
  S.client.end(true);S.client=null;S.peers.clear();renderMembers();
  status(t('tapConnect'));
  D.connectBtn.disabled=false;D.disconnectBtn.disabled=true;D.text.disabled=true;D.sendBtn.disabled=true;
  updateSelf();
  sys(t('left'));
}
function pub(o){
  if(!S.client||!S.client.connected)return false;
  o.clientId=S.cid;o.nickname=S.nick;o.ts=o.ts||Date.now();o.msgId=o.msgId||uid();
  const p=JSON.stringify(o);
  if(p.length>CFG.MAX_CHARS){toast('Payload too big','error');return false}
  S.client.publish(S.topic,p,{qos:0});
  return true;
}
function incoming(payload){
  let m;try{m=JSON.parse(payload.toString())}catch(e){return}
  if(!m||!m.type||m.clientId===S.cid)return;
  if(m.clientId){
    const prev=S.peers.get(m.clientId);
    S.peers.set(m.clientId,{nickname:m.nickname||(prev&&prev.nickname)||'anon',lastSeen:Date.now(),typing:m.type==='typing'?!!m.on:(prev?prev.typing:false)});
    renderMembers();
  }
  switch(m.type){
    case'join':sys(t('userJoined',{nick:m.nickname||'anon'}));break;
    case'leave':sys(t('userLeft',{nick:m.nickname||'anon'}));break;
    case'presence':if(m.offline){S.peers.delete(m.clientId);renderMembers()}break;
    case'typing':renderTyping();break;
    case'msg':case'img':case'audio':case'file':onChat(m);break;
    case'ack':onAck(m);break;
    case'react':onReact(m);break;
    case'delete':onDel(m);break;
    case'edit':onEdit(m);break;
  }
}
function onChat(m){
  if(S.msgs.has(m.msgId))return;
  pub({type:'ack',msgId:m.msgId,status:'delivered',to:m.clientId});
  if(document.hidden||!nearBottom()){S.unread++;updateUnread();sound()}
  append(m,false);
  setTimeout(()=>pub({type:'ack',msgId:m.msgId,status:'read',to:m.clientId}),800);
}
function onAck(m){const x=S.msgs.get(m.msgId);if(!x||x.clientId!==S.cid)return;if(m.status==='read')x._s='read';else if(m.status==='delivered'&&x._s!=='read')x._s='delivered';ticks(m.msgId)}
function onReact(m){const x=S.msgs.get(m.msgId);if(!x)return;x.reactions=x.reactions||{};if(m.remove){if(x.reactions[m.emoji]){x.reactions[m.emoji]=x.reactions[m.emoji].filter(i=>i!==m.clientId);if(!x.reactions[m.emoji].length)delete x.reactions[m.emoji]}}else{if(!x.reactions[m.emoji])x.reactions[m.emoji]=[];if(!x.reactions[m.emoji].includes(m.clientId))x.reactions[m.emoji].push(m.clientId)}reacts(m.msgId)}
function onDel(m){const x=S.msgs.get(m.msgId);if(!x)return;x.deleted=true;x.text='';x.data=null;rerender(m.msgId)}
function onEdit(m){const x=S.msgs.get(m.msgId);if(!x||x.clientId!==m.clientId)return;x.text=m.text;x.edited=true;rerender(m.msgId)}
function sweep(){const now=Date.now();let ch=false;for(const[id,p]of S.peers){if(now-p.lastSeen>CFG.PRESENCE_TTL){S.peers.delete(id);ch=true}}if(ch)renderMembers();renderTyping()}

function nearBottom(){return D.messages.scrollHeight-D.messages.scrollTop-D.messages.clientHeight<120}
function toBottom(sm=true){D.messages.scrollTo({top:D.messages.scrollHeight,behavior:sm?'smooth':'auto'});S.unread=0;updateUnread();D.scrollDown.hidden=true}
function updateUnread(){D.unread.textContent=S.unread>0?(S.unread>99?'99+':S.unread):'';D.scrollDown.hidden=S.unread===0&&nearBottom()}
function preview(m){if(m.type==='img')return'📷 Image';if(m.type==='audio')return'🎤 Voice';if(m.type==='file')return'📄 '+(m.fileName||'File');return m.text||''}
function dateDiv(ts){const k=fmtDate(ts);if(k!==S.lastDate){S.lastDate=k;const d=document.createElement('div');d.className='date';d.textContent=k;D.messages.appendChild(d)}}
function sys(text){const d=document.createElement('div');d.className='date';d.textContent=text;D.messages.appendChild(d);toBottom()}
function append(m,own){
  S.msgs.set(m.msgId,{...m,_s:own?'sent':'read'});
  S.order.push(m.msgId);
  dateDiv(m.ts);
  const prev=S.order[S.order.length-2];
  const pv=prev?S.msgs.get(prev):null;
  const grouped=pv&&pv.clientId===m.clientId&&(m.ts-pv.ts)<120000&&!m.replyTo;
  D.messages.appendChild(build(m.msgId,grouped));
  if(own||nearBottom())toBottom();else{S.unread++;updateUnread()}
}
function rerender(id){const o=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);if(!o)return;const g=o.classList.contains('grouped');o.replaceWith(build(id,g))}

function build(id,grouped){
  const m=S.msgs.get(id),own=m.clientId===S.cid;
  const el=document.createElement('div');
  el.className='msg'+(own?' own':'')+(grouped?' grouped':'');
  if(S.sel.has(id))el.classList.add('selected');
  el.dataset.id=id;
  const av=document.createElement('div');av.className='avatar';av.textContent=inits(m.nickname);av.style.background=colorFor(m.clientId);el.appendChild(av);
  const w=document.createElement('div');w.className='wrap';el.appendChild(w);
  if(!own){const s=document.createElement('div');s.className='sender';s.textContent=m.nickname||t('anon');s.style.color=colorFor(m.clientId);w.appendChild(s)}
  const b=document.createElement('div');b.className='bubble';w.appendChild(b);
  if(m.starred){const st=document.createElement('span');st.className='star';st.textContent='⭐';b.appendChild(st)}
  if(m.deleted){const i=document.createElement('i');i.style.opacity='.6';i.textContent=own?t('youDeleted'):t('deleted');b.appendChild(i)}
  else{
    if(m.replyTo){const q=document.createElement('div');q.className='quote';q.innerHTML=`<div class="q-name">${esc(m.replyTo.nickname||'')}</div><div class="q-text">${esc(m.replyTo.text||'')}</div>`;q.onclick=()=>jump(m.replyTo.msgId);b.appendChild(q)}
    if(m.type==='img'&&m.data){const img=document.createElement('img');img.src=m.data;img.onclick=()=>{if(!S.selMode)lightbox(m.data)};b.appendChild(img)}
    else if(m.type==='audio'&&m.data){const a=document.createElement('audio');a.controls=true;a.src=m.data;b.appendChild(a)}
    else if(m.type==='file'&&m.data){const a=document.createElement('a');a.className='file-link';a.href=m.data;a.download=m.fileName||'file';a.innerHTML=`📄 ${esc(m.fileName||'file')}`;a.style.color='inherit';b.appendChild(a)}
    else{const sp=document.createElement('span');sp.innerHTML=renderRich(m.text||'');b.appendChild(sp)}
  }
  const mt=document.createElement('div');mt.className='meta';
  const tm=document.createElement('span');tm.textContent=fmtTime(m.ts);mt.appendChild(tm);
  if(m.edited){const e=document.createElement('span');e.textContent=' · '+t('edited');mt.appendChild(e)}
  if(own&&!m.deleted){const tk=document.createElement('span');tk.className='ticks '+(m._s||'sent');tk.textContent=m._s==='sent'?'✓':'✓✓';mt.appendChild(tk)}
  b.appendChild(mt);
  if(m.reactions&&Object.keys(m.reactions).length){
    const r=document.createElement('div');r.className='reactions';
    for(const[e,u]of Object.entries(m.reactions)){
      const p=document.createElement('div');p.className='reaction'+(u.includes(S.cid)?' mine':'');p.innerHTML=`${e}<span class="n">${u.length}</span>`;p.onclick=(ev)=>{ev.stopPropagation();react(id,e)};r.appendChild(p)
    }
    w.appendChild(r);
  }
  b.oncontextmenu=(e)=>{e.preventDefault();if(!m.deleted)ctxMenu(id,e.clientX,e.clientY)};
  b.ondblclick=()=>{if(!m.deleted&&!S.selMode)react(id,'❤️')};
  b.onclick=(e)=>{if(S.selMode){e.preventDefault();toggleSel(id)}};
  return el;
}
function ticks(id){const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);if(!el)return;const m=S.msgs.get(id);const tk=el.querySelector('.ticks');if(!tk)return;tk.className='ticks '+(m._s||'sent');tk.textContent=m._s==='sent'?'✓':'✓✓'}
function reacts(id){const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);if(!el)return;const w=el.querySelector('.wrap');let r=w.querySelector('.reactions');if(r)r.remove();const m=S.msgs.get(id);if(!m.reactions||!Object.keys(m.reactions).length)return;r=document.createElement('div');r.className='reactions';for(const[e,u]of Object.entries(m.reactions)){const p=document.createElement('div');p.className='reaction'+(u.includes(S.cid)?' mine':'');p.innerHTML=`${e}<span class="n">${u.length}</span>`;p.onclick=()=>react(id,e);r.appendChild(p)}w.appendChild(r)}
function jump(id){const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);if(!el)return;el.scrollIntoView({behavior:'smooth',block:'center'});const b=el.querySelector('.bubble');b.style.outline='2px solid var(--accent)';setTimeout(()=>b.style.outline='',1200)}
function renderMembers(){
  D.members.innerHTML='';
  const self=document.createElement('li');
  self.innerHTML=`<div class="avatar sm" style="background:${colorFor(S.cid)}">${esc(inits(S.nick||'You'))}</div><span>${esc(S.nick||t('you'))} (you)</span><span class="dot"></span>`;
  D.members.appendChild(self);
  S.peers.forEach((p,id)=>{const li=document.createElement('li');li.innerHTML=`<div class="avatar sm" style="background:${colorFor(id)}">${esc(inits(p.nickname))}</div><span>${esc(p.nickname||t('anon'))}</span><span class="dot"></span>`;D.members.appendChild(li)});
  D.memberCount.textContent=S.peers.size+(S.client&&S.client.connected?1:0);
}
function renderTyping(){
  const ty=[];S.peers.forEach(p=>{if(p.typing)ty.push(p.nickname)});
  if(ty.length)status(`${ty.slice(0,2).join(', ')} ${t('typing')}`,'typing');
  else if(S.client&&S.client.connected)status(t('online'));
  let tb=document.getElementById('typingBubble');
  if(ty.length){
    if(!tb){tb=document.createElement('div');tb.id='typingBubble';tb.className='msg';const av=document.createElement('div');av.className='avatar';av.textContent=inits(ty[0]);av.style.background=colorFor('typ');tb.appendChild(av);const w=document.createElement('div');w.className='wrap';const b=document.createElement('div');b.className='bubble typing-bubble';b.innerHTML='<span></span><span></span><span></span>';w.appendChild(b);tb.appendChild(w);D.messages.appendChild(tb)}else D.messages.appendChild(tb);
    if(nearBottom())toBottom();
  }else if(tb)tb.remove();
}
function react(id,e){
  const m=S.msgs.get(id);if(!m)return;
  m.reactions=m.reactions||{};
  const u=m.reactions[e]||(m.reactions[e]=[]);
  const has=u.includes(S.cid);
  if(has){m.reactions[e]=u.filter(x=>x!==S.cid);if(!m.reactions[e].length)delete m.reactions[e];pub({type:'react',msgId:id,emoji:e,remove:true})}
  else{u.push(S.cid);pub({type:'react',msgId:id,emoji:e})}
  reacts(id);
}
function setReply(id){const m=S.msgs.get(id);if(!m||m.deleted)return;S.replyTo={msgId:id,nickname:m.nickname||t('anon'),text:preview(m)};D.replyPreview.hidden=false;D.replyPreview.querySelector('.rp-name').textContent=m.nickname||t('anon');D.replyPreview.querySelector('.rp-text').textContent=preview(m);D.text.focus()}
function clearReply(){S.replyTo=null;D.replyPreview.hidden=true}

function toggleSel(id){if(S.sel.has(id))S.sel.delete(id);else S.sel.add(id);if(S.sel.size===0)exitSel();else{S.selMode=true;D.selbar.hidden=false;D.selCount.textContent=t('selCount',{n:S.sel.size});const el=D.messages.querySelector(`[data-id="${cssEsc(id)}"]`);if(el)el.classList.toggle('selected',S.sel.has(id))}}
function exitSel(){S.selMode=false;S.sel.clear();D.selbar.hidden=true;D.messages.querySelectorAll('.msg.selected').forEach(m=>m.classList.remove('selected'))}

function ctxMenu(id,x,y){
  D.ctx.innerHTML='';
  const m=S.msgs.get(id);if(!m)return;
  const own=m.clientId===S.cid;
  const row=document.createElement('div');row.className='emoji-row';
  QUICK.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.onclick=()=>{react(id,e);hideCtx()};row.appendChild(b)});
  D.ctx.appendChild(row);
  const add=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{fn();hideCtx()};D.ctx.appendChild(b)};
  add('↩️ '+t('reply'),()=>setReply(id));
  add('☑️ '+t('select'),()=>{S.selMode=true;toggleSel(id)});
  if(m.type==='msg')add('📋 '+t('copy'),()=>navigator.clipboard.writeText(m.text||'').then(()=>toast(t('copied'),'success',1500)));
  add(m.starred?'☆ '+t('unstar'):'⭐ '+t('star'),()=>{m.starred=!m.starred;rerender(id);if(S.starFilter)applyStar()});
  if(own){add('🗑️ '+t('delete'),()=>{m.deleted=true;m.text='';m.data=null;pub({type:'delete',msgId:id});rerender(id)})}
  D.ctx.hidden=false;
  const r=D.ctx.getBoundingClientRect();
  D.ctx.style.left=Math.min(x,innerWidth-r.width-8)+'px';
  D.ctx.style.top=Math.min(y,innerHeight-r.height-8)+'px';
}
function hideCtx(){D.ctx.hidden=true}

function showEmoji(){
  if(!D.emojiPicker.dataset.f){EMOJIS.forEach(e=>{const b=document.createElement('button');b.type='button';b.textContent=e;b.onclick=()=>{insertText(e);hideEmoji();D.text.focus()};D.emojiPicker.appendChild(b)});D.emojiPicker.dataset.f='1'}
  const r=D.emojiBtn.getBoundingClientRect();
  D.emojiPicker.style.left=r.left+'px';
  D.emojiPicker.style.bottom=(innerHeight-r.top+6)+'px';
  D.emojiPicker.hidden=false;
}
function hideEmoji(){D.emojiPicker.hidden=true}
function insertText(txt){const el=D.text,s=el.selectionStart||0,e=el.selectionEnd||0;el.value=el.value.slice(0,s)+txt+el.value.slice(e);el.selectionStart=el.selectionEnd=s+txt.length;autoResize(el)}
function autoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,140)+'px'}
function lightbox(src){D.lightboxImg.src=src;D.lightbox.hidden=false}
function closeLightbox(){D.lightbox.hidden=true;D.lightboxImg.src=''}

function sendText(){
  if(S.editingId){commitEdit();return}
  const text=D.text.value.trim();if(!text)return;
  if(handleCmd(text)){D.text.value='';autoResize(D.text);return}
  if(text.length>CFG.MAX_MSG)return toast('Message too long','error');
  const msgId=uid();
  const payload={type:'msg',msgId,text,replyTo:S.replyTo?{...S.replyTo}:undefined};
  pub(payload);
  append({...payload,clientId:S.cid,nickname:S.nick,ts:Date.now()},true);
  D.text.value='';autoResize(D.text);clearReply();
  pub({type:'typing',on:false});
}
function sendImage(f){
  if(!f)return;if(f.size>CFG.MAX_IMG*1024)return toast(t('tooBigImg',{kb:CFG.MAX_IMG}),'error');
  const r=new FileReader();
  r.onload=()=>{const msgId=uid();const p={type:'img',msgId,data:r.result,replyTo:S.replyTo?{...S.replyTo}:undefined};pub(p);append({...p,clientId:S.cid,nickname:S.nick,ts:Date.now()},true);clearReply()};
  r.readAsDataURL(f);
}
function sendFile(f){
  if(!f)return;if(f.size>CFG.MAX_FILE*1024)return toast(t('tooBigFile',{kb:CFG.MAX_FILE}),'error');
  const r=new FileReader();
  r.onload=()=>{const msgId=uid();const p={type:'file',msgId,data:r.result,fileName:f.name};pub(p);append({...p,clientId:S.cid,nickname:S.nick,ts:Date.now()},true);clearReply()};
  r.readAsDataURL(f);
}
async function toggleRec(){
  if(S.rec){if(S.recorder)S.recorder.stop();S.rec=false;D.audioBtn.textContent='🎤';return}
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    S.recorder=new MediaRecorder(stream);S.chunks=[];
    S.recorder.ondataavailable=e=>{if(e.data.size)S.chunks.push(e.data)};
    S.recorder.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(S.chunks,{type:'audio/webm'});
      if(blob.size>CFG.MAX_AUDIO*1024)return toast(t('tooBigAudio',{kb:CFG.MAX_AUDIO}),'error');
      const r=new FileReader();
      r.onload=()=>{const msgId=uid();const p={type:'audio',msgId,data:r.result};pub(p);append({...p,clientId:S.cid,nickname:S.nick,ts:Date.now()},true)};
      r.readAsDataURL(blob);
    };
    S.recorder.start();S.rec=true;D.audioBtn.textContent='⏹';toast(t('recording'),'info',2000);
  }catch(e){toast(t('micDenied'),'error')}
}

function search(q){
  const s=q.trim().toLowerCase();
  if(!s){D.messages.querySelectorAll('.msg').forEach(m=>m.style.outline='');D.searchCount.textContent='';return}
  let n=0;
  D.messages.querySelectorAll('.msg').forEach(el=>{const m=S.msgs.get(el.dataset.id);const h=((m&&m.text)||'')+' '+((m&&m.fileName)||'');if(h.toLowerCase().includes(s)){el.style.outline='2px solid var(--accent)';n++}else el.style.outline=''});
  D.searchCount.textContent=t('searchResults',{n});
}
function applyStar(){D.messages.querySelectorAll('.msg').forEach(el=>{const m=S.msgs.get(el.dataset.id);el.hidden=S.starFilter&&!(m&&m.starred)});D.starBtn.classList.toggle('active',S.starFilter);if(S.starFilter)toast(t('starredOn'),'info',1800)}

function updateMentions(){
  const text=D.text.value;const pos=D.text.selectionStart;
  const upto=text.slice(0,pos);
  const m=upto.match(/@([\w-]{0,32})$/);
  if(!m){D.mentions.hidden=true;S.mentionIdx=-1;return}
  const q=m[1].toLowerCase();
  const cands=[];
  S.peers.forEach(p=>{if(p.nickname&&p.nickname.toLowerCase().includes(q))cands.push(p.nickname)});
  if(!cands.length){D.mentions.hidden=true;return}
  S.mentionItems=cands.slice(0,6);S.mentionIdx=0;
  D.mentions.innerHTML='';
  S.mentionItems.forEach((n,i)=>{
    const el=document.createElement('div');el.className='m-item'+(i===0?' active':'');
    el.innerHTML=`<div class="avatar sm" style="background:${colorFor(n)}">${esc(inits(n))}</div><span>${esc(n)}</span>`;
    el.onclick=()=>insertMention(n);
    D.mentions.appendChild(el);
  });
  D.mentions.hidden=false;
}
function insertMention(nick){
  const text=D.text.value;const pos=D.text.selectionStart;
  const upto=text.slice(0,pos);const m=upto.match(/@([\w-]{0,32})$/);
  if(!m)return;
  const before=text.slice(0,m.index);const after=text.slice(pos);
  D.text.value=before+'@'+nick+' '+after;
  D.text.selectionStart=D.text.selectionEnd=before.length+nick.length+2;
  D.mentions.hidden=true;S.mentionIdx=-1;autoResize(D.text);
}

function wire(){
  D.connectBtn.onclick=connect;
  D.disconnectBtn.onclick=disconnect;
  D.composerForm.onsubmit=(e)=>{e.preventDefault();sendText()};
  D.text.oninput=()=>{
    autoResize(D.text);updateMentions();
    if(!S.client||!S.client.connected)return;
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
    if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendText()}
    if(e.key==='Escape'&&S.editingId){S.editingId=null;D.text.value='';autoResize(D.text);D.sendBtn.textContent=t('send')}
  };
  function hlMention(){D.mentions.querySelectorAll('.m-item').forEach((el,i)=>el.classList.toggle('active',i===S.mentionIdx))}
  D.emojiBtn.onclick=showEmoji;
  D.attachBtn.onclick=()=>{D.attachMenu.hidden=!D.attachMenu.hidden};
  D.attachMenu.onclick=e=>{const b=e.target.closest('button');if(!b)return;const a=b.dataset.a;D.attachMenu.hidden=true;if(a==='image')D.imageInput.click();else if(a==='file')D.fileInput.click()};
  D.imageInput.onchange=()=>{sendImage(D.imageInput.files[0]);D.imageInput.value=''};
  D.fileInput.onchange=()=>{sendFile(D.fileInput.files[0]);D.fileInput.value=''};
  D.audioBtn.onclick=toggleRec;
  D.replyClose.onclick=clearReply;

  D.selClose.onclick=exitSel;
  D.selStar.onclick=()=>{S.sel.forEach(id=>{const m=S.msgs.get(id);if(m)m.starred=true});S.sel.forEach(rerender);exitSel()};
  D.selCopy.onclick=()=>{const txt=Array.from(S.sel).map(id=>S.msgs.get(id)).filter(Boolean).map(preview).join('\n');navigator.clipboard.writeText(txt).then(()=>toast(t('copied'),'success',1500));exitSel()};
  D.selDelete.onclick=()=>{S.sel.forEach(id=>{const m=S.msgs.get(id);if(m&&m.clientId===S.cid){m.deleted=true;m.text='';m.data=null;pub({type:'delete',msgId:id});rerender(id)}});exitSel()};

  D.starBtn.onclick=()=>{S.starFilter=!S.starFilter;applyStar()};

  D.searchBtn.onclick=()=>{D.searchbar.hidden=!D.searchbar.hidden;if(!D.searchbar.hidden)D.searchInput.focus();else search('')};
  D.searchClose.onclick=()=>{D.searchbar.hidden=true;search('')};
  D.searchInput.oninput=e=>search(e.target.value);

  D.scrollDown.onclick=()=>toBottom();
  D.messages.onscroll=()=>{if(nearBottom()){S.unread=0;updateUnread()}else D.scrollDown.hidden=false};

  document.addEventListener('click',e=>{
    if(!D.ctx.hidden&&!D.ctx.contains(e.target))hideCtx();
    if(!D.emojiPicker.hidden&&!D.emojiPicker.contains(e.target)&&e.target!==D.emojiBtn)hideEmoji();
    if(!D.attachMenu.hidden&&!D.attachMenu.contains(e.target)&&e.target!==D.attachBtn)D.attachMenu.hidden=true;
    if(!D.mentions.hidden&&!D.mentions.contains(e.target)&&e.target!==D.text)D.mentions.hidden=true;
  });
  D.lightbox.onclick=closeLightbox;
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){if(S.selMode){exitSel();return}hideCtx();hideEmoji();closeLightbox()}
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='f'){e.preventDefault();D.searchbar.hidden=false;D.searchInput.focus()}
  });

  ['dragenter','dragover'].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();if(e.dataTransfer&&Array.from(e.dataTransfer.types||[]).includes('Files')){S.dragging++;D.dropOverlay.hidden=false}}));
  ['dragleave','drop'].forEach(ev=>document.addEventListener(ev,e=>{e.preventDefault();S.dragging=Math.max(0,S.dragging-1);if(S.dragging===0)D.dropOverlay.hidden=true}));
  document.addEventListener('drop',e=>{if(e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length)handleFiles(e.dataTransfer.files)});
  document.addEventListener('paste',e=>{if(!e.clipboardData)return;Array.from(e.clipboardData.items||[]).forEach(it=>{if(it.type&&it.type.startsWith('image/')){const f=it.getAsFile();if(f)sendImage(f)}})});

  D.sidebarToggle.onclick=()=>D.sidebar.classList.toggle('open');
  D.messages.addEventListener('click',()=>{if(innerWidth<=720)D.sidebar.classList.remove('open')});

  document.addEventListener('visibilitychange',()=>{if(!document.hidden){S.order.forEach(id=>{const m=S.msgs.get(id);if(m&&m.clientId!==S.cid)pub({type:'ack',msgId:id,status:'read'})});S.unread=0;updateUnread()}});
}
function handleFiles(files){Array.from(files).forEach(f=>{if(f.type.startsWith('image/'))sendImage(f);else sendFile(f)})}

function startEdit(id){const m=S.msgs.get(id);if(!m)return;S.editingId=id;D.text.value=m.text||'';autoResize(D.text);D.text.focus();D.sendBtn.textContent='✓'}
function commitEdit(){if(!S.editingId)return;const id=S.editingId;const m=S.msgs.get(id);if(!m)return;m.text=D.text.value.trim();m.edited=true;pub({type:'edit',msgId:id,text:m.text});rerender(id);S.editingId=null;D.text.value='';autoResize(D.text);D.sendBtn.textContent=t('send')}

function init(){
  initTheme();initLang();initFont();wire();
  D.room.value=localStorage.getItem('mc_room')||'lobby';
  D.nickname.value=localStorage.getItem('mc_nick')||'';
  S.nick=D.nickname.value;
  D.roomName.textContent=D.room.value;
  D.roomAvatar.textContent='#'+(D.room.value[0]||'').toUpperCase();
  D.roomAvatar.style.background=colorFor(D.room.value);
  updateSelf();renderMembers();
}
init();
})();
