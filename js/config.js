/* ═══════════════════════════════════════════════════════════════════════
   MiniChat · js/config.js
═══════════════════════════════════════════════════════════════════════ */
'use strict';

const CONFIG = {
  BROKERS: [
    'wss://broker.emqx.io:8084/mqtt',
    'wss://broker.hivemq.com:8884/mqtt',
  ],
  TOPIC_PREFIX: 'minichat-es/v1/',
  HEARTBEAT_MS: 15000,
  PEER_TTL_MS: 45000,
  GROUP_MS: 3 * 60 * 1000,
  MAX_MSG_LEN: 500,
  TYPING_TIMEOUT: 5000,
  IMG_MAX_DIM: 1280,
  IMG_MAX_KB: 150,
  AUDIO_MAX_SEC: 15,
  AUDIO_MAX_KB: 180,
  LS_KEYS: {
    NICK: 'minichat:nick',
    SOUND: 'minichat:sonido',
    ROOM: 'minichat:ultimaSala',
    LANG: 'minichat:idioma',
    THEME: 'minichat:tema'
  },
  REACT_EMOJIS: ['👍', '❤️', '😂', '😮', '😢', '🔥']
};