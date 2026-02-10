/**
 * LLM Routes
 * REST API endpoints for LLM chain execution
 *
 * Day 5: LangChain Integration
 */

import { FastifyInstance } from 'fastify';
import { LLMChainFactory } from '../../../core/llm';

/**
 * Register LLM routes
 */
export async function registerLLMRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/llm/conversation
   * Execute conversation chain
   *
   * Request body:
   * {
   *   "message": "Hello, how are you?",
   *   "conversationId": "conv-123" (optional)
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "response": "I'm doing well, thanks for asking...",
   *   "chainType": "conversation",
   *   "tokens": { "input": 5, "output": 25 },
   *   "duration": 1250
   * }
   */
  fastify.post<{
    Body: {
      message: string;
      conversationId?: string;
    };
  }>('/api/llm/conversation', async (request, reply) => {
    const { message, conversationId } = request.body;

    if (!message) {
      return reply.code(400).send({
        success: false,
        error: 'Message is required',
      });
    }

    const result = await LLMChainFactory.executeChain(
      'conversation',
      message,
      {
        chainType: 'conversation',
        conversationId,
        timestamp: new Date(),
      },
    );

    return reply.code(result.success ? 200 : 500).send(result);
  });

  /**
   * POST /api/llm/code-expert
   * Execute code expert chain
   *
   * Request body:
   * {
   *   "message": "Write a React component for a button",
   *   "language": "TypeScript" (optional),
   *   "framework": "React" (optional),
   *   "context": "..." (optional)
   * }
   *
   * Response:
   * {
   *   "success": true,
   *   "response": "Here's a React button component...",
   *   "chainType": "code_expert",
   *   "language": "TypeScript",
   *   "tokens": { "input": 15, "output": 150 },
   *   "duration": 2500
   * }
   */
  fastify.post<{
    Body: {
      message: string;
      language?: string;
      framework?: string;
      context?: string;
    };
  }>('/api/llm/code-expert', async (request, reply) => {
    const { message, language, framework, context } = request.body;

    if (!message) {
      return reply.code(400).send({
        success: false,
        error: 'Message is required',
      });
    }

    const result = await LLMChainFactory.executeChain(
      'code_expert',
      message,
      {
        chainType: 'code_expert',
        timestamp: new Date(),
        metadata: { language, framework },
      },
      {
        language,
        framework,
        additionalContext: context,
      },
    );

    return reply.code(result.success ? 200 : 500).send(result);
  });

  /**
   * GET /api/llm/chains
   * List available chains
   */
  fastify.get<{ Reply: any }>('/api/llm/chains', async (request, reply) => {
    return reply.send({
      chains: [
        {
          type: 'conversation',
          description: 'Voice-to-voice conversation chain',
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          maxTokens: 1024,
        },
        {
          type: 'code_expert',
          description:
            'Code generation and explanation chain',
          model: 'gpt-4-turbo-preview',
          temperature: 0.3,
          maxTokens: 2048,
        },
      ],
      timestamp: new Date(),
    });
  });

  fastify.log.info('LLM routes registered');
}
