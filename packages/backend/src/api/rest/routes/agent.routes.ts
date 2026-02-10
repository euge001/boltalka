/**
 * Agent Routes
 * REST API endpoints for multi-turn conversation agents
 *
 * Day 6: LangGraph Agents
 */

import { FastifyInstance } from 'fastify';
import {
  AgentFactory,
  executeAgentWorkflow,
  listAvailableTools,
  getConversationSummary,
} from '../../../core/agent';

/**
 * Register agent routes
 */
export async function registerAgentRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/agent/token
   * Generate ephemeral token for OpenAI Realtime WebRTC API
   *
   * Response:
   * {
   *   "value": "gpt-4-realtime-token-...",
   *   "expires_at": "2024-01-15T..."
   * }
   */
  fastify.post<{ Body: { model?: string } }>('/api/agent/token', async (request, reply) => {
    try {
      const { model = 'gpt-4o-realtime-preview' } = request.body || {};
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return reply.code(500).send({
          success: false,
          error: 'OpenAI API key not configured',
        });
      }

      // Get ephemeral token from OpenAI
      const tokenResponse = await fetch('https://api.openai.com/v1/realtime/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          voice: 'alloy',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        fastify.log.error({ error }, 'Failed to get OpenAI ephemeral token');
        return reply.code(500).send({
          success: false,
          error: 'Failed to generate token',
        });
      }

      const tokenData = await tokenResponse.json() as any;

      return reply.code(200).send({
        value: tokenData?.client_secret?.value || '',
        expires_at: tokenData?.expires_at || new Date(),
      });
    } catch (error) {
      fastify.log.error({ error }, 'Token generation failed');
      return reply.code(500).send({
        success: false,
        error: 'Token generation error',
      });
    }
  });

  /**
   * POST /api/agent/start
   * Initialize a new conversation
   *
   * Request body:
   * {
   *   "userId": "user-123" (optional),
   *   "mode": "conversation" | "code_expert" | "auto"
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "conversationId": "conv-uuid",
   *   "state": { AgentState }
   * }
   */
  fastify.post<{
    Body: {
      userId?: string;
      mode?: 'conversation' | 'code_expert' | 'auto';
    };
  }>('/api/agent/start', async (request, reply) => {
    const { userId, mode = 'auto' } = request.body;

    try {
      const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const state = AgentFactory.createAgent(conversationId, userId);

      return reply.code(201).send({
        success: true,
        conversationId,
        mode,
        state,
        timestamp: new Date(),
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to initialize agent conversation');
      return reply.code(500).send({
        success: false,
        error: 'Failed to initialize conversation',
      });
    }
  });

  /**
   * POST /api/agent/chat
   * Execute a single turn in conversation
   *
   * Request body:
   * {
   *   "conversationId": "conv-123",
   *   "message": "Hello, can you help me debug this code?",
   *   "metadata": { ... } (optional)
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "conversationId": "conv-123",
   *   "response": "I'd be happy to help...",
   *   "decision": {
   *     "action": "code_expert",
   *     "reasoning": "User asked about debugging code",
   *     "confidence": 0.95
   *   },
   *   "state": { AgentState },
   *   "tokens": { "input": 10, "output": 50, "total": 60 },
   *   "duration": 2300
   * }
   */
  fastify.post<{
    Body: {
      conversationId: string;
      message: string;
      metadata?: Record<string, any>;
    };
  }>('/api/agent/chat', async (request, reply) => {
    const { conversationId, message, metadata } = request.body;

    if (!conversationId) {
      return reply.code(400).send({
        success: false,
        error: 'conversationId is required',
      });
    }

    if (!message) {
      return reply.code(400).send({
        success: false,
        error: 'message is required',
      });
    }

    try {
      const startTime = Date.now();
      const state = AgentFactory.getAgent(conversationId);

      if (!state) {
        return reply.code(404).send({
          success: false,
          error: 'Conversation not found',
        });
      }

      const result = await executeAgentWorkflow(state, message);

      // Update agent with new state
      AgentFactory.updateAgent(conversationId, result.state);

      const duration = Date.now() - startTime;

      return reply.code(200).send({
        success: true,
        conversationId,
        response: result.response,
        decision: result.decision,
        state: result.state,
        tokens: result.state.tokens,
        duration,
        timestamp: new Date(),
      });
    } catch (error) {
      fastify.log.error(error, 'Agent chat execution failed');
      return reply.code(500).send({
        success: false,
        error: 'Chat execution failed',
      });
    }
  });

  /**
   * GET /api/agent/state/:conversationId
   * Get current conversation state
   *
   * Response:
   * {
   *   "success": true,
   *   "conversationId": "conv-123",
   *   "state": { AgentState },
   *   "summary": "Conversation summary...",
   *   "messageCount": 5
   * }
   */
  fastify.get<{
    Params: {
      conversationId: string;
    };
  }>('/api/agent/state/:conversationId', async (request, reply) => {
    const { conversationId } = request.params;

    try {
      const state = AgentFactory.getAgent(conversationId);

      if (!state) {
        return reply.code(404).send({
          success: false,
          error: 'Conversation not found',
        });
      }

      const summary = getConversationSummary(state);

      return reply.code(200).send({
        success: true,
        conversationId,
        state,
        summary,
        messageCount: state.messages.length,
        timestamp: new Date(),
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to get agent state');
      return reply.code(500).send({
        success: false,
        error: 'Failed to get state',
      });
    }
  });

  /**
   * DELETE /api/agent/conversations/:conversationId
   * End a conversation
   *
   * Response:
   * {
   *   "success": true,
   *   "conversationId": "conv-123",
   *   "summary": "Conversation summary...",
   *   "totalTokens": 500,
   *   "duration": 120000
   * }
   */
  fastify.delete<{
    Params: {
      conversationId: string;
    };
  }>('/api/agent/conversations/:conversationId', async (request, reply) => {
    const { conversationId } = request.params;

    try {
      const state = AgentFactory.getAgent(conversationId);

      if (!state) {
        return reply.code(404).send({
          success: false,
          error: 'Conversation not found',
        });
      }

      const summary = getConversationSummary(state);
      const duration = Date.now() - new Date(state.startedAt).getTime();

      AgentFactory.deleteAgent(conversationId);

      return reply.code(200).send({
        success: true,
        conversationId,
        summary,
        totalTokens: state.tokens.total,
        messageCount: state.messages.length,
        duration,
        timestamp: new Date(),
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to end conversation');
      return reply.code(500).send({
        success: false,
        error: 'Failed to end conversation',
      });
    }
  });

  /**
   * GET /api/agent/tools
   * List available agent tools
   *
   * Response:
   * {
   *   "success": true,
   *   "tools": [
   *     {
   *       "name": "calculator",
   *       "description": "Evaluate mathematical expressions",
   *       "input": "expression string"
   *     },
   *     ...
   *   ]
   * }
   */
  fastify.get<{ Reply: any }>('/api/agent/tools', async (request, reply) => {
    try {
      const tools = listAvailableTools();

      return reply.code(200).send({
        success: true,
        tools: tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input: tool.inputSchema?.type || 'string',
        })),
        count: tools.length,
        timestamp: new Date(),
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to list tools');
      return reply.code(500).send({
        success: false,
        error: 'Failed to list tools',
      });
    }
  });

  /**
   * GET /api/agent/conversations
   * List all active conversations
   *
   * Response:
   * {
   *   "success": true,
   *   "conversations": ["conv-123", "conv-456"],
   *   "count": 2
   * }
   */
  fastify.get<{ Reply: any }>('/api/agent/conversations', async (request, reply) => {
    try {
      const conversations = AgentFactory.listAgents();

      return reply.code(200).send({
        success: true,
        conversations,
        count: conversations.length,
        timestamp: new Date(),
      });
    } catch (error) {
      fastify.log.error(error, 'Failed to list conversations');
      return reply.code(500).send({
        success: false,
        error: 'Failed to list conversations',
      });
    }
  });

  /**
   * GET /api/agent/health
   * Check agent system health
   *
   * Response:
   * {
   *   "healthy": true,
   *   "activeConversations": 5,
   *   "timestamp": "2024-01-15T..."
   * }
   */
  fastify.get<{ Reply: any }>('/api/agent/health', async (request, reply) => {
    try {
      const activeConversations = AgentFactory.getAgentCount();

      return reply.code(200).send({
        healthy: true,
        activeConversations,
        timestamp: new Date(),
      });
    } catch (error) {
      fastify.log.error(error, 'Agent health check failed');
      return reply.code(500).send({
        healthy: false,
        error: 'Health check failed',
      });
    }
  });

  /**
   * POST /api/agent/workflow
   * Execute agent workflow (used by Coder Expert)
   *
   * Request body:
   * {
   *   "input": "user question",
   *   "mode": "code_expert" | "architect" | "conversation"
   * }
   *
   * Response:
   * {
   *   "output": "agent response",
   *   "success": true
   * }
   */
  fastify.post<{
    Body: {
      input: string;
      mode?: 'code_expert' | 'architect' | 'conversation';
    };
  }>('/api/agent/workflow', async (request, reply) => {
    try {
      const { input, mode = 'code_expert' } = request.body;

      if (!input || !input.trim()) {
        return reply.code(400).send({
          success: false,
          error: 'Input is required',
        });
      }

      // Create or get an agent conversation
      const conversationId = `conv-${Date.now()}`;
      let agentState = AgentFactory.createAgent(conversationId);

      // Execute workflow with the input
      const result = await executeAgentWorkflow(agentState, input);

      // Update agent state
      AgentFactory.updateAgent(conversationId, result.state);

      return reply.code(200).send({
        success: true,
        output: result.response,
        decision: result.decision,
        timestamp: new Date(),
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      fastify.log.error({ error }, 'Agent workflow failed');
      return reply.code(500).send({
        success: false,
        error: errorMsg || 'Workflow execution failed',
      });
    }
  });

  fastify.log.info('Agent routes registered');
}
