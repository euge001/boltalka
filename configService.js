/**
 * ConfigService.js
 * Reusable configuration management service for model/language switching
 * 
 * Usage:
 *   const config = await ConfigService.getConfig();
 *   await ConfigService.setModel('gpt-4o-mini-realtime-preview');
 *   await ConfigService.setLanguage('en');
 *   const instructions = await ConfigService.getInstructions('expert_role');
 */

const ConfigService = (() => {
  let cachedConfig = null;
  let isLoading = false;
  let loadPromise = null;

  /**
   * Get current configuration from server
   * @returns {Promise<Object>} Configuration object
   */
  async function getConfig() {
    // Return cached config if available
    if (cachedConfig) {
      return cachedConfig;
    }

    // If loading is in progress, wait for it
    if (isLoading && loadPromise) {
      return loadPromise;
    }

    // Start new load
    isLoading = true;
    loadPromise = (async () => {
      try {
        const response = await fetch('config_js.php');
        if (!response.ok) {
          throw new Error(`Config fetch failed: ${response.status}`);
        }
        cachedConfig = await response.json();
        return cachedConfig;
      } catch (error) {
        console.error('ConfigService: Failed to load config', error);
        // Return sensible defaults if fetch fails
        return getDefaults();
      } finally {
        isLoading = false;
        loadPromise = null;
      }
    })();

    return loadPromise;
  }

  /**
   * Get default configuration (fallback)
   * @returns {Object} Default configuration
   */
  function getDefaults() {
    return {
      realtime_model: 'gpt-4o-mini-realtime-preview',
      boltalka_instructions: 'You are a helpful assistant. Respond thoughtfully and accurately.',
      language: 'en',
      supported_languages: ['en', 'ru', 'es', 'fr', 'de'],
      supported_models: ['gpt-4o-mini-realtime-preview', 'gpt-4o-realtime-preview'],
      experts: {
        coding: {
          model: 'gpt-4o',
          instructions: 'You are a Senior Coding Expert. Provide complete, production-ready code solutions with explanations.'
        },
        architect: {
          model: 'gpt-4o',
          instructions: 'You are a System Architect. Design scalable, robust solutions with clear architecture patterns.'
        },
        default: {
          model: 'gpt-4o',
          instructions: 'You are a helpful assistant. Respond thoughtfully and accurately.'
        }
      }
    };
  }

  /**
   * Set the active model
   * @param {string} modelName - Model identifier (e.g., 'gpt-4o-mini-realtime-preview')
   * @returns {Promise<boolean>} Success status
   */
  async function setModel(modelName) {
    const config = await getConfig();
    
    if (!config.supported_models || !config.supported_models.includes(modelName)) {
      console.warn(`ConfigService: Model "${modelName}" not supported`);
      return false;
    }

    config.realtime_model = modelName;
    cachedConfig = config;
    
    // Optionally persist to server
    try {
      await fetch('config_js.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ realtime_model: modelName })
      });
    } catch (e) {
      console.warn('ConfigService: Could not persist model change to server', e);
    }

    return true;
  }

  /**
   * Set the active language
   * @param {string} language - Language code (e.g., 'en', 'ru')
   * @returns {Promise<boolean>} Success status
   */
  async function setLanguage(language) {
    const config = await getConfig();
    
    if (!config.supported_languages || !config.supported_languages.includes(language)) {
      console.warn(`ConfigService: Language "${language}" not supported`);
      return false;
    }

    config.language = language;
    cachedConfig = config;

    // Update instructions based on language
    const instructions = getInstructionsForLanguage(language);
    if (instructions) {
      config.boltalka_instructions = instructions;
    }

    return true;
  }

  /**
   * Get instructions for a specific language
   * @param {string} language - Language code
   * @returns {string} Localized instructions
   */
  function getInstructionsForLanguage(language) {
    const instructions = {
      en: 'You are a helpful AI assistant. Respond concisely and naturally. In Auto (VAD) mode, respond to each user input and then stop speaking. Do not continue talking or generating multiple responses automatically.',
      ru: 'Ты полезный ИИ помощник. Отвечай кратко и естественно. В режиме Auto (VAD) отвечай на каждый вопрос пользователя и затем остановись. Не продолжай говорить и не генерируй несколько ответов автоматически.',
      es: 'Eres un asistente de IA útil. Responde de manera concisa y natural. En modo Auto (VAD), responde a cada entrada del usuario y luego detente. No continúes hablando ni generes múltiples respuestas automáticamente.',
      fr: 'Vous êtes un assistant IA utile. Répondez de manière concise et naturelle. En mode Auto (VAD), répondez à chaque entrée de l\'utilisateur puis arrêtez-vous. Ne continuez pas à parler et ne générez pas plusieurs réponses automatiquement.',
      de: 'Du bist ein hilfreicher KI-Assistent. Antworte prägnant und natürlich. Im Auto-Modus (VAD) reagiere auf jede Benutzereingabe und höre dann auf. Sprich nicht weiter und generiere nicht automatisch mehrere Antworten.'
    };
    return instructions[language] || instructions.en;
  }

  /**
   * Get localized instructions for a language (PUBLIC METHOD)
   * @param {string} language - Language code (en, ru, es, fr, de)
   * @returns {Promise<string>} Localized instructions
   */
  async function getLanguageInstructions(language) {
    return getInstructionsForLanguage(language);
  }

  /**
   * Get instructions for expert role
   * @param {string} role - Expert role (e.g., 'coding', 'architect', 'default')
   * @returns {Promise<string>} Expert instructions
   */
  async function getExpertInstructions(role = 'default') {
    const config = await getConfig();
    
    if (!config.experts || !config.experts[role]) {
      return config.boltalka_instructions;
    }

    return config.experts[role].instructions;
  }

  /**
   * Get expert configuration (model + instructions)
   * @param {string} role - Expert role
   * @returns {Promise<Object>} Expert config with model and instructions
   */
  async function getExpertConfig(role = 'default') {
    const config = await getConfig();
    
    if (!config.experts || !config.experts[role]) {
      return { model: config.realtime_model, instructions: config.boltalka_instructions };
    }

    return config.experts[role];
  }

  /**
   * Get all available experts
   * @returns {Promise<Array>} List of expert roles
   */
  async function getAvailableExperts() {
    const config = await getConfig();
    return Object.keys(config.experts || {});
  }

  /**
   * Update instructions for the current session
   * @param {string} newInstructions - New system instructions
   */
  async function setInstructions(newInstructions) {
    const config = await getConfig();
    config.boltalka_instructions = newInstructions;
    cachedConfig = config;
  }

  /**
   * Clear cached configuration (useful after updates)
   */
  function invalidateCache() {
    cachedConfig = null;
  }

  /**
   * Get complete current configuration
   * @returns {Promise<Object>} Full config object
   */
  async function getCurrentConfig() {
    return await getConfig();
  }

  /**
   * Get available languages
   * @returns {Promise<Array>} List of language codes
   */
  async function getAvailableLanguages() {
    const config = await getConfig();
    return config.supported_languages || ['en', 'ru'];
  }

  /**
   * Get available models
   * @returns {Promise<Array>} List of model names
   */
  async function getAvailableModels() {
    const config = await getConfig();
    return config.supported_models || ['gpt-4o-mini-realtime-preview'];
  }

  // Public API
  return {
    getConfig,
    getDefaults,
    setModel,
    setLanguage,
    getExpertInstructions,
    getExpertConfig,
    getAvailableExperts,
    setInstructions,
    getCurrentConfig,
    getAvailableLanguages,
    getAvailableModels,
    getLanguageInstructions,
    invalidateCache
  };
})();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConfigService;
}
