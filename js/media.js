/* ═══════════════════════════════════════════════════════════════════════
   MiniChat · js/media.js
═══════════════════════════════════════════════════════════════════════ */
'use strict';

function compressImage(file, maxDim = CONFIG.IMG_MAX_DIM, maxKB = CONFIG.IMG_MAX_KB){
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
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      let q = .85, out;
      do {
        out = cv.toDataURL('image/jpeg', q);
        q -= .1;
      } while (out.length * .75 > maxKB * 1024 && q >= .3);
      resolve(out);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('invalid image')); };
    img.src = url;
  });
}

async function sendImageFile(file){
  if (!STATE.inRoom || !STATE.client) return;
  if (!file || !file.type.startsWith('image/')){ toast('Images only'); return; }
  toast('🖼️ Compressing image…');
  try {
    const dataUrl = await compressImage(file);
    const payload = { 
      t:'i', 
      id: STATE.myId, 
      mid: uuid(), 
      nick: STATE.myNick, 
      img: dataUrl, 
      ts: Date.now() 
    };
    try { STATE.client.publish(STATE.topic, JSON.stringify(payload)); } catch(e){ return; }
    STATE.lastMsg = { id: STATE.myId, ts: Date.now() };
    appendMsg(payload, true);
  } catch(e){ toast('Could not process image 😕'); }
}