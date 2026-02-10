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
  const webrtc = useWebRTC();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('coding');
  const [selectedSource, setSelectedSource] = useState('mic');
  const [selectedVadMode, setSelectedVadMode] = useState<'server_vad' | 'manual'>('server_vad');
  const [isRecording, setIsRecording] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  // Persona instructions
  const personaInstructions: Record<string, string> = {
    coding: 'You are a senior coding expert. Help with code design, debugging, and best practices.',
    architect: 'You are a system architect. Help with architecture decisions and design patterns.',
    default: 'You are a helpful programming assistant. Provide clear, concise solutions.',
  };

  const log = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${message}\n`;
    if (logRef.current) {
      logRef.current.textContent += logLine;
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

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

      const tokenRes = await fetch('/api/agent/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const instructions = personaInstructions[selectedPersona] || personaInstructions['default'];

      await webrtc.connect(
        ephemeralKey,
        'gpt-4o-mini-realtime-preview',
        instructions,
        selectedVadMode
      );

      log(`✓ Connected (Expert: ${selectedPersona}, Source: ${selectedSource})`);

      if (webrtc.localStream) {
        setupVolumeVisualizer(webrtc.localStream);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`❌ Connection error: ${msg}`);
    }
  }, [selectedPersona, selectedSource, selectedVadMode, webrtc, log, setupVolumeVisualizer]);

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
  const handleScreenshot = useCallback(() => {
    try {
      log('📸 Screenshot requested');

      const text = 'Please analyze the current screen context.';
      webrtc.sendAudioText(text);

      const now = new Date().toLocaleTimeString();
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}`, role: 'user', text, timestamp: now },
      ]);
    } catch (error) {
      log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
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
            modalities: ['text', 'audio'],
            instructions,
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
          modalities: ['text', 'audio'],
          instructions: personaInstructions[selectedPersona],
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
