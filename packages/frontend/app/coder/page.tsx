'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function CoderPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('coding');
  const [selectedSource, setSelectedSource] = useState('mic');
  const [selectedVadMode, setSelectedVadMode] = useState<'server_vad' | 'manual'>('server_vad');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isRecording, setIsRecording] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  const log = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${message}\n`;
    if (logRef.current) {
      logRef.current.textContent += logLine;
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  const handleWebRTCMessage = useCallback(async (msg: any) => {
    if (msg.type === 'conversation.item.input_audio_transcription.completed') {
      const text = (msg.transcript || '').trim();
      if (text) {
        log(`🎤 Recognized: ${text}`);
        const now = new Date().toLocaleTimeString();
        setMessages((prev) => [...prev, { id: `${Date.now()}`, role: 'user', text, timestamp: now }]);
        
        // Use REST/LangGraph for long thought answers like legacy chat.php
        await getExpertResponse(text);
      }
    }
  }, [log]);

  const webrtc = useWebRTC(handleWebRTCMessage);

  // Language instructions (MANDATORY - controls all responses)
  const languageInstructions: Record<string, string> = {
    en: 'You are a senior coding expert. MUST respond ONLY in English. Help with code design, debugging, and best practices.',
    ru: 'Ты — старший эксперт по кодированию. ДОЛЖЕН отвечать ТОЛЬКО на русском. Помогай с проектированием кода, отладкой и лучшими практиками.',
    es: 'Eres un experto senior en codificación. DEBES responder ÚNICAMENTE en español. Ayuda con diseño de código, depuración y mejores prácticas.',
    fr: 'Vous êtes un expert senior en codage. DEVEZ répondre UNIQUEMENT en français. Aidez à la conception du code, au débogage et aux bonnes pratiques.',
  };

  // Persona instructions (SECONDARY - added after language)  
  const personaInstructions: Record<string, string> = {
    coding: 'You are a senior coding expert. Help with code design, debugging, and best practices.',
    architect: 'You are a system architect. Help with architecture decisions and design patterns.',
    default: 'You are a helpful programming assistant. Provide clear, concise solutions.',
  };

  const getExpertResponse = async (text: string) => {
    try {
      log('🧠 Expert is thinking...');
      const personaVal = selectedPersona;
      
      const res = await fetch('http://localhost:3002/api/agent/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: text,
          mode: personaVal === 'architect' ? 'architect' : 'code_expert',
          language: selectedLanguage,
        }),
      });

      if (!res.ok) throw new Error('Backend workflow failed');
      
      const data = await res.json();
      const answer = data.output || 'No response.';
      
      const now = new Date().toLocaleTimeString();
      setMessages((prev) => [...prev, { id: `${Date.now()}`, role: 'assistant', text: answer, timestamp: now }]);
      log('✓ Expert responded');
    } catch (e) {
      log(`❌ Expert error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // Visualize audio levels
  const setupVolumeVisualizer = useCallback((stream: MediaStream) => {
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }

      const ctx = audioContextRef.current!;

      if (!analyzerRef.current) {
        analyzerRef.current = ctx.createAnalyser();
        const sourceNode = ctx.createMediaStreamSource(stream);
        sourceNode.connect(analyzerRef.current);
      }

      const analyzer = analyzerRef.current;
      analyzer.fftSize = 256;
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const animate = () => {
        analyzer.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const percentage = (average / 255) * 100;

        if (volumeBarRef.current) {
          volumeBarRef.current.style.width = Math.min(percentage, 100) + '%';
        }

        requestAnimationFrame(animate);
      };

      animate();
    } catch (e) {
      log('⚠️ Volume visualizer setup failed');
    }
  }, [log]);

  // Handle Connect
  const handleConnect = useCallback(async () => {
    try {
      log('📍 Getting ephemeral token...');

      // Use the proxy route
      const tokenRes = await fetch('/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-realtime-preview' }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token error: ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.value || tokenData.ephemeralKey;

      if (!ephemeralKey) {
        throw new Error('No ephemeral key');
      }

      log('✓ Token obtained');

      // Handle audio source BEFORE connecting (System Audio requires getDisplayMedia)
      if (selectedSource === 'system') {
        try {
          log('🔊 Requesting System Audio access...');
          const displayStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          
          // Extract only audio track
          const audioTracks = displayStream.getAudioTracks();
          if (audioTracks.length === 0) {
            throw new Error('System audio not available in this browser');
          }
          
          // Stop video tracks - we only need audio
          displayStream.getVideoTracks().forEach(track => track.stop());
          
          // Create audio-only stream
          const audioStream = new MediaStream(audioTracks);
          
          // Pass to WebRTC via custom method later - for now log it
          log('✓ System Audio captured');
        } catch (e) {
          if (e instanceof DOMException && e.name === 'NotAllowedError') {
            log('⚠️ System Audio permission denied - falling back to Microphone');
            setSelectedSource('mic'); // Use setter instead of direct assignment
          } else {
            throw e;
          }
        }
      }

      // MANDATORY language instruction + persona + silent mode
      const languageBase = languageInstructions[selectedLanguage] || languageInstructions['en'];
      const personaBase = personaInstructions[selectedPersona] || personaInstructions['default'];
      const instructions = `${languageBase}\n${personaBase}\nAlways respond in text format only. Do not attempt voice responses.`;

      await webrtc.connect(
        ephemeralKey,
        'gpt-4o-realtime-preview',
        instructions,
        selectedVadMode
      );

      log(`✓ Connected (Expert: ${selectedPersona}, Lang: ${selectedLanguage.toUpperCase()})`);

      if (webrtc.localStream) {
        setupVolumeVisualizer(webrtc.localStream);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`❌ Connection error: ${msg}`);
    }
  }, [selectedPersona, selectedLanguage, selectedVadMode, webrtc, log, setupVolumeVisualizer]);

  // Handle Disconnect
  const handleDisconnect = useCallback(async () => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      analyzerRef.current = null;
    }

    await webrtc.disconnect();
    log('✓ Disconnected');
  }, [webrtc, log]);

  // Handle Talk Button
  const handleTalkMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    if (selectedVadMode !== 'manual') {
      log('⚠️ Talk button only in Manual mode');
      return;
    }

    if (!webrtc.state.isConnected) {
      log('⚠️ Not connected');
      return;
    }

    setIsRecording(true);
    webrtc.setMicEnabled(true);
    log('🎤 Talk pressed');
  }, [selectedVadMode, webrtc, log]);

  const handleTalkMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    if (!isRecording) return;

    setIsRecording(false);
    webrtc.setMicEnabled(false);
    log('📤 Talk released');

    setTimeout(() => {
      log('💾 Committing audio...');
      webrtc.sendEvent({ type: 'input_audio_buffer.commit' });

      setTimeout(() => {
        log('🤖 Requesting response...');
        webrtc.sendEvent({ type: 'response.create' });
      }, 200);
    }, 200);
  }, [isRecording, webrtc, log]);

  // Handle Send Text
  const handleSendText = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    const text = textInput.trim();
    if (!text) return;

    if (!webrtc.state.isConnected) {
      log('⚠️ Not connected');
      return;
    }

    webrtc.sendAudioText(text);

    const now = new Date().toLocaleTimeString();
    const newMsg: ChatMessage = {
      id: `${Date.now()}`,
      role: 'user',
      text,
      timestamp: now,
    };

    setMessages((prev) => [...prev, newMsg]);
    setTextInput('');
  }, [textInput, webrtc, log]);

  // Handle Screenshot
  const handleScreenshot = useCallback(async () => {
    try {
      log('📸 Capturing screen...');
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const video = document.createElement('video');
      video.srcObject = new MediaStream([track]);
      
      await new Promise((r) => (video.onloadedmetadata = r));
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(video, 0, 0);
      
      const img = canvas.toDataURL('image/jpeg', 0.8);
      track.stop();
      stream.getTracks().forEach((t) => t.stop());

      log('✓ Screenshot captured');

      // We send this as context to the AI (text representation as per legacy)
      const text = 'I have shared my screen with you. Please analyze it.';
      webrtc.sendAudioText(text);

      const now = new Date().toLocaleTimeString();
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, role: 'user', text: `[Screenshot Shared] ${text}`, timestamp: now },
      ]);
    } catch (error) {
      log(`❌ Screenshot error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }, [webrtc, log]);

  // Handle Clear
  const handleClear = useCallback(() => {
    setMessages([]);
    if (logRef.current) logRef.current.textContent = '';
    log('Chat cleared');
  }, [log]);

  // Handle Persona Change
  const handlePersonaChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPersona = e.target.value;
    setSelectedPersona(newPersona);
    log(`👨‍💼 Role changed to: ${newPersona}`);

    if (webrtc.state.isConnected) {
      const instructions = personaInstructions[newPersona] || personaInstructions['default'];

      log('🛑 Cancelling response...');
      webrtc.sendEvent({ type: 'response.cancel' });

      setTimeout(() => {
        webrtc.sendEvent({
          type: 'session.update',
          session: {
            modalities: ['text'],
            instructions: 'Silent transcription mode. Do not speak. Only provide text transcription events.',
            voice: 'alloy',
            turn_detection: selectedVadMode === 'server_vad' ? { type: 'server_vad' } : null,
          },
        });
        log('✓ Role updated');
      }, 100);
    }
  }, [webrtc, selectedVadMode, log]);

  // Handle VAD Mode Change
  const handleVadModeChange = useCallback((newMode: 'server_vad' | 'manual') => {
    setSelectedVadMode(newMode);
    log(`🔄 Mode: ${newMode === 'server_vad' ? 'AUTO' : 'MANUAL'}`);

    if (webrtc.state.isConnected) {
      if (newMode === 'server_vad') {
        webrtc.setMicEnabled(true);
      } else {
        webrtc.setMicEnabled(false);
      }

      webrtc.sendEvent({
        type: 'session.update',
        session: {
          modalities: ['text'],
          instructions: 'Silent transcription mode. Do not speak. Only provide text transcription events.',
          voice: 'alloy',
          turn_detection: newMode === 'server_vad' ? { type: 'server_vad' } : null,
        },
      });

      log('✓ Session updated');
    }
  }, [selectedPersona, webrtc, log]);

  const getStatusColor = () => {
    if (webrtc.state.status === 'connected') return 'success';
    if (webrtc.state.status === 'connecting') return 'warning';
    if (webrtc.state.status === 'error') return 'danger';
    return 'secondary';
  };

  const getStatusText = () => {
    const statusMap: Record<string, string> = {
      idle: 'Idle',
      connecting: 'Connecting...',
      connected: webrtc.micEnabled ? 'Listening 🔊' : 'Muted 🔇',
      disconnecting: 'Disconnecting...',
      error: 'Error',
    };
    return statusMap[webrtc.state.status] || 'Unknown';
  };

  return (
    <div style={{ background: '#0b1220', color: '#e5e7eb', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>
            Coder Expert <span style={{ color: '#9ca3af' }}>(Realtime WebRTC)</span>
          </h1>
          <span
            style={{
              background:
                getStatusColor() === 'success'
                  ? '#10b981'
                  : getStatusColor() === 'warning'
                    ? '#f59e0b'
                    : getStatusColor() === 'danger'
                      ? '#ef4444'
                      : '#6b7280',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '0.25rem',
              fontSize: '0.875rem',
              fontWeight: 'bold',
            }}
          >
            {getStatusText()}
          </span>
        </div>

        {/* Controls */}
        <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
            <button
              onClick={handleConnect}
              disabled={webrtc.state.isConnecting || webrtc.state.isConnected}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                opacity: webrtc.state.isConnecting || webrtc.state.isConnected ? 0.5 : 1,
              }}
            >
              Connect
            </button>

            <button
              onClick={handleDisconnect}
              disabled={!webrtc.state.isConnected}
              style={{
                padding: '0.5rem 1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                opacity: !webrtc.state.isConnected ? 0.5 : 1,
              }}
            >
              Disconnect
            </button>

            {/* Expert Role */}
            <select
              value={selectedPersona}
              onChange={handlePersonaChange}
              disabled={webrtc.state.isConnected}
              style={{
                padding: '0.5rem',
                background: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                opacity: webrtc.state.isConnected ? 0.5 : 1,
              }}
            >
              <option value="coding">👨‍💻 Senior Coder</option>
              <option value="architect">🏗️ Architect</option>
              <option value="default">🤖 General</option>
            </select>

            {/* Language (MANDATORY - controls all responses) */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              disabled={webrtc.state.isConnected}
              style={{
                padding: '0.5rem',
                background: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                opacity: webrtc.state.isConnected ? 0.5 : 1,
              }}
            >
              <option value="en">🇺🇸 English</option>
              <option value="ru">🇷🇺 Русский</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
            </select>

            {/* Audio Source */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              disabled={webrtc.state.isConnected}
              style={{
                padding: '0.5rem',
                background: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                opacity: webrtc.state.isConnected ? 0.5 : 1,
              }}
            >
              <option value="mic">🎤 Microphone</option>
              <option value="system">🔊 System Audio</option>
            </select>

            {/* VAD Mode */}
            <select
              value={selectedVadMode}
              onChange={(e) => handleVadModeChange(e.target.value as 'server_vad' | 'manual')}
              style={{
                padding: '0.5rem',
                background: '#1f2937',
                color: '#e5e7eb',
                border: '1px solid #374151',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              <option value="server_vad">Auto (VAD)</option>
              <option value="manual">Manual (Talk)</option>
            </select>

            {/* Talk Button */}
            <button
              disabled={!webrtc.state.isConnected || selectedVadMode !== 'manual'}
              style={{
                padding: '0.5rem 1rem',
                background: isRecording ? '#ef4444' : '#f87171',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: webrtc.state.isConnected && selectedVadMode === 'manual' ? 'pointer' : 'not-allowed',
                opacity: !webrtc.state.isConnected || selectedVadMode !== 'manual' ? 0.5 : 1,
                userSelect: 'none',
              }}
              onMouseDown={handleTalkMouseDown}
              onMouseUp={handleTalkMouseUp}
              onMouseLeave={handleTalkMouseUp}
            >
              {isRecording ? '🔴 Recording...' : '🎤 Talk'}
            </button>

            {/* Screenshot */}
            <button
              onClick={handleScreenshot}
              disabled={!webrtc.state.isConnected}
              title="Request screenshot analysis"
              style={{
                padding: '0.5rem 1rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                opacity: !webrtc.state.isConnected ? 0.5 : 1,
              }}
            >
              📸
            </button>

            <button
              onClick={handleClear}
              style={{
                padding: '0.5rem 1rem',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>

            <Link
              href="/chat"
              style={{
                padding: '0.5rem 1rem',
                background: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '0.25rem',
              }}
            >
              Back to Chat
            </Link>
          </div>

          {/* Volume Visualizer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
            <span>Audio Level:</span>
            <div style={{ width: '150px', height: '8px', background: '#1f2937', borderRadius: '4px', overflow: 'hidden' }}>
              <div ref={volumeBarRef} style={{ width: '0%', height: '100%', background: '#10b981', transition: 'width 0.05s' }} />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No messages yet</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} style={{ marginBottom: '0.75rem', padding: '0.5rem', background: msg.role === 'user' ? '#1f2937' : '#374151', borderRadius: '0.25rem' }}>
                <div style={{ color: msg.role === 'user' ? '#60a5fa' : '#a7f3d0', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {msg.role === 'user' ? '👤 You' : '🤖 Expert'} · {msg.timestamp}
                </div>
                <div>{msg.text}</div>
              </div>
            ))
          )}
        </div>

        {/* Text Input */}
        <form onSubmit={handleSendText} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Ask coding questions..."
            disabled={!webrtc.state.isConnected}
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#1f2937',
              color: '#e5e7eb',
              border: '1px solid #374151',
              borderRadius: '0.25rem',
              opacity: !webrtc.state.isConnected ? 0.5 : 1,
            }}
          />
          <button
            type="submit"
            disabled={!webrtc.state.isConnected}
            style={{
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              opacity: !webrtc.state.isConnected ? 0.5 : 1,
            }}
          >
            Send
          </button>
        </form>

        {/* Log */}
        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}>Technical Event Log</summary>
          <pre ref={logRef} style={{ background: '#050a14', border: '1px solid #1f2937', padding: '0.75rem', borderRadius: '0.5rem', maxHeight: '200px', overflow: 'auto', color: '#a7f3d0', fontSize: '0.75rem', margin: '0.5rem 0 0 0', fontFamily: 'monospace' }} />
        </details>
      </div>
    </div>
  );
}
