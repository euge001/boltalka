/**
 * tests/setup.js
 * Jest setup and global mocks
 */

// Import jest-dom matchers using require
require('@testing-library/jest-dom');

// Define default config
const defaultConfig = {
  realtime_model: 'gpt-4o-mini-realtime-preview',
  boltalka_instructions: 'You are a helpful assistant.',
  language: 'en',
  supported_languages: ['en', 'ru'],
  supported_models: ['gpt-4o-mini-realtime-preview'],
  experts: {
    coding: { model: 'gpt-4o', instructions: 'Senior Code Expert' },
    architect: { model: 'gpt-4o', instructions: 'System Architect' },
    default: { model: 'gpt-4o', instructions: 'General Assistant' }
  }
};

// Mock ConfigService globally before tests run
global.ConfigService = {
  getConfig: jest.fn(() => Promise.resolve(defaultConfig)),
  getDefaults: jest.fn(() => defaultConfig),
  setModel: jest.fn(() => Promise.resolve(true)),
  setLanguage: jest.fn(() => Promise.resolve(true)),
  getExpertInstructions: jest.fn(() => Promise.resolve('Expert instruction')),
  getExpertConfig: jest.fn(() => Promise.resolve({})),
  getAvailableExperts: jest.fn(() => Promise.resolve(Object.keys(defaultConfig.experts))),
  setInstructions: jest.fn(() => Promise.resolve()),
  invalidateCache: jest.fn(),
  getCurrentConfig: jest.fn(() => Promise.resolve(defaultConfig)),
  getAvailableLanguages: jest.fn(() => Promise.resolve(defaultConfig.supported_languages)),
  getAvailableModels: jest.fn(() => Promise.resolve(defaultConfig.supported_models))
};

// Mock fetch for tests
global.fetch = jest.fn();

// Mock navigator.mediaDevices
if (!global.navigator) {
  global.navigator = {};
}
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(),
  getDisplayMedia: jest.fn()
};

// Mock RTCPeerConnection
global.RTCPeerConnection = jest.fn();

// Mock WebRTC classes
global.RTCSessionDescription = jest.fn();
global.RTCIceCandidate = jest.fn();

// Setup DOM elements
document.body.innerHTML = `
  <div id="status" class="badge text-bg-secondary"></div>
  <pre id="log"></pre>
  <audio id="remoteAudio"></audio>
  <button id="btnConnect">Connect</button>
  <button id="btnDisconnect" disabled>Disconnect</button>
  <button id="btnClear">Clear</button>
  <button id="btnSend" disabled>Send</button>
  <button id="btnVAD">VAD</button>
  <button id="btnMute" disabled>Mute</button>
  <input id="txt" type="text">
  <div id="vadMenu" class="dropdown-menu">
    <a class="dropdown-item active" data-vad="server_vad">Auto (VAD)</a>
    <a class="dropdown-item" data-vad="manual">Manual (Push-to-Talk)</a>
  </div>
`;

// Clear all mocks and reset DOM before each test
beforeEach(() => {
  // Clear mock call history only, don't reset implementations
  Object.keys(global.ConfigService).forEach(key => {
    if (typeof global.ConfigService[key].mockClear === 'function') {
      global.ConfigService[key].mockClear();
    }
  });
  
  global.fetch.mockClear();
  
  // Clear log
  const logEl = document.getElementById('log');
  if (logEl) logEl.textContent = '';
});
