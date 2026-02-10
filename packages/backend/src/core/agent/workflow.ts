/**
 * Multi-Turn Agent Workflow
 *
 * Implements LangGraph patterns for multi-turn conversations
 * with mode switching and tool integration.
 */

import { AgentState, AgentMessage, AgentDecision, addMessage, updateMode, endConversation } from './state';
import {
  LLMChainFactory,
  ChainExecutionContext,
} from '../llm';
import { traceAgentDecision } from '../../config/langfuse';

/**
 * Process user input and decide next action
 */
async function decideNextAction(
  state: AgentState,
  userMessage: string,
): Promise<AgentDecision> {
  // Simple decision logic - can be enhanced with classifiers
  
  // Check if user is asking about code
  const codeKeywords = [
    'code',
    'function',
    'write',
    'implement',
    'debug',
    'algorithm',
    'react',
    'typescript',
    'javascript',
    'python',
    'class',
    'var',
    'const',
  ];
  
  const isCodeQuestion = codeKeywords.some((keyword) =>
    userMessage.toLowerCase().includes(keyword),
  );

  // Check for mode switch requests
  if (userMessage.toLowerCase().includes('switch to conversation') ||
      userMessage.toLowerCase().includes('normal mode')) {
    return {
      action: 'switch_mode',
      reasoning: 'User explicitly requested conversation mode',
      targetMode: 'conversation',
      confidence: 0.95,
    };
  }

  if (userMessage.toLowerCase().includes('switch to code expert') ||
      userMessage.toLowerCase().includes('code mode')) {
    return {
      action: 'switch_mode',
      reasoning: 'User explicitly requested code expert mode',
      targetMode: 'code_expert',
      confidence: 0.95,
    };
  }

  // Auto-decide based on content
  if (state.mode === 'auto') {
    return {
      action: 'switch_mode',
      reasoning: isCodeQuestion
        ? 'User question detected as code-related'
        : 'User question detected as conversation',
      targetMode: isCodeQuestion ? 'code_expert' : 'conversation',
      confidence: isCodeQuestion ? 0.7 : 0.6,
    };
  }

  // Continue in current mode
  return {
    action: 'continue_conversation',
    reasoning: `Continuing in ${state.mode} mode`,
    confidence: 0.9,
  };
}

/**
 * Execute agent workflow for user input
 */
export async function executeAgentWorkflow(
  state: AgentState,
  userMessage: string,
): Promise<{
  state: AgentState;
  response: string;
  decision: AgentDecision;
}> {
  let currentState = state;

  // Add user message to state
  currentState = addMessage(currentState, {
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  });

  // Decide next action
  const decision = await decideNextAction(currentState, userMessage);

  // Trace agent decision with Langfuse
  await traceAgentDecision(
    currentState.conversationId,
    decision,
    {
      messageCount: currentState.messages.length,
      mode: currentState.mode,
      userId: currentState.userId,
    },
  );

  // Handle decision
  if (decision.action === 'switch_mode' && decision.targetMode) {
    currentState = updateMode(currentState, decision.targetMode);
  }

  // Execute LLM chain based on current mode
  const chainType = currentState.mode === 'code_expert' ? 'code_expert' : 'conversation';

  const executionContext: ChainExecutionContext = {
    chainType,
    userId: currentState.userId,
    conversationId: currentState.conversationId,
    timestamp: new Date(),
    metadata: {
      messageCount: currentState.messages.length,
      mode: currentState.mode,
      decision,
    },
  };

  const result = await LLMChainFactory.executeChain(
    chainType,
    userMessage,
    executionContext,
    chainType === 'code_expert' ? { additionalContext: buildTaskContext(currentState) } : undefined,
  );

  // Add assistant response to state
  if (result.success) {
    const totalTokens = (result.tokens.input || 0) + (result.tokens.output || 0);
    currentState = addMessage(currentState, {
      role: 'assistant',
      content: result.response,
      timestamp: new Date(),
      metadata: {
        chainType,
        tokens: totalTokens,
        duration: result.duration,
      },
    });
  }

  return {
    state: currentState,
    response: result.response,
    decision,
  };
}

/**
 * Build task context for code expert chain
 */
function buildTaskContext(state: AgentState): string {
  const parts: string[] = [];

  if (state.context.technicalStack?.length) {
    parts.push(`Technical Stack: ${state.context.technicalStack.join(', ')}`);
  }

  if (state.context.conversationGoal) {
    parts.push(`Goal: ${state.context.conversationGoal}`);
  }

  if (state.messages.length > 0) {
    parts.push(
      `Previous context: ${state.messages
        .slice(-2)
        .map((m) => `${m.role}: ${m.content.substring(0, 100)}`)
        .join('\n')}`,
    );
  }

  return parts.length > 0 ? parts.join('\n\n') : '';
}

/**
 * Process multi-turn conversation
 */
export async function processTurns(
  initialState: AgentState,
  userMessages: string[],
): Promise<AgentState> {
  let currentState = initialState;

  for (const message of userMessages) {
    if (!currentState.shouldContinue) break;

    const { state: nextState } = await executeAgentWorkflow(currentState, message);
    currentState = nextState;
  }

  return currentState;
}

/**
 * Generate response based on conversation state and decision
 */
export async function generateConversationResponse(
  state: AgentState,
  decision: AgentDecision,
): Promise<string> {
  if (decision.action === 'switch_mode') {
    return `Switching to ${decision.targetMode} mode: ${decision.reasoning}`;
  }

  if (decision.action === 'end_conversation') {
    return 'Conversation ended.';
  }

  return decision.reasoning;
}
