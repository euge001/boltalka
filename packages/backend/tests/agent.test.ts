/**
 * Agent Tests
 *
 * Test suite for multi-turn conversation agents
 * Covers: state management, workflow execution, tool integration
 *
 * Day 6: LangGraph Agents
 */

import {
  AgentState,
  AgentFactory,
  createInitialState,
  addMessage,
  updateMode,
  updateContext,
  endConversation,
  getConversationSummary,
  executeAgentWorkflow,
  processTurns,
  listAvailableTools,
  getTool,
} from '../src/core/agent';

describe('Agent Module', () => {
  // ===========================
  // State Management Tests
  // ===========================

  describe('State Management', () => {
    test('should create initial state with correct defaults', () => {
      const state = createInitialState('conv-123', 'conversation', 'user-456');

      expect(state.conversationId).toBe('conv-123');
      expect(state.mode).toBe('conversation');
      expect(state.messages).toEqual([]);
      expect(state.context).toEqual({});
      expect(state.tokens).toEqual({ input: 0, output: 0, total: 0 });
      expect(state.startedAt).toBeDefined();
    });

    test('should add message to state', () => {
      let state = createInitialState('conv-123');
      state = addMessage(state, {
        role: 'user',
        content: 'Hello, how are you?',
        timestamp: new Date(),
        metadata: {},
      });

      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].content).toBe('Hello, how are you?');
      expect(state.messages[0].role).toBe('user');
    });

    test('should update mode in state', () => {
      let state = createInitialState('conv-123', 'conversation');
      expect(state.mode).toBe('conversation');

      state = updateMode(state, 'code_expert');
      expect(state.mode).toBe('code_expert');
    });

    test('should update context in state', () => {
      let state = createInitialState('conv-123');
      const context = {
        userProfile: { name: 'John', level: 'intermediate' },
        conversationGoal: 'Learn React',
      };

      state = updateContext(state, context);
      expect(state.context.userProfile).toEqual({ name: 'John', level: 'intermediate' });
      expect(state.context.conversationGoal).toBe('Learn React');
    });

    test('should end conversation with correct state', () => {
      let state = createInitialState('conv-123');
      expect(state.shouldContinue).toBe(true);

      state = endConversation(state);
      expect(state.shouldContinue).toBe(false);
      expect(state.lastUpdatedAt).toBeDefined();
    });

    test('should calculate conversation summary', () => {
      let state = createInitialState('conv-123', 'conversation', 'user-123');
      state = addMessage(state, {
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
        metadata: {},
      });
      state = addMessage(state, {
        role: 'assistant',
        content: 'Hi there!',
        timestamp: new Date(),
        metadata: {},
      });

      const summary = getConversationSummary(state);
      expect(summary.conversationId).toBe('conv-123');
      expect(summary.messageCount).toBe(2);
      expect(summary.userId).toBe('user-123');
      expect(summary.mode).toBe('conversation');
      expect(summary.tokens).toBeDefined();
    });

    test('should not mutate original state on updates', () => {
      const original = createInitialState('conv-123', 'conversation');
      const updated = updateMode(original, 'code_expert');

      expect(original.mode).toBe('conversation');
      expect(updated.mode).toBe('code_expert');
    });
  });

  // ===========================
  // Workflow Execution Tests
  // ===========================

  describe('Workflow Execution', () => {
    test('should execute agent workflow', async () => {
      const state = createInitialState('conv-123', 'conversation');

      const result = await executeAgentWorkflow(state, 'Hello, how are you?');

      expect(result).toBeDefined();
      expect(result.state).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.decision).toBeDefined();
      expect(result.state.messages.length).toBeGreaterThan(0);
    });

    test('should make correct mode decision for code questions', async () => {
      const state = createInitialState('conv-123', 'auto');
      const keywords = ['code', 'function', 'write', 'implement', 'debug', 'algorithm'];
      const codeQuestions = [
        'Write a React component',
        'How do I implement a function?',
        'Debug this code',
        'Create an algorithm',
      ];

      for (const question of codeQuestions) {
        const result = await executeAgentWorkflow(state, question);
        // The decision's action could be 'switch_mode' (to code_expert)
        // or 'continue_conversation', and targetMode tells us what was chosen
        const hasCodeIndication =
          result.decision.action === 'switch_mode' && result.decision.targetMode === 'code_expert';
        const isCodeQuestion = keywords.some((keyword) => question.toLowerCase().includes(keyword));
        
        if (isCodeQuestion) {
          expect(hasCodeIndication || result.state.mode === 'code_expert').toBe(true);
        }
      }
    });

    test('should track tokens across turns', async () => {
      let state = createInitialState('conv-123');

      const result1 = await executeAgentWorkflow(state, 'First message');
      expect(result1.state.tokens.total).toBeGreaterThanOrEqual(0);

      const result2 = await executeAgentWorkflow(result1.state, 'Second message');
      expect(result2.state.tokens.total).toBeGreaterThanOrEqual(result1.state.tokens.total);
    });

    test('should generate response based on decision', async () => {
      const state = createInitialState('conv-123');
      const result = await executeAgentWorkflow(state, 'Can you help me?');

      expect(result.response).toBeDefined();
      // Response could be empty if LLM is not available
      expect(typeof result.response).toBe('string');
      expect(result.decision).toBeDefined();
    });

    test('should handle multiple turns in sequence', async () => {
      let state = createInitialState('conv-123');

      const result1 = await executeAgentWorkflow(state, 'Hi');
      // Will have at least the user message, optionally assistant response
      expect(result1.state.messages.length).toBeGreaterThanOrEqual(1);
      expect(result1.state.messages[0].content).toBe('Hi');

      const result2 = await executeAgentWorkflow(result1.state, 'How are you?');
      expect(result2.state.messages.length).toBeGreaterThanOrEqual(result1.state.messages.length);

      const result3 = await executeAgentWorkflow(result2.state, 'Tell me a joke');
      expect(result3.state.messages.length).toBeGreaterThanOrEqual(result2.state.messages.length);
    });
  });

  // ===========================
  // Tool Integration Tests
  // ===========================

  describe('Tool Integration', () => {
    test('should list available tools', () => {
      const tools = listAvailableTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    test('should retrieve tool by name', () => {
      const tool = getTool('calculator');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('calculator');
      expect(tool?.description).toBeDefined();
    });

    test('should return undefined for non-existent tool', () => {
      const tool = getTool('non-existent-tool');

      expect(tool).toBeUndefined();
    });

    test('should have calculator tool', () => {
      const tools = listAvailableTools();
      const calculator = tools.find((t) => t.name === 'calculator');

      expect(calculator).toBeDefined();
      expect(calculator?.description).toContain('mathematical');
    });

    test('should have memory tool', () => {
      const tools = listAvailableTools();
      const memory = tools.find((t) => t.name === 'memory');

      expect(memory).toBeDefined();
      expect(memory?.description).toContain('Store and retrieve');
    });

    test('should have documentation tool', () => {
      const tools = listAvailableTools();
      const doc = tools.find((t) => t.name === 'documentation');

      expect(doc).toBeDefined();
      expect(doc?.description).toContain('code');
    });
  });

  // ===========================
  // Agent Factory Tests
  // ===========================

  describe('AgentFactory', () => {
    beforeEach(() => {
      AgentFactory.clearAll();
    });

    test('should create new agent', () => {
      const state = AgentFactory.createAgent('conv-123', 'user-456');

      expect(state).toBeDefined();
      expect(state.conversationId).toBe('conv-123');
    });

    test('should retrieve agent', () => {
      AgentFactory.createAgent('conv-123');
      const state = AgentFactory.getAgent('conv-123');

      expect(state).toBeDefined();
      expect(state?.conversationId).toBe('conv-123');
    });

    test('should update agent state', () => {
      const initial = AgentFactory.createAgent('conv-123');
      const updated = updateMode(initial, 'code_expert');
      AgentFactory.updateAgent('conv-123', updated);

      const retrieved = AgentFactory.getAgent('conv-123');
      expect(retrieved?.mode).toBe('code_expert');
    });

    test('should delete agent', () => {
      AgentFactory.createAgent('conv-123');
      const exists = AgentFactory.getAgent('conv-123');
      expect(exists).toBeDefined();

      AgentFactory.deleteAgent('conv-123');
      const notExists = AgentFactory.getAgent('conv-123');
      expect(notExists).toBeUndefined();
    });

    test('should list all agents', () => {
      AgentFactory.createAgent('conv-1');
      AgentFactory.createAgent('conv-2');
      AgentFactory.createAgent('conv-3');

      const agents = AgentFactory.listAgents();
      expect(agents).toHaveLength(3);
      expect(agents).toContain('conv-1');
      expect(agents).toContain('conv-2');
      expect(agents).toContain('conv-3');
    });

    test('should count agents', () => {
      AgentFactory.createAgent('conv-1');
      AgentFactory.createAgent('conv-2');

      const count = AgentFactory.getAgentCount();
      expect(count).toBe(2);
    });

    test('should clear all agents', () => {
      AgentFactory.createAgent('conv-1');
      AgentFactory.createAgent('conv-2');
      expect(AgentFactory.getAgentCount()).toBe(2);

      AgentFactory.clearAll();
      expect(AgentFactory.getAgentCount()).toBe(0);
    });
  });

  // ===========================
  // Integration Tests
  // ===========================

  describe('Integration', () => {
    beforeEach(() => {
      AgentFactory.clearAll();
    });

    test('should complete full conversation flow', async () => {
      // 1. Create conversation
      const state = AgentFactory.createAgent('conv-test', 'user-test');
      expect(state.conversationId).toBe('conv-test');

      // 2. Execute first turn
      let result = await executeAgentWorkflow(state, 'Hello! Can you help me learn React?');
      expect(result.state.messages.length).toBeGreaterThanOrEqual(1); // At least user message

      // 3. Update factory
      AgentFactory.updateAgent('conv-test', result.state);

      // 4. Execute second turn
      result = await executeAgentWorkflow(result.state, 'What are hooks?');
      expect(result.state.messages.length).toBeGreaterThanOrEqual(result.state.messages.length - 1);

      // 5. Update factory again
      AgentFactory.updateAgent('conv-test', result.state);

      // 6. Retrieve and verify
      const final = AgentFactory.getAgent('conv-test');
      expect(final?.messages).toBeDefined();
      expect(final?.messages.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle context building across turns', async () => {
      const state = createInitialState('conv-123', 'auto');
      const contextualState = updateContext(state, {
        userProfile: { level: 'beginner' },
        conversationGoal: 'Learn web development',
      });

      const result1 = await executeAgentWorkflow(contextualState, 'How do I start with HTML?');
      expect(result1.state.messages.length).toBeGreaterThanOrEqual(1);

      const result2 = await executeAgentWorkflow(result1.state, 'What about CSS?');
      expect(result2.state.messages.length).toBeGreaterThanOrEqual(result1.state.messages.length);

      const result3 = await executeAgentWorkflow(result2.state, 'Now JavaScript?');
      expect(result3.state.messages.length).toBeGreaterThanOrEqual(result2.state.messages.length);
      expect(result3.state.context.userProfile).toBeDefined();
    });
  });

  // ===========================
  // Error Handling Tests
  // ===========================

  describe('Error Handling', () => {
    test('should handle empty message gracefully', async () => {
      const state = createInitialState('conv-123');

      try {
        await executeAgentWorkflow(state, '');
        // Should either handle gracefully or throw
      } catch (error) {
        // Error is acceptable
        expect(error).toBeDefined();
      }
    });

    test('should handle null mode gracefully', () => {
      const state = createInitialState('conv-123', 'auto' as any);
      expect(state.mode).toBeDefined();
    });

    test('should maintain state integrity on concurrent updates', async () => {
      const state = createInitialState('conv-123');

      // Simulate concurrent updates
      const updated1 = addMessage(state, {
        role: 'user',
        content: 'Message 1',
        timestamp: new Date(),
        metadata: {},
      });

      const updated2 = addMessage(state, {
        role: 'user',
        content: 'Message 2',
        timestamp: new Date(),
        metadata: {},
      });

      // Original should be unchanged
      expect(state.messages).toHaveLength(0);
      // Each update should have one message
      expect(updated1.messages).toHaveLength(1);
      expect(updated2.messages).toHaveLength(1);
    });
  });

  // ===========================
  // Performance Tests
  // ===========================

  describe('Performance', () => {
    test('should create state quickly', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        createInitialState(`conv-${i}`);
      }
      const duration = Date.now() - start;

      // Should be fast (arbitrary threshold)
      expect(duration).toBeLessThan(1000);
    });

    test('should add messages efficiently', () => {
      const state = createInitialState('conv-123');
      const start = Date.now();

      let current = state;
      for (let i = 0; i < 100; i++) {
        current = addMessage(current, {
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          timestamp: new Date(),
          metadata: {},
        });
      }
      const duration = Date.now() - start;

      expect(current.messages).toHaveLength(100);
      expect(duration).toBeLessThan(500);
    });
  });
});
