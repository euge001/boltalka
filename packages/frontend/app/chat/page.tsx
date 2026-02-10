'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function ChatPage() {
  const webrtc = useWebRTC();
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('ru');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-realtime-preview');
  const [vadMode, setVadMode] = useState<'server_vad' | 'manual'>('server_vad');
  const [isRecording, setIsRecording] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  // Language instructions mapping
  const languageInstructions: Record<string, string> = {
    en: 'You are a helpful AI assistant. You MUST respond ONLY in English. Use clear and concise language.',
    ru: 'Ты — полезный ИИ-ассистент. Ты ДОЛЖЕН отвечать ТОЛЬКО на русском языке. Твои ответы должны быть краткими и понятными.',
    es: 'Eres un asistente de IA útil. DEBES responder ÚNICAMENTE en español. Tus respuestas deben быть concisas y claras.',
    fr: 'Vous êtes un assistant IA utile. Vous DEVEZ répondre UNIQUEMENT en français. Vos réponses doivent être concises et claires.',
  };

  const log = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logLine = `[${timestamp}] ${message}\n`;
    if (logRef.current) {
      logRef.current.textContent += logLine;
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, []);

  // Handle Connect
  const handleConnect = useCallback(async () => {
    try {
      log('📍 Getting ephemeral token...');
      
      // Get token from backend (direct call with open CORS)
      const tokenRes = await fetch('http://localhost:3002/api/agent/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: selectedModel }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Token server error: ${tokenRes.status}`);
      }

      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.value || tokenData.ephemeralKey;
      
      if (!ephemeralKey) {
        throw new Error('No ephemeral key in response');
      }

      log(`✓ Token obtained (${ephemeralKey.substring(0, 10)}...)`);

      const instructions = languageInstructions[selectedLanguage] || languageInstructions['en'];

      await webrtc.connect(
        ephemeralKey,
        selectedModel,
        instructions,
        vadMode
      );

      log(`✓ Connected (VAD: ${vadMode === 'server_vad' ? 'AUTO' : 'MANUAL'})`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      log(`❌ Connection error: ${msg}`);
    }
  }, [selectedLanguage, selectedModel, vadMode, webrtc, log]);

  // Handle Disconnect
  const handleDisconnect = useCallback(async () => {
    await webrtc.disconnect();
    log('✓ Disconnected');
  }, [webrtc, log]);

  // Handle Talk Button (MANUAL mode only)
  const handleTalkMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (vadMode !== 'manual') {
      log('⚠️ Talk button only works in Manual mode');
      return;
    }

    if (!webrtc.state.isConnected) {
      log('⚠️ Not connected');
      return;
    }

    setIsRecording(true);
    webrtc.setMicEnabled(true);
    log('🎤 Talk pressed - recording...');
  }, [vadMode, webrtc, log]);

  const handleTalkMouseUp = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isRecording) return;

    setIsRecording(false);
    webrtc.setMicEnabled(false);
    log('📤 Talk released - sending audio');

    // Commit audio with delays per legacy
    setTimeout(() => {
      log('💾 Committing audio buffer...');
      webrtc.sendEvent({ type: 'input_audio_buffer.commit' });

      setTimeout(() => {
        log('🤖 Requesting AI response...');
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
    
    // Add to message history for display
    const now = new Date().toLocaleTimeString();
    setMessages((prev) => [...prev, { role: 'user', text, timestamp: now }]);
    setTextInput('');
  }, [textInput, webrtc, log]);

  // Handle Language Change
  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    log(`🌍 Language changed to: ${newLang}`);

    // Update session if connected
    if (webrtc.state.isConnected) {
      const instructions = languageInstructions[newLang] || languageInstructions['en'];
      
      log(`🛑 Switching language to ${newLang.toUpperCase()}...`);
      webrtc.sendEvent({ type: 'response.cancel' });

      // Immediate update for better reactivity
      webrtc.sendEvent({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions,
          voice: 'alloy',
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: vadMode === 'server_vad' ? { type: 'server_vad' } : null,
        },
      });
      
      // Request initial greeting in new language
      setTimeout(() => {
        webrtc.sendEvent({
          type: 'response.create',
          response: {
            instructions: `Greet the user briefly in ${newLang === 'ru' ? 'Russian' : newLang === 'en' ? 'English' : newLang}.`
          }
        });
        log(`✓ Session updated to ${newLang.toUpperCase()}`);
      }, 300);
    }
  }, [webrtc, vadMode, log]);

  // Handle Model Change
  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setSelectedModel(newModel);
    log(`🤖 Model changed to: ${newModel}`);

    if (webrtc.state.isConnected) {
      log('ℹ️ Disconnect and reconnect to use new model');
    }
  }, [webrtc, log]);

  // Handle VAD Mode Change
  const handleVadModeChange = useCallback((newMode: 'server_vad' | 'manual') => {
    setVadMode(newMode);
    log(`🔄 Switching to ${newMode === 'server_vad' ? 'AUTO (VAD)' : 'MANUAL (Push-to-Talk)'}`);

    if (webrtc.state.isConnected) {
      log('📝 Updating session...');

      if (newMode === 'server_vad') {
        webrtc.setMicEnabled(true);
      } else {
        webrtc.setMicEnabled(false);
      }

      webrtc.sendEvent({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: languageInstructions[selectedLanguage],
          voice: 'alloy',
          input_audio_transcription: { model: 'whisper-1' },
          turn_detection: newMode === 'server_vad' ? { type: 'server_vad' } : null,
        },
      });

      log('✓ Session updated');
    }
  }, [selectedLanguage, webrtc, log]);

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
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>
            Voice Bot <span style={{ color: '#9ca3af' }}>(Realtime WebRTC)</span>
          </h1>
          <span
            style={{
              background: getStatusColor() === 'success' ? '#10b981' : getStatusColor() === 'warning' ? '#f59e0b' : getStatusColor() === 'danger' ? '#ef4444' : '#6b7280',
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

        <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem' }}>
            <button 
              onClick={handleConnect} 
              disabled={webrtc.state.isConnecting || webrtc.state.isConnected}
              style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: (webrtc.state.isConnecting || webrtc.state.isConnected) ? 0.5 : 1 }}
            >
              Connect
            </button>

            <button 
              onClick={handleDisconnect} 
              disabled={!webrtc.state.isConnected}
              style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: !webrtc.state.isConnected ? 0.5 : 1 }}
            >
              Disconnect
            </button>

            {/* VAD Mode Dropdown */}
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <select 
                value={vadMode}
                onChange={(e) => handleVadModeChange(e.target.value as 'server_vad' | 'manual')}
                style={{ padding: '0.5rem', background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: '0.25rem', cursor: 'pointer' }}
              >
                <option value="server_vad">Auto (VAD)</option>
                <option value="manual">Manual (Talk)</option>
              </select>
            </div>

            {/* Talk Button (MANUAL mode only) */}
            <button
              disabled={!webrtc.state.isConnected || vadMode !== 'manual'}
              style={{
                padding: '0.5rem 1rem',
                background: isRecording ? '#ef4444' : '#f87171',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: webrtc.state.isConnected && vadMode === 'manual' ? 'pointer' : 'not-allowed',
                opacity: (!webrtc.state.isConnected || vadMode !== 'manual') ? 0.5 : 1,
                userSelect: 'none',
              }}
              onMouseDown={handleTalkMouseDown}
              onMouseUp={handleTalkMouseUp}
              onMouseLeave={handleTalkMouseUp}
            >
              {isRecording ? '🔴 Recording...' : '🎤 Talk'}
            </button>

            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              style={{ padding: '0.5rem', background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: '0.25rem', cursor: 'pointer' }}
            >
              <option value="en">🌍 English</option>
              <option value="ru">🇷🇺 Russian</option>
              <option value="es">🇪🇸 Español</option>
              <option value="fr">🇫🇷 Français</option>
            </select>

            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={handleModelChange}
              disabled={webrtc.state.isConnected}
              style={{ padding: '0.5rem', background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: '0.25rem', cursor: 'pointer', opacity: webrtc.state.isConnected ? 0.5 : 1 }}
            >
              <option value="gpt-4o-realtime-preview">⚡ GPT-4o Realtime</option>
              <option value="gpt-4o-mini-realtime-preview">🤖 GPT-4o Mini Realtime</option>
            </select>

            <button
              onClick={() => {
                if (logRef.current) logRef.current.textContent = '';
                setMessages([]);
              }}
              style={{ padding: '0.5rem 1rem', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }}
            >
              Clear
            </button>

            <Link href="/coder" style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', textDecoration: 'none', borderRadius: '0.25rem', display: 'inline-block', cursor: 'pointer' }}>
              Coder Expert
            </Link>
          </div>

          <div style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Voice-to-voice conversation. Select language and AI model.</div>
        </div>

        {/* Chat Area */}
        <div style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem 0' }}>No messages yet</div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '0.75rem', padding: '0.5rem', background: msg.role === 'user' ? '#1f2937' : '#374151', borderRadius: '0.25rem' }}>
                <div style={{ color: msg.role === 'user' ? '#60a5fa' : '#a7f3d0', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {msg.role === 'user' ? '👤 You' : '🤖 AI'} · {msg.timestamp}
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
            placeholder="Type text message (works when connected)..."
            disabled={!webrtc.state.isConnected}
            style={{ flex: 1, padding: '0.5rem', background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', borderRadius: '0.25rem', opacity: !webrtc.state.isConnected ? 0.5 : 1 }}
          />
          <button
            type="submit"
            disabled={!webrtc.state.isConnected}
            style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', opacity: !webrtc.state.isConnected ? 0.5 : 1 }}
          >
            Send
          </button>
        </form>

        {/* Event Log */}
        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#9ca3af', fontWeight: 'bold' }}>Technical Event Log (Debug)</summary>
          <pre ref={logRef} style={{ background: '#050a14', border: '1px solid #1f2937', padding: '0.75rem', borderRadius: '0.5rem', maxHeight: '200px', overflow: 'auto', color: '#a7f3d0', fontSize: '0.75rem', margin: '0.5rem 0 0 0', fontFamily: 'monospace' }} />
        </details>
      </div>
    </div>
  );
}
