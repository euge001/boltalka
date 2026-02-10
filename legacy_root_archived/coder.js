// coder.js — Expert Assistant (Speech-to-Code)
let pc = null;
let dc = null;
let localStream = null;
let videoStream = null; 
let audioSource = 'mic';
let vadMode = 'server_vad';
let isMuted = true; 

let chatHistory = []; 
let pendingImage = null;

let UI = {};

function initUI() {
    UI = {
        btnConnect: document.getElementById('btnConnect'),
        btnDisconnect: document.getElementById('btnDisconnect'),
        btnMute: document.getElementById('btnMute'),
        btnClear: document.getElementById('btnClear'),
        btnSource: document.getElementById('btnSource'),
        btnVAD: document.getElementById('btnVAD'),
        btnCommit: document.getElementById('btnCommit'),
        btnSnap: document.getElementById('btnSnap'),
        selPersona: document.getElementById('selPersona'),
        chatBox: document.getElementById('chatBox'),
        logEl: document.getElementById('log'),
        statusEl: document.getElementById('status'),
        volumeBar: document.getElementById('volumeBar')
    };
    
    // Initial UI State: Mute button should be disabled until Connected
    if (UI.btnMute) {
        UI.btnMute.disabled = true;
        UI.btnMute.textContent = 'Talk';
        UI.btnMute.className = 'btn btn-outline-danger';
    }

    // VAD & Source Menu Handlers
    document.querySelectorAll('[data-vad]').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            vadMode = item.dataset.vad;
            if (UI.btnVAD) UI.btnVAD.textContent = item.textContent;
            document.querySelectorAll('[data-vad]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            log('VAD Mode:', vadMode);

            // Update session if connected
            if (dc && dc.readyState === 'open') {
                sendEvent({
                    type: 'session.update',
                    session: {
                        turn_detection: vadMode === 'server_vad' ? { type: 'server_vad' } : null
                    }
                });
                
                // If switching to manual, default to muted
                if (vadMode === 'manual') {
                    isMuted = true;
                    if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = false);
                    setStatus('Connected (Muted)', 'success');
                    if (UI.btnMute) {
                        UI.btnMute.textContent = 'Talk';
                        UI.btnMute.className = 'btn btn-outline-danger';
                    }
                } else if (vadMode === 'server_vad') {
                    // If switching to auto, default to unmuted
                    isMuted = false;
                    if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = true);
                    setStatus('Listening', 'danger');
                    if (UI.btnMute) {
                        UI.btnMute.textContent = 'Listening...';
                        UI.btnMute.className = 'btn btn-danger pulsate';
                    }
                }
            }
        };
    });

    document.querySelectorAll('[data-source]').forEach(item => {
        item.onclick = (e) => {
            e.preventDefault();
            audioSource = item.dataset.source;
            if (UI.btnSource) UI.btnSource.textContent = item.textContent;
            document.querySelectorAll('[data-source]').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            log('Source:', audioSource);
        };
    });
}

async function getConfig() {
    try {
        const res = await fetch('config_js.php');
        return await res.json();
    } catch (e) {
        return { 
            realtime_model: 'gpt-4o-mini-realtime-preview', 
            voice_instructions: 'Silent transcription mode. Do not speak. Only provide text.' 
        };
    }
}

function log(...args) {
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : a)).join(' ');
    console.log('[Coder]', msg);
    if (UI.logEl) {
        UI.logEl.textContent += msg + '\n';
        UI.logEl.scrollTop = UI.logEl.scrollHeight;
    }
}

function setStatus(text, type = 'secondary') {
    if (!UI.statusEl) return;
    UI.statusEl.textContent = text.toUpperCase();
    UI.statusEl.className = 'badge text-bg-' + type;
}

function appendToChat(role, content, image = null) {
    if (!UI.chatBox) return;
    const div = document.createElement('div');
    div.className = role === 'user' ? 'msg-user' : 'msg-assistant';
    let html = '<strong>' + (role === 'user' ? 'You' : 'Expert') + ':</strong><br>';
    if (image) {
        html += '<img src="' + image + '" class="img-fluid rounded border my-2" style="max-height: 250px; cursor: pointer;" onclick="window.open(\'' + image + '\')">';
    }
    if (content) {
        const text = (typeof marked !== 'undefined') ? marked.parse(content) : content;
        html += text;
    }
    div.innerHTML = html;
    UI.chatBox.appendChild(div);
    UI.chatBox.scrollTop = UI.chatBox.scrollHeight;
    return div;
}

async function getExpertResponse(text) {
    setStatus('Thinking...', 'warning');
    const personaVal = UI.selPersona ? UI.selPersona.value : 'coding';
    
    // Create the message that will be sent
    const userMsg = { role: 'user', text: text, image: pendingImage };
    chatHistory.push(userMsg);
    
    const loadingDiv = appendToChat('assistant', '_Expert is thinking..._');
    
    try {
        const res = await fetch('chat.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: chatHistory.slice(-10), persona: personaVal })
        });
        
        loadingDiv.remove();
        if (!res.ok) throw new Error('Network error');
        
        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content || 'No response.';
        chatHistory.push({ role: 'assistant', text: answer });
        
        appendToChat('assistant', answer);
        setStatus(isMuted ? 'Connected' : 'Listening', 'success');
        
        // CRITICAL: Reset pending image AFTER successful send
        pendingImage = null; 
    } catch (e) {
        if (loadingDiv) loadingDiv.remove();
        setStatus('Ready', 'success');
        appendToChat('assistant', '❌ Error connecting to Expert.');
    }
}

async function connect() {
    log('Attempting to connect...');
    setStatus('Connecting...', 'info');
    if(UI.btnConnect) UI.btnConnect.disabled = true;

    try {
        const appConfig = await getConfig();
        const tReq = await fetch('token.php', { method: 'POST' });
        const tData = await tReq.json();
        const ephemeralKey = tData.value;

        if (audioSource === 'mic') {
            localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
            videoStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            localStream = new MediaStream(videoStream.getAudioTracks());
        }

        // Auto-unmute if in Server VAD mode
        isMuted = (vadMode !== 'server_vad');
        localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);

        pc = new RTCPeerConnection();
        const remoteAudio = document.getElementById('remoteAudio');
        pc.ontrack = e => { if (remoteAudio) remoteAudio.srcObject = e.streams[0]; };

        dc = pc.createDataChannel('oai-events');
        dc.onopen = () => {
            log('DataChannel open');
            sendEvent({
                type: 'session.update',
                session: {
                    modalities: ['text'],
                    instructions: appConfig.voice_instructions,
                    input_audio_transcription: { model: 'whisper-1' },
                    turn_detection: vadMode === 'server_vad' ? { type: 'server_vad' } : null
                }
            });
            
            const statusText = isMuted ? 'Connected (Muted)' : 'Listening';
            const statusType = isMuted ? 'success' : 'danger';
            setStatus(statusText, statusType);
            
            // Sync Mute button UI
            if (UI.btnMute) {
                UI.btnMute.disabled = false;
                UI.btnMute.textContent = isMuted ? 'Talk' : 'Listening...';
                UI.btnMute.className = isMuted ? 'btn btn-outline-danger' : 'btn btn-danger pulsate';
            }
            if (UI.btnDisconnect) UI.btnDisconnect.disabled = false;
        };

        dc.onmessage = (msg) => {
            const evt = JSON.parse(msg.data);
            if (evt.type === 'conversation.item.input_audio_transcription.completed') {
                const text = (evt.transcript || '').trim();
                log('Parsed:', text);
                if (text) {
                    // We process transcript even if we are currently muted 
                    // because it might have been generated just as we toggled.
                    appendToChat('user', text);
                    getExpertResponse(text); 
                }
            }
        };

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        const model = appConfig.realtime_model || 'gpt-4o-mini-realtime-preview';
        const sdpRes = await fetch(`https://api.openai.com/v1/realtime?model=${model}`, {
            method: 'POST',
            body: offer.sdp,
            headers: { 'Authorization': 'Bearer ' + ephemeralKey, 'Content-Type': 'application/sdp' }
        });
        await pc.setRemoteDescription({ type: 'answer', sdp: await sdpRes.text() });

        log('WebRTC Linked');
    } catch (e) {
        console.error('Connection failed:', e);
        setStatus('Error', 'danger');
        if(UI.btnConnect) UI.btnConnect.disabled = false;
    }
}

function disconnect() {
    log('Disconnecting...');
    dc?.close(); pc?.close();
    localStream?.getTracks().forEach(t => t.stop());
    videoStream?.getTracks().forEach(t => t.stop());
    pc = null; dc = null; localStream = null;
    setStatus('Ready', 'secondary');
    if(UI.btnConnect) UI.btnConnect.disabled = false;
    if(UI.btnDisconnect) UI.btnDisconnect.disabled = true;
    if(UI.btnMute) {
        UI.btnMute.disabled = true;
        UI.btnMute.textContent = 'Talk';
        UI.btnMute.className = 'btn btn-outline-danger';
    }
    isMuted = true;
}

async function takeScreenshot() {
    try {
        const snapStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const track = snapStream.getVideoTracks()[0];
        const video = document.createElement('video');
        video.srcObject = new MediaStream([track]);
        await new Promise(r => video.onloadedmetadata = r);
        await video.play();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const img = canvas.toDataURL('image/jpeg', 0.8);
        track.stop(); snapStream.getTracks().forEach(t => t.stop());
        return img;
    } catch (e) { return null; }
}

function sendEvent(evt) { if (dc?.readyState === 'open') dc.send(JSON.stringify(evt)); }

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    if (UI.btnConnect) UI.btnConnect.onclick = connect;
    if (UI.btnDisconnect) UI.btnDisconnect.onclick = disconnect;
    if (UI.btnMute) {
        UI.btnMute.onclick = () => {
            if (!localStream) return;
            isMuted = !isMuted;
            localStream.getAudioTracks().forEach(t => t.enabled = !isMuted);
            
            // MANUAL MODE P2T LOGIC:
            // When we stop talking (isMuted becomes true), we must commit the buffer 
            // to trigger transcription since server VAD is disabled.
            if (isMuted && vadMode === 'manual') {
                log('Push-to-Talk: Committing audio...');
                sendEvent({ type: 'input_audio_buffer.commit' });
            }

            // Visual feedback update
            UI.btnMute.textContent = isMuted ? 'Talk' : 'Listening...';
            UI.btnMute.className = isMuted ? 'btn btn-outline-danger' : 'btn btn-danger pulsate';
            setStatus(isMuted ? 'Connected (Muted)' : 'Listening', isMuted ? 'success' : 'danger');
        };
    }
    if (UI.btnSnap) {
        UI.btnSnap.onclick = async () => {
            const img = await takeScreenshot();
            if (img) { 
                pendingImage = img; 
                appendToChat('user', '[Screenshot Taken]', img); 
            }
        };
    }
    if (UI.btnClear) UI.btnClear.onclick = () => { if (UI.chatBox) UI.chatBox.innerHTML = ''; chatHistory = []; pendingImage = null; };
});