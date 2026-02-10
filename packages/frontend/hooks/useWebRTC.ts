'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebRTCState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  status: 'idle' | 'connecting' | 'connected' | 'disconnecting' | 'error';
}

export interface WebRTCEvent {
  type: string;
  [key: string]: unknown;
}

export interface UseWebRTCReturn {
  state: WebRTCState;
  connect: (ephemeralKey: string, model: string, instructions: string, vadMode: 'server_vad' | 'manual') => Promise<void>;
  disconnect: () => Promise<void>;
  sendEvent: (event: WebRTCEvent) => void;
  sendAudioText: (text: string) => void;
  localStream: MediaStream | null;
  remoteAudio: HTMLAudioElement | null;
  micEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
}

export function useWebRTC(onMessage?: (event: any) => void): UseWebRTCReturn {
  const [state, setState] = useState<WebRTCState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    status: 'idle',
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [micEnabled, setMicEnabled] = useState(false);

  // Initialize remote audio element
  useEffect(() => {
    remoteAudioRef.current = new Audio();
    remoteAudioRef.current.autoplay = true;
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.pause();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  const log = useCallback((message: string, data?: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] WebRTC: ${message}`, data || '');
  }, []);

  const handleDataChannelMessage = useCallback((event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data);
      
      // Call external handler if provided
      if (onMessage) {
        onMessage(msg);
      }

      // Log important events
      if (msg.type === 'error') {
        log('❌ ERROR', msg.error);
      } else if (msg.type === 'response.done') {
        log(`📤 Response complete: ${msg.response?.status}`, msg.response);
        if (msg.response?.status === 'failed') {
          const errorDetail = msg.response.last_error || msg.response.status_details?.error || msg.response.status_details;
          log('❌ Response failure detail:', errorDetail);
          console.error('OpenAI Realtime Error:', errorDetail);
        }
      } else if (msg.type === 'conversation.item.input_audio_transcription.completed') {
        log(`🎤 You said: ${msg.transcript}`);
      } else if (msg.type === 'response.audio_transcription.done') {
        log(`🤖 AI said: ${msg.transcript}`);
      } else if (msg.type === 'input_audio_buffer.speech_started') {
        log('🔊 Speech detected');
      } else if (msg.type === 'input_audio_buffer.speech_stopped') {
        log('🔇 Speech ended');
      }
    } catch (e) {
      log('Failed to parse datachannel message', e);
    }
  }, [log, onMessage]);

  const sendEvent = useCallback((event: WebRTCEvent) => {
    if (!dcRef.current || dcRef.current.readyState !== 'open') {
      log('⚠️ DataChannel not open');
      return;
    }
    try {
      dcRef.current.send(JSON.stringify(event));
    } catch (e) {
      log('❌ Failed to send event', e);
    }
  }, [log]);

  const sendAudioText = useCallback((text: string) => {
    if (!text.trim()) return;
    
    sendEvent({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    
    sendEvent({ type: 'response.create' });
    log(`📨 Text sent: ${text}`);
  }, [sendEvent, log]);

  const connect = useCallback(
    async (
      ephemeralKey: string,
      model: string,
      instructions: string,
      vadMode: 'server_vad' | 'manual'
    ) => {
      try {
        setState((prev) => ({ ...prev, isConnecting: true, status: 'connecting', error: null }));
        log('🔗 Starting WebRTC connection...');

        // Create PeerConnection
        pcRef.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });

        // Handle remote track
        pcRef.current.ontrack = (event) => {
          log('✓ Remote audio track received');
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
          }
        };

        // Get audio stream based on source (mic or system audio)
        if (process.env.NODE_ENV === 'development' || true) {
          // Browser context - handle both mic and system audio
          if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
            try {
              // For now, default to microphone
              // System audio requires getDisplayMedia which is separate
              localStreamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                  echoCancellation: true,
                  noiseSuppression: true,
                },
              });
            } catch (e) {
              throw new Error('Microphone access denied');
            }
          }
        } else {
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
            },
          });
        }

        log('✓ Microphone access granted');

        // Add audio tracks
        localStreamRef.current!.getTracks().forEach((track) => {
          pcRef.current!.addTrack(track, localStreamRef.current!);
        });

        // Create data channel
        dcRef.current = pcRef.current.createDataChannel('oai-events');
        dcRef.current.onmessage = handleDataChannelMessage;

        dcRef.current.onopen = () => {
          log('✓ DataChannel open');
          
          // Set initial state
          const isManual = vadMode === 'manual';
          setMicEnabled(!isManual);
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach((t) => {
              t.enabled = !isManual;
            });
          }

          // Send session config
          const sessionConfig: any = {
            modalities: ['text'],
            instructions,
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: vadMode === 'server_vad' ? { type: 'server_vad' } : null,
          };

          sendEvent({
            type: 'session.update',
            session: sessionConfig,
          });

          setState((prev) => ({
            ...prev,
            isConnected: true,
            isConnecting: false,
            status: 'connected',
          }));
          log('✓ Connected and session configured');
        };

        // Create offer
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);

        log(`🔄 Exchanging SDP with OpenAI (model: ${model})...`);

        // Exchange SDP with OpenAI
        const sdpResponse = await fetch(
          `https://api.openai.com/v1/realtime?model=${model}`,
          {
            method: 'POST',
            body: offer.sdp,
            headers: {
              Authorization: `Bearer ${ephemeralKey}`,
              'Content-Type': 'application/sdp',
            },
          }
        );

        if (!sdpResponse.ok) {
          throw new Error(`SDP exchange failed: ${await sdpResponse.text()}`);
        }

        const answerSdp = await sdpResponse.text();
        await pcRef.current.setRemoteDescription({
          type: 'answer',
          sdp: answerSdp,
        });

        log('✓ WebRTC connection established');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        log('❌ Connection failed', error);
        setState((prev) => ({
          ...prev,
          error: errorMsg,
          isConnecting: false,
          status: 'error',
        }));
      }
    },
    [log, sendEvent]
  );

  const disconnect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, status: 'disconnecting' }));
      log('🔌 Disconnecting...');

      // Close tracks
      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      // Close channels
      dcRef.current?.close();
      pcRef.current?.close();

      localStreamRef.current = null;
      dcRef.current = null;
      pcRef.current = null;
      setMicEnabled(false);

      setState({
        isConnected: false,
        isConnecting: false,
        error: null,
        status: 'idle',
      });

      log('✓ Disconnected');
    } catch (error) {
      log('❌ Disconnect error', error);
    }
  }, [log]);

  return {
    state,
    connect,
    disconnect,
    sendEvent,
    sendAudioText,
    localStream: localStreamRef.current,
    remoteAudio: remoteAudioRef.current,
    micEnabled,
    setMicEnabled: (enabled: boolean) => {
      setMicEnabled(enabled);
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((t) => {
          t.enabled = enabled;
        });
      }
    },
  };
}
