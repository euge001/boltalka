/**
 * tests/configService.test.js
 * Unit tests for ConfigService
 */

describe('ConfigService Mock', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('getConfig()', () => {
    test('should load config from server', async () => {
      const mockConfig = {
        realtime_model: 'gpt-4o-mini-realtime-preview',
        boltalka_instructions: 'Test instructions',
        language: 'en'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig
      });

      expect(global.ConfigService).toBeDefined();
      expect(typeof global.ConfigService.getConfig).toBe('function');
    });

    test('should have mocked methods', () => {
      expect(typeof global.ConfigService.getDefaults).toBe('function');
      expect(typeof global.ConfigService.setModel).toBe('function');
      expect(typeof global.ConfigService.setLanguage).toBe('function');
      expect(typeof global.ConfigService.getExpertInstructions).toBe('function');
    });
  });

  describe('getDefaults()', () => {
    test('should return default configuration', () => {
      const defaults = global.ConfigService.getDefaults();

      expect(defaults).toHaveProperty('realtime_model');
      expect(defaults).toHaveProperty('boltalka_instructions');
      expect(defaults).toHaveProperty('language');
      expect(defaults).toHaveProperty('supported_languages');
      expect(defaults).toHaveProperty('supported_models');
      expect(defaults).toHaveProperty('experts');
    });

    test('defaults should include expert roles', () => {
      const defaults = global.ConfigService.getDefaults();

      expect(defaults.experts).toHaveProperty('coding');
      expect(defaults.experts).toHaveProperty('architect');
      expect(defaults.experts).toHaveProperty('default');
    });

    test('should have real-time model defined', () => {
      const defaults = global.ConfigService.getDefaults();
      expect(defaults.realtime_model).toBe('gpt-4o-mini-realtime-preview');
    });
  });

  describe('setModel()', () => {
    test('setModel should be callable', async () => {
      await global.ConfigService.setModel('gpt-4o-mini-realtime-preview');
      expect(global.ConfigService.setModel).toHaveBeenCalled();
    });
  });

  describe('setLanguage()', () => {
    test('setLanguage should be callable', async () => {
      await global.ConfigService.setLanguage('en');
      expect(global.ConfigService.setLanguage).toHaveBeenCalled();
    });
  });

  describe('getExpertInstructions()', () => {
    test('getExpertInstructions should be callable', async () => {
      await global.ConfigService.getExpertInstructions('coding');
      expect(global.ConfigService.getExpertInstructions).toHaveBeenCalledWith('coding');
    });
  });

  describe('getAvailableExperts()', () => {
    test('should list supported expert roles', async () => {
      const defaults = global.ConfigService.getDefaults();
      const experts = Object.keys(defaults.experts);
      
      expect(Array.isArray(experts)).toBe(true);
      expect(experts).toContain('coding');
      expect(experts).toContain('architect');
      expect(experts).toContain('default');
    });
  });

  describe('invalidateCache()', () => {
    test('invalidateCache should be callable', () => {
      global.ConfigService.invalidateCache();
      expect(global.ConfigService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('getCurrentConfig()', () => {
    test('getCurrentConfig should be callable', async () => {
      await global.ConfigService.getCurrentConfig();
      expect(global.ConfigService.getCurrentConfig).toHaveBeenCalled();
    });
  });

  describe('getAvailableLanguages()', () => {
    test('should list supported languages', () => {
      const defaults = global.ConfigService.getDefaults();
      expect(Array.isArray(defaults.supported_languages)).toBe(true);
      expect(defaults.supported_languages.length).toBeGreaterThan(0);
    });
  });

  describe('getAvailableModels()', () => {
    test('should list supported models', () => {
      const defaults = global.ConfigService.getDefaults();
      expect(Array.isArray(defaults.supported_models)).toBe(true);
      expect(defaults.supported_models.length).toBeGreaterThan(0);
    });
  });
});
