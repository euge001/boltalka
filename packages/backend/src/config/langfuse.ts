/**
 * Langfuse Observability Configuration
 *
 * Configures Langfuse for LLM observability, cost tracking,
 * and conversation monitoring.
 *
 * Day 7: Langfuse Integration
 */

import { Langfuse } from 'langfuse';
import logger from './logger';

let langfuseClient: Langfuse | null = null;
let isInitialized = false;

/**
 * Initialize Langfuse client
 */
export function initializeLangfuse() {
  const enabled = process.env.LANGFUSE_ENABLED === 'true';
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASE_URL;

  if (!enabled) {
    logger.info('Langfuse observability disabled');
    isInitialized = true;
    return { success: true, message: 'Langfuse disabled via configuration' };
  }

  if (!publicKey || !secretKey) {
    logger.warn('Langfuse enabled but credentials not provided');
    isInitialized = true;
    return {
      success: false,
      message: 'Langfuse credentials missing (LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY)',
    };
  }

  try {
    langfuseClient = new Langfuse({
      publicKey,
      secretKey,
      baseUrl: baseUrl || 'https://cloud.langfuse.com',
    });

    isInitialized = true;
    logger.info('Langfuse initialized successfully', { baseUrl });

    return {
      success: true,
      message: 'Langfuse observability initialized',
    };
  } catch (error) {
    logger.error('Failed to initialize Langfuse', error);
    isInitialized = true;
    return {
      success: false,
      message: `Langfuse initialization failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Get Langfuse client instance
 */
export function getLangfuseClient(): Langfuse | null {
  if (!isInitialized) {
    initializeLangfuse();
  }
  return langfuseClient;
}

/**
 * Record conversation trace
 */
export async function traceConversation(
  conversationId: string,
  userId: string | undefined,
  messages: Array<{ role: string; content: string }>,
  metadata?: Record<string, any>,
) {
  const client = getLangfuseClient();
  if (!client) return;

  try {
    const trace = client.trace({
      name: 'conversation',
      metadata: {
        conversationId,
        userId,
        messageCount: messages.length,
        ...metadata,
      },
    });

    return trace;
  } catch (error) {
    logger.error('Failed to create conversation trace', error);
  }
}

/**
 * Record LLM chain execution
 */
export async function traceLLMChain(
  chainType: string,
  input: string,
  output: string,
  metadata?: {
    tokens?: { input: number; output: number };
    duration?: number;
    model?: string;
    temperature?: number;
    userId?: string;
    conversationId?: string;
    language?: string;
    framework?: string;
    [key: string]: any;
  },
) {
  const client = getLangfuseClient();
  if (!client) return;

  try {
    const span = client.span({
      name: `llm-${chainType}`,
      metadata: {
        chainType,
        inputLength: input.length,
        outputLength: output.length,
        ...metadata,
      },
    });

    span.end();
    return span;
  } catch (error) {
    logger.error('Failed to record LLM chain trace', error);
  }
}

/**
 * Record agent decision
 */
export async function traceAgentDecision(
  conversationId: string,
  decision: {
    action: string;
    reasoning: string;
    confidence: number;
    targetMode?: string;
    toolName?: string;
  },
  metadata?: Record<string, any>,
) {
  const client = getLangfuseClient();
  if (!client) return;

  try {
    const span = client.span({
      name: 'agent-decision',
      metadata: {
        action: decision.action,
        confidence: decision.confidence,
        targetMode: decision.targetMode,
        toolName: decision.toolName,
        ...metadata,
      },
    });

    span.end();
    return span;
  } catch (error) {
    logger.error('Failed to record agent decision trace', error);
  }
}

/**
 * Record tool execution
 */
export async function traceToolExecution(
  toolName: string,
  input: string,
  output: string,
  success: boolean,
  metadata?: Record<string, any>,
) {
  const client = getLangfuseClient();
  if (!client) return;

  try {
    const span = client.span({
      name: `tool-${toolName}`,
      metadata: {
        success,
        inputLength: input.length,
        outputLength: output.length,
        ...metadata,
      },
    });

    span.end();
    return span;
  } catch (error) {
    logger.error('Failed to record tool execution trace', error);
  }
}

/**
 * Get conversation analytics
 */
export async function getConversationMetrics(
  conversationId: string,
): Promise<{
  messageCount: number;
  tokenUsage?: { input: number; output: number };
  duration?: number;
} | null> {
  const client = getLangfuseClient();
  if (!client) return null;

  try {
    // In a real implementation, this would query Langfuse API
    // For now, return placeholder
    return {
      messageCount: 0,
      tokenUsage: { input: 0, output: 0 },
    };
  } catch (error) {
    logger.error('Failed to get conversation metrics', error);
    return null;
  }
}

/**
 * Check Langfuse health
 */
export async function checkLangfuseHealth(): Promise<boolean> {
  const client = getLangfuseClient();
  if (!client) return false;

  try {
    // Simple health check by creating a test trace
    const trace = client.trace({
      name: 'health-check',
      metadata: { timestamp: new Date().toISOString() },
    });

    return !!trace;
  } catch (error) {
    logger.error('Langfuse health check failed', error);
    return false;
  }
}

/**
 * Flush pending traces
 */
export async function flushLangfuse() {
  const client = getLangfuseClient();
  if (!client) return;

  try {
    await client.flush();
    logger.info('Langfuse traces flushed');
  } catch (error) {
    logger.error('Failed to flush Langfuse traces', error);
  }
}

export default {
  initializeLangfuse,
  getLangfuseClient,
  traceConversation,
  traceLLMChain,
  traceAgentDecision,
  traceToolExecution,
  getConversationMetrics,
  checkLangfuseHealth,
  flushLangfuse,
};
