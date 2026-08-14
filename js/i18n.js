/* ═══════════════════════════════════════════════════════════════════════
   MiniChat · js/i18n.js
═══════════════════════════════════════════════════════════════════════ */
'use strict';

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
  localStorage.setItem(CONFIG.LS_KEYS.LANG, lang);
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang][key]) el.textContent = I18N[lang][key];
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[lang][key]) el.placeholder = I18N[lang][key];
  });

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