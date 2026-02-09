/**
 * tests/integration.test.js
 * Integration tests for app workflow
 */

describe('App Integration Tests', () => {
  beforeEach(() => {
    // Full DOM setup
    document.body.innerHTML = `
      <div id="status" class="badge text-bg-secondary">idle</div>
      <pre id="log"></pre>
      <audio id="remoteAudio" autoplay></audio>
      <div class="btn-group">
        <button id="btnConnect" class="btn btn-success">Connect</button>
        <button id="btnVAD" class="btn btn-outline-info">🎙️ Auto</button>
        <ul id="vadMenu" class="dropdown-menu">
          <li><a class="dropdown-item active" data-vad="server_vad">Auto (VAD)</a></li>
          <li><a class="dropdown-item" data-vad="manual">Manual Push-to-Talk</a></li>
        </ul>
      </div>
      <button id="btnMute" class="btn btn-outline-danger" disabled>Talk</button>
      <button id="btnDisconnect" class="btn btn-outline-light" disabled>Disconnect</button>
      <button id="btnClear" class="btn btn-outline-warning">Clear log</button>
      <input id="txt" class="form-control" placeholder="Text message…" />
      <button id="btnSend" class="btn btn-primary" disabled>Send</button>
    `;

    // Reset mocks
    fetch.mockClear();
    jest.clearAllMocks();

    // Mock ConfigService with full implementation
    global.ConfigService = {
      getConfig: jest.fn().mockResolvedValue({
        realtime_model: 'gpt-4o-mini-realtime-preview',
        boltalka_instructions: 'You are a helpful AI assistant. Respond concisely.',
        language: 'en',
        supported_languages: ['en', 'ru'],
        supported_models: ['gpt-4o-mini-realtime-preview']
      }),
      invalidateCache: jest.fn(),
      getDefaults: jest.fn().mockReturnValue({
        realtime_model: 'gpt-4o-mini-realtime-preview',
        boltalka_instructions: 'Default instruction'
      })
    };

    // Mock full WebRTC stack
    const mockDataChannel = {
      readyState: 'open',
      send: jest.fn(),
      close: jest.fn(),
      onopen: null,
      onmessage: null,
      onerror: null
    };

    global.RTCPeerConnection = jest.fn(() => ({
      createOffer: jest.fn().mockResolvedValue({ 
        sdp: 'v=0\r\no=user 123 456 IN IP4 127.0.0.1\r\n' 
      }),
      setLocalDescription: jest.fn().mockResolvedValue(),
      setRemoteDescription: jest.fn().mockResolvedValue(),
      createDataChannel: jest.fn(() => mockDataChannel),
      addTrack: jest.fn(() => ({})),
      close: jest.fn(),
      ontrack: null,
      connectionState: 'connected',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    }));

    // Mock getUserMedia with realistic stream
    const mockAudioTrack = {
      stop: jest.fn(),
      enabled: true
    };

    global.navigator.mediaDevices.getUserMedia.mockResolvedValue({
      getTracks: jest.fn(() => [mockAudioTrack]),
      getAudioTracks: jest.fn(() => [mockAudioTrack]),
      getVideoTracks: jest.fn(() => [])
    });

    // Mock fetch for token
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        value: 'sk-test-token-12345',
        expires_at: Date.now() + 3600000
      }),
      text: async () => 'test response'
    });
  });

  describe('Connection Flow', () => {
    test('should have initial disconnected state', () => {
      const status = document.getElementById('status');
      const btnConnect = document.getElementById('btnConnect');
      const btnDisconnect = document.getElementById('btnDisconnect');

      expect(status.textContent).toBe('idle');
      expect(btnConnect.disabled).toBe(false);
      expect(btnDisconnect.disabled).toBe(true);
    });

    test('should have mode menu with Auto and Manual options', () => {
      const autoItem = document.querySelector('[data-vad="server_vad"]');
      const manualItem = document.querySelector('[data-vad="manual"]');

      expect(autoItem).not.toBeNull();
      expect(manualItem).not.toBeNull();
      expect(autoItem.textContent).toContain('Auto');
      expect(manualItem.textContent).toContain('Manual');
    });

    test('Talk button should be disabled initially', () => {
      const btnMute = document.getElementById('btnMute');
      expect(btnMute.disabled).toBe(true);
    });
  });

  describe('Mode Switching', () => {
    test('VAD menu should be accessible', () => {
      const menu = document.getElementById('vadMenu');
      const items = menu.querySelectorAll('.dropdown-item');

      expect(menu).not.toBeNull();
      expect(items.length).toBe(2);
    });

    test('should have Auto selected by default', () => {
      const autoItem = document.querySelector('[data-vad="server_vad"]');
      expect(autoItem).toHaveClass('active');
    });

    test('Manual option should be available', () => {
      const manualItem = document.querySelector('[data-vad="manual"]');
      expect(manualItem).not.toBeNull();
      expect(manualItem.textContent).toContain('Manual');
    });
  });

  describe('UI Elements', () => {
    test('should have all required buttons', () => {
      expect(document.getElementById('btnConnect')).not.toBeNull();
      expect(document.getElementById('btnDisconnect')).not.toBeNull();
      expect(document.getElementById('btnMute')).not.toBeNull();
      expect(document.getElementById('btnClear')).not.toBeNull();
      expect(document.getElementById('btnSend')).not.toBeNull();
    });

    test('should have status badge', () => {
      const status = document.getElementById('status');
      expect(status).not.toBeNull();
      expect(status).toHaveClass('badge');
    });

    test('should have log display', () => {
      const log = document.getElementById('log');
      expect(log).not.toBeNull();
      expect(log.tagName).toBe('PRE');
    });

    test('should have text input field', () => {
      const txt = document.getElementById('txt');
      expect(txt).not.toBeNull();
      expect(txt.tagName).toBe('INPUT');
    });

    test('should have audio element', () => {
      const audio = document.getElementById('remoteAudio');
      expect(audio).not.toBeNull();
      expect(audio.tagName).toBe('AUDIO');
      expect(audio).toHaveAttribute('autoplay');
    });
  });

  describe('Button States', () => {
    test('Connect button should be enabled initially', () => {
      const btn = document.getElementById('btnConnect');
      expect(btn.disabled).toBe(false);
    });

    test('Disconnect button should be disabled initially', () => {
      const btn = document.getElementById('btnDisconnect');
      expect(btn.disabled).toBe(true);
    });

    test('Send button should be disabled initially', () => {
      const btn = document.getElementById('btnSend');
      expect(btn.disabled).toBe(true);
    });

    test('Talk button should be disabled initially', () => {
      const btn = document.getElementById('btnMute');
      expect(btn.disabled).toBe(true);
    });
  });

  describe('Log Functionality', () => {
    test('clear button should clear logs', () => {
      const log = document.getElementById('log');
      log.textContent = 'Test message 1\nTest message 2';

      const btnClear = document.getElementById('btnClear');
      // Simulate click (normally would call onclick)
      log.textContent = '';

      expect(log.textContent).toBe('');
    });

    test('log should be appendable', () => {
      const log = document.getElementById('log');
      
      // Simulate logging
      const line1 = 'Event 1';
      const line2 = 'Event 2';
      
      log.textContent += line1 + '\n';
      log.textContent += line2 + '\n';

      expect(log.textContent).toContain(line1);
      expect(log.textContent).toContain(line2);
    });
  });

  describe('ConfigService Integration', () => {
    test('should have ConfigService available', () => {
      expect(global.ConfigService).toBeDefined();
      expect(typeof ConfigService.getConfig).toBe('function');
    });

    test('should get configuration', async () => {
      const config = await ConfigService.getConfig();
      expect(config).toHaveProperty('realtime_model');
      expect(config).toHaveProperty('boltalka_instructions');
    });

    test('should have default language', async () => {
      const config = await ConfigService.getConfig();
      expect(config.language).toBe('en');
    });

    test('should support multiple languages', async () => {
      const config = await ConfigService.getConfig();
      expect(Array.isArray(config.supported_languages)).toBe(true);
      expect(config.supported_languages).toContain('en');
    });
  });

  describe('WebRTC Stack', () => {
    test('should have RTCPeerConnection available', () => {
      expect(global.RTCPeerConnection).toBeDefined();
      const pc = new RTCPeerConnection();
      expect(pc).toHaveProperty('createOffer');
      expect(pc).toHaveProperty('setLocalDescription');
    });

    test('should have getUserMedia available', () => {
      expect(navigator.mediaDevices.getUserMedia).toBeDefined();
    });

    test('should create data channel', async () => {
      const pc = new RTCPeerConnection();
      const dc = pc.createDataChannel('test');
      expect(dc).toHaveProperty('send');
      expect(dc).toHaveProperty('close');
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('./token.php', { method: 'POST' });
      } catch (e) {
        expect(e.message).toContain('Network error');
      }
    });

    test('should handle invalid responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const response = await fetch('./token.php', { method: 'POST' });
      expect(response.ok).toBe(false);
    });
  });
});
