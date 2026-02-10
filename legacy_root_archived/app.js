let pc = null;
let dc = null;
let localStream = null;
let vadMode = 'server_vad';
let isMuted = false;
let appConfig = null; // Loaded globally once per connection
let selectedLanguage = 'en';
let selectedModel = 'gpt-4o-mini-realtime-preview';

const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const remoteAudio = document.getElementById("remoteAudio");

const btnConnect = document.getElementById("btnConnect");
const btnDisconnect = document.getElementById("btnDisconnect");
const btnClear = document.getElementById("btnClear");
const btnSend = document.getElementById("btnSend");
const btnVAD = document.getElementById("btnVAD");
const btnMute = document.getElementById("btnMute");
const txt = document.getElementById("txt");
const languageSelect = document.getElementById("languageSelect");
const modelSelect = document.getElementById("modelSelect");

function setStatus(text, kind = "secondary") {
  if (!statusEl) return;
  statusEl.className = "badge text-bg-" + kind;
  statusEl.textContent = text;
}

function log(...args) {
  const line = args.map(a => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  if (logEl) {
    logEl.textContent += line + "\n";
    logEl.scrollTop = logEl.scrollHeight;
  }
}

function safeJsonParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}

async function getEphemeralToken() {
  const res = await fetch("./token.php", { method: "POST" });
  if (!res.ok) throw new Error("token error: " + await res.text());
  return res.json();
}

function sendEvent(evt) {
  if (!dc || dc.readyState !== "open") return;
  dc.send(JSON.stringify(evt));
}

async function connect() {
  setStatus("starting...", "warning");
  btnConnect.disabled = true;

  try {
    // Load config once per connection
    if (!appConfig) {
      appConfig = await ConfigService.getConfig();
      log("✓ Configuration loaded");
    }

    // CRITICAL: Apply selected language instructions
    if (selectedLanguage && selectedLanguage !== 'en') {
      const languageInstructions = await ConfigService.getLanguageInstructions(selectedLanguage);
      appConfig.boltalka_instructions = languageInstructions;
      log('🌍 Using language: ' + selectedLanguage);
    }

    const { value: ephemeralKey, expires_at } = await getEphemeralToken();
    log("✓ Ephemeral token obtained");

    pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.ontrack = (e) => {
      if (remoteAudio) {
        remoteAudio.srcObject = e.streams[0];
        log("✓ Remote audio track received");
      }
    };

    dc = pc.createDataChannel("oai-events");
    dc.onopen = () => {
      log("✓ DataChannel open (mode: " + vadMode + ")");
      if(btnSend) btnSend.disabled = false;
      // Only enable Talk button in MANUAL mode
      if(btnMute) {
        btnMute.disabled = (vadMode !== 'manual');
        if (vadMode === 'manual') {
          btnMute.textContent = 'Talk';
          btnMute.className = 'btn btn-outline-danger';
        }
      }
      
      const sessionConfig = {
        modalities: ["text", "audio"],
        instructions: appConfig.boltalka_instructions,
        voice: "alloy"
      };
      
      // Only add turn_detection in AUTO mode
      if (vadMode === 'server_vad') {
        sessionConfig.turn_detection = { type: 'server_vad' };
      }
      // In MANUAL mode, NO turn_detection - user controls when to respond
      
      sendEvent({
        type: "session.update",
        session: sessionConfig
      });
      
      setStatus(vadMode === 'server_vad' ? "listening" : "muted", vadMode === 'server_vad' ? "danger" : "success");
    };

    dc.onmessage = (msg) => {
      const evt = safeJsonParse(msg.data);
      if (evt) {
        // Log all events for debugging
        if (evt.type === 'error') {
          log("❌ ERROR: " + JSON.stringify(evt.error));
        }
        
        if (evt.type === 'response.done') {
          const items = evt.response?.output?.length || 0;
          const status = evt.response?.status || 'unknown';
          log("📤 Response complete. Status: " + status + ", Output items: " + items);
          if (items === 0 && status === 'completed') {
            log("⚠️  WARNING: AI produced no output. Check your question or instructions.");
          }
        }
        
        if (evt.type === 'conversation.item.input_audio_transcription.completed') {
          log("🎤 You said: " + evt.transcript);
        }
        
        if (evt.type === 'response.audio_transcription.done') {
          log("🤖 AI said: " + evt.transcript);
        }
        
        if (evt.type === 'input_audio_buffer.speech_started') {
          log("🔊 Speech detected");
        }
        
        if (evt.type === 'input_audio_buffer.speech_stopped') {
          log("🔇 Speech ended");
        }
      }
    };

    localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
    });

    for (const track of localStream.getTracks()) {
      pc.addTrack(track, localStream);
    }
    
    isMuted = (vadMode === 'manual');
    localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const model = selectedModel || appConfig.realtime_model || 'gpt-4o-mini-realtime-preview';
    const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        "Authorization": "Bearer " + ephemeralKey,
        "Content-Type": "application/sdp"
      }
    });

    if (!sdpRes.ok) throw new Error("SDP failed: " + await sdpRes.text());

    const answerSdp = await sdpRes.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

    btnDisconnect.disabled = false;
    log("connected ✅");
  } catch (e) {
    log("Connect Error: " + e.message);
    btnConnect.disabled = false;
    setStatus("error", "danger");
  }
}

async function disconnect() {
  if(btnDisconnect) btnDisconnect.disabled = true;
  if(btnSend) btnSend.disabled = true;
  if(btnMute) btnMute.disabled = true;

  try { dc?.close(); } catch {}
  try { pc?.close(); } catch {}
  try { localStream?.getTracks()?.forEach(t => t.stop()); } catch {}

  dc = null;
  pc = null;
  localStream = null;

  setStatus("idle", "secondary");
  btnConnect.disabled = false;
  log("✓ Disconnected");
}

if(btnConnect) btnConnect.onclick = connect;
if(btnDisconnect) btnDisconnect.onclick = disconnect;
if(btnClear) btnClear.onclick = () => { if(logEl) logEl.textContent = ""; };
if(btnMute) btnMute.disabled = true; // Start disabled - only enable when connected

if(btnMute) {
  let isRecording = false;
  
  // MOUSEDOWN = User presses Talk button
  btnMute.onmousedown = (e) => {
    e.preventDefault();
    
    // CRITICAL: Only enable in MANUAL mode AND only when connected
    if (vadMode !== 'manual') {
      log("ERROR: Talk button only works in Manual mode.");
      return;
    }
    
    if (!localStream || !pc || pc.connectionState !== 'connected' || !dc || dc.readyState !== 'open') {
      log("ERROR: Not connected. Cannot use Talk button.");
      return;
    }
    
    if (isRecording) {
      log("ERROR: Already recording");
      return;
    }
    
    isRecording = true;
    isMuted = false; // Enable microphone
    localStream.getAudioTracks().forEach(t => t.enabled = true);
    
    log('🎤 Talk button PRESSED - speak your message');
    btnMute.textContent = '🔴 Recording...';
    btnMute.className = 'btn btn-danger';
    setStatus('recording', 'danger');
  };
  
  // MOUSEUP = User releases Talk button
  btnMute.onmouseup = (e) => {
    e.preventDefault();
    
    if (!isRecording) return;
    
    isRecording = false;
    isMuted = true; // Disable microphone
    localStream.getAudioTracks().forEach(t => t.enabled = false);
    
    log('📤 Talk button RELEASED - sending audio...');
    btnMute.textContent = 'Talk';
    btnMute.className = 'btn btn-outline-danger';
    setStatus('muted', 'success');
    
    // Commit audio and request response with proper timing
    // Wait longer to ensure audio buffer has content (OpenAI requires at least 100ms)
    setTimeout(() => {
      log('💾 Committing audio buffer...');
      sendEvent({ type: 'input_audio_buffer.commit' });
      
      // Wait longer for commit to process before requesting response
      setTimeout(() => {
        log('🤖 Requesting AI response...');
        sendEvent({ type: 'response.create' });
      }, 200);  // Increased from 100ms to 200ms
    }, 200);  // Increased from 50ms to 200ms to ensure audio is captured
  };
  
  // Also handle when mouse leaves button while held down (user dragged away)
  btnMute.onmouseleave = (e) => {
    if (isRecording) {
      isRecording = false;
      isMuted = true;
      localStream.getAudioTracks().forEach(t => t.enabled = false);
      log('📤 Talk button released (mouse left) - sending audio...');
      btnMute.textContent = 'Talk';
      btnMute.className = 'btn btn-outline-danger';
      setStatus('muted', 'success');
      
      setTimeout(() => {
        sendEvent({ type: 'input_audio_buffer.commit' });
        setTimeout(() => {
          sendEvent({ type: 'response.create' });
        }, 200);
      }, 200);
    }
  };
}

document.querySelectorAll('#vadMenu .dropdown-item').forEach(item => {
  item.onclick = (e) => {
    e.preventDefault();
    const newMode = item.dataset.vad;
    
    if (newMode === vadMode) {
      log('ℹ️  Already in ' + vadMode + ' mode');
      return;
    }
    
    vadMode = newMode;
    if (btnVAD) btnVAD.textContent = item.textContent;
    document.querySelectorAll('#vadMenu .dropdown-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    
    log('🔄 Switching to ' + (newMode === 'server_vad' ? 'Auto (VAD)' : 'Manual (Push-to-Talk)') + ' mode');
    
    // If connected, update session immediately
    if (dc && dc.readyState === 'open') {
      log('📝 Updating session...');
      const sessionConfig = {
        modalities: ["text", "audio"],
        instructions: appConfig.boltalka_instructions,
        voice: "alloy"
      };
      
      if (newMode === 'server_vad') {
        // AUTO mode: microphone always on
        sessionConfig.turn_detection = { type: 'server_vad' };
        isMuted = false;
        if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = true);
        // Disable Talk button (not used in Auto mode)
        if (btnMute) {
          btnMute.disabled = true;
          btnMute.textContent = 'Talk';
          btnMute.className = 'btn btn-outline-danger';
        }
        setStatus('listening', 'danger');
      } else {
        // MANUAL mode: microphone off by default, user presses to talk
        sessionConfig.turn_detection = null;
        isMuted = true;
        if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = false);
        // Enable Talk button (used in Manual mode)
        if (btnMute) {
          btnMute.disabled = false;
          btnMute.textContent = 'Talk';
          btnMute.className = 'btn btn-outline-danger';
        }
        setStatus('muted', 'success');
      }
      
      sendEvent({
        type: 'session.update',
        session: sessionConfig
      });
      
      setStatus(isMuted ? 'muted' : 'listening', isMuted ? 'success' : 'danger');
    } else {
      log('ℹ️  Not connected yet. Mode will activate on next Connect.');
    }
  };
});

function sendText() {
  const text = (txt.value || "").trim();
  if (!text) return;
  sendEvent({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: text }]
    }
  });
  sendEvent({ type: "response.create" });
  txt.value = "";
  log("📨 Text sent: " + text);
}

// Language Selector
if (languageSelect) {
  languageSelect.onchange = async (e) => {
    selectedLanguage = e.target.value;
    log('🌍 Language changed to: ' + e.target.options[e.target.selectedIndex].text);
    
    // Get localized instructions for the selected language
    const instructions = await ConfigService.getLanguageInstructions(selectedLanguage);
    
    // ALWAYS update appConfig to ensure the selected language is used
    if (appConfig) {
      appConfig.boltalka_instructions = instructions;
    }
    
    // If connected, CANCEL current response and update session immediately
    if (dc && dc.readyState === 'open' && appConfig) {
      // Cancel any ongoing response to force applying new instructions
      log('🛑 Cancelling current response to apply new language...');
      sendEvent({ type: 'response.cancel' });
      
      // Wait a moment then send session.update with new instructions
      setTimeout(() => {
        sendEvent({
          type: 'session.update',
          session: {
            modalities: ["text", "audio"],
            instructions: instructions,
            voice: "alloy",
            turn_detection: vadMode === 'server_vad' ? { type: 'server_vad' } : null
          }
        });
        log('✓ Session updated with ' + selectedLanguage + ' instructions (after cancel)');
      }, 100);
    } else if (appConfig) {
      log('✓ Will use ' + selectedLanguage + ' on next connection');
    }
  };
}

// Model Selector
if (modelSelect) {
  modelSelect.onchange = (e) => {
    selectedModel = e.target.value;
    log('🤖 Model changed to: ' + e.target.options[e.target.selectedIndex].text);
    
    if (pc && pc.connectionState === 'connected') {
      log('ℹ️  Disconnect and reconnect to use new model');
    } else {
      log('✓ Model will change on next Connect');
    }
  };
}

if(btnSend) btnSend.onclick = sendText;
if(txt) txt.onkeydown = (e) => { if (e.key === "Enter") sendText(); };
