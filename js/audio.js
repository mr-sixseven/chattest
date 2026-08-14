'use strict';
let audioCtx = null;

function ensureAudio(){
  if (!audioCtx){
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e){}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function blip(freqs = [880, 1174], dur = .09, vol = .12){
  if (!STATE.soundOn) return;
  ensureAudio();
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  freqs.forEach((f, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + i * dur);
    g.gain.linearRampToValueAtTime(vol, t0 + i * dur + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t0 + i * dur + dur);
    o.connect(g).connect(audioCtx.destination);
    o.start(t0 + i * dur);
    o.stop(t0 + i * dur + dur + .05);
  });
}

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recTimer = null;

async function toggleRecording(){
  if (isRecording){ stopRecording(); return; }
  if (!STATE.inRoom || !STATE.client) return;
  if (!window.MediaRecorder || !navigator.mediaDevices){
    toast('Browser does not support audio recording 😕'); return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = ['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg']
      .find(t => MediaRecorder.isTypeSupported(t));
    if (!mime){ stream.getTracks().forEach(t => t.stop()); toast('Audio format not supported 😕'); return; }
    
    mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
    audioChunks = [];
    mediaRecorder.ondataavailable = e => { if (e.data && e.data.size) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      audioChunks = [];
      if (!blob.size){ toast('Nothing recorded 😕'); return; }
      if (blob.size > CONFIG.AUDIO_MAX_KB * 1024){ toast('Note too long 😕'); return; }
      
      const fr = new FileReader();
      fr.onloadend = () => {
        if (!STATE.inRoom || !STATE.client) return;
        const payload = { 
          t:'a', 
          id: STATE.myId, 
          mid: uuid(), 
          nick: STATE.myNick, 
          audio: fr.result, 
          ts: Date.now() 
        };
        try { STATE.client.publish(STATE.topic, JSON.stringify(payload)); } catch(e){ return; }
        STATE.lastMsg = { id: STATE.myId, ts: Date.now() };
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
    toast(`🎙️ Recording… max ${CONFIG.AUDIO_MAX_SEC}s. Tap ⏹️ to send`);
    recTimer = setTimeout(stopRecording, CONFIG.AUDIO_MAX_SEC * 1000);
  } catch(e){ toast('🎤 Microphone permission denied'); }
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