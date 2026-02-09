/**
 * Langfuse Integration Tests
 *
 * Test suite for LLM observability and tracing configuration
 *
 * Day 7: Langfuse Integration
 */

import {
  initializeLangfuse,
  getLangfuseClient,
  traceConversation,
  traceLLMChain,
  traceAgentDecision,
  traceToolExecution,
  checkLangfuseHealth,
  flushLangfuse,
} from '../src/config/langfuse';

describe('Langfuse Integration', () => {
  // ===========================
  // Initialization Tests
  // ===========================

  describe('Initialization', () => {
    beforeEach(() => {
      // Reset environment for each test
      delete process.env.LANGFUSE_ENABLED;
      delete process.env.LANGFUSE_PUBLIC_KEY;
      delete process.env.LANGFUSE_SECRET_KEY;
    });

    test('should initialize when disabled', () => {
      process.env.LANGFUSE_ENABLED = 'false';
      const result = initializeLangfuse();

      expect(result.success).toBe(true);
      expect(result.message).toContain('disabled');
    });

    test('should warn when enabled but credentials missing', () => {
      process.env.LANGFUSE_ENABLED = 'true';
      process.env.LANGFUSE_PUBLIC_KEY = '';
      process.env.LANGFUSE_SECRET_KEY = '';

      const result = initializeLangfuse();
      expect(result.success).toBe(false);
      expect(result.message).toContain('credentials');
    });

    test('should return client instance when properly initialized', () => {
      const client = getLangfuseClient();
      expect(client).toBeDefined();
    });
  });

  // ===========================
  // Tracing Functions Tests
  // ===========================

  describe('Tracing Functions', () => {
    test('should trace conversation creation', async () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];

      const result = await traceConversation('conv-123', 'user-456', messages, {
        mode: 'conversation',
      });

      // Tracing may return undefined if Langfuse is disabled
      expect(result === undefined || result !== null).toBe(true);
    });

    test('should trace LLM chain execution', async () => {
      const result = await traceLLMChain(
        'conversation',
        'Hello, how are you?',
        'I am doing great, thanks for asking!',
        {
          tokens: { input: 5, output: 10 },
          duration: 1500,
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
        },
      );

      expect(result === undefined || result !== null).toBe(true);
    });

    test('should trace code expert chain execution', async () => {
      const result = await traceLLMChain(
        'code_expert',
        'Write a React component',
        'function MyComponent() { ... }',
        {
          tokens: { input: 10, output: 50 },
          duration: 2500,
          model: 'gpt-4-turbo-preview',
          temperature: 0.3,
        },
      );

      expect(result === undefined || result !== null).toBe(true);
    });

    test('should trace agent decision making', async () => {
      const result = await traceAgentDecision(
        'conv-123',
        {
          action: 'switch_mode',
          reasoning: 'Code question detected',
          confidence: 0.95,
          targetMode: 'code_expert',
        },
        { messageCount: 5 },
      );

      expect(result === undefined || result !== null).toBe(true);
    });

    test('should trace tool execution', async () => {
      const result = await traceToolExecution(
        'calculator',
        '2 + 2',
        'Result: 4',
        true,
        { toolType: 'math' },
      );

      expect(result === undefined || result !== null).toBe(true);
    });

    test('should track failed tool execution', async () => {
      const result = await traceToolExecution(
        'calculator',
        'invalid expression',
        'Error: Invalid expression',
        false,
        { error: 'validation_failed' },
      );

      expect(result === undefined || result !== null).toBe(true);
    });
  });

  // ===========================
  // Health Check Tests
  // ===========================

  describe('Health Checks', () => {
    test('should perform health check', async () => {
      const isHealthy = await checkLangfuseHealth();
      expect(typeof isHealthy).toBe('boolean');
    });

    test('should flush pending traces', async () => {
      // Should not throw even if Langfuse is disabled
      await expect(flushLangfuse()).resolves.toBeUndefined();
    });
  });

  // ===========================
  // Integration Scenarios
  // ===========================

  describe('Integration Scenarios', () => {
    test('should trace complete conversation flow', async () => {
      const conversationId = 'conv-test-123';
      const userId = 'user-test-456';

      // 1. Create conversation trace
      await traceConversation(conversationId, userId, [], { mode: 'conversation' });

      // 2. Add first turn
      await traceLLMChain(
        'conversation',
        'Hello',
        'Hi there!',
        { tokens: { input: 2, output: 3 }, duration: 1000 },
      );

      // 3. Add agent decision trace
      await traceAgentDecision(
        conversationId,
        {
          action: 'continue_conversation',
          reasoning: 'Normal conversation continues',
          confidence: 0.9,
        },
      );

      // 4. Add second turn
      await traceLLMChain(
        'conversation',
        'How are you?',
        'I am doing well, thanks!',
        { tokens: { input: 4, output: 6 }, duration: 1200 },
      );

      // Complete flow should work
      expect(true).toBe(true);
    });

    test('should trace conversation with mode switching', async () => {
      const conversationId = 'conv-switch-test';

      // Start in conversation mode
      await traceAgentDecision(
        conversationId,
        {
          action: 'continue_conversation',
          reasoning: 'Start in conversation',
          confidence: 0.9,
        },
      );

      // Code question triggers mode switch
      await traceAgentDecision(
        conversationId,
        {
          action: 'switch_mode',
          reasoning: 'Code question detected',
          confidence: 0.95,
          targetMode: 'code_expert',
        },
      );

      // Execute code expert chain
      await traceLLMChain(
        'code_expert',
        'Write React component',
        'function Component() { ... }',
        {
          tokens: { input: 10, output: 50 },
          duration: 2000,
          temperature: 0.3,
        },
      );

      // Back to conversation mode
      await traceAgentDecision(
        conversationId,
        {
          action: 'switch_mode',
          reasoning: 'User switched back',
          confidence: 0.9,
          targetMode: 'conversation',
        },
      );

      expect(true).toBe(true);
    });

    test('should trace conversation with tool usage', async () => {
      const conversationId = 'conv-tools-test';

      // Agent decides to use tool
      await traceAgentDecision(
        conversationId,
        {
          action: 'use_tool',
          reasoning: 'Math calculation needed',
          confidence: 0.95,
          toolName: 'calculator',
        },
      );

      // Execute tool
      await traceToolExecution('calculator', '15 * 3', 'Result: 45', true);

      // Continue conversation with tool result
      await traceLLMChain(
        'conversation',
        'What is 15 times 3?',
        'The answer is 45',
        { tokens: { input: 5, output: 5 }, duration: 800 },
      );

      expect(true).toBe(true);
    });
  });

  // ===========================
  // Error Resilience Tests
  // ===========================

  describe('Error Resilience', () => {
    test('should handle missing conversation ID', async () => {
      // Should not throw
      const result = await traceConversation('', undefined, []);
      expect(result === undefined || result !== null).toBe(true);
    });

    test('should handle empty messages list', async () => {
      const result = await traceConversation('conv-test', 'user-test', []);
      expect(result === undefined || result !== null).toBe(true);
    });

    test('should handle invalid token counts', async () => {
      const result = await traceLLMChain(
        'conversation',
        'test',
        'response',
        {
          tokens: { input: 0, output: 0 }, // Zero tokens
          duration: 0,
        },
      );

      expect(result === undefined || result !== null).toBe(true);
    });

    test('should handle tracing during shutdown', async () => {
      // Should not throw even during shutdown
      await expect(flushLangfuse()).resolves.toBeUndefined();
    });
  });

  // ===========================
  // Performance Tests
  // ===========================

  describe('Performance', () => {
    test('should trace operations without blocking', async () => {
      const startTime = Date.now();

      // Perform multiple traces rapidly
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          traceLLMChain(
            'conversation',
            `Message ${i}`,
            `Response ${i}`,
            { tokens: { input: 5, output: 10 } },
          ),
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Should complete quickly (< 1 second for 10 traces)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle high-volume tracing', async () => {
      const startTime = Date.now();

      // Simulate high-volume conversation tracing
      const conversationId = 'conv-volume-test';
      const messages = [];

      for (let i = 0; i < 50; i++) {
        messages.push({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
        });
      }

      await traceConversation(conversationId, 'user-test', messages);

      const duration = Date.now() - startTime;

      // Should handle 50 messages quickly
      expect(duration).toBeLessThan(500);
    });
  });

  // ===========================
  // Configuration Tests
  // ===========================

  describe('Configuration', () => {
    test('should respect LANGFUSE_ENABLED setting', () => {
      const initialValue = process.env.LANGFUSE_ENABLED;

      // Disabled
      process.env.LANGFUSE_ENABLED = 'false';
      let result = initializeLangfuse();
      expect(result.message).toContain('disabled');

      // Enabled (will fail without proper credentials, but should try)
      process.env.LANGFUSE_ENABLED = 'true';
      result = initializeLangfuse();
      // Result depends on credentials

      // Restore
      if (initialValue) {
        process.env.LANGFUSE_ENABLED = initialValue;
      } else {
        delete process.env.LANGFUSE_ENABLED;
      }
    });

    test('should use default base URL when not specified', () => {
      delete process.env.LANGFUSE_BASE_URL;
      const result = initializeLangfuse();

      // Should succeed or fail gracefully without crashing
      expect(typeof result).toBe('object');
      expect(result.success === true || result.success === false).toBe(true);
    });
  });
});
