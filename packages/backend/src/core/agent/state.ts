/**
 * Agent State Management
 *
 * Defines the state structure for multi-turn conversations
 * with LangGraph agents.
 *
 * Day 6: LangGraph Agents
 */

/**
 * Message in conversation
 */
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    duration?: number;
    chainType?: string;
    toolUsed?: string;
  };
}

/**
 * Conversation mode
 */
export type ConversationMode = 'conversation' | 'code_expert' | 'auto';

/**
 * Agent state for multi-turn conversations
 */
export interface AgentState {
  conversationId: string;
  userId?: string;
  mode: ConversationMode;
  
  // Message history
  messages: AgentMessage[];
  
  // Context and memory
  context: {
    userProfile?: Record<string, any>;
    conversationGoal?: string;
    technicalStack?: string[];
    previousDecisions?: Record<string, any>;
  };
  
  // Agent internal state
  currentTool?: string;
  shouldContinue: boolean;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  
  // Timestamps
  startedAt: Date;
  lastUpdatedAt: Date;
}

/**
 * Agent decision
 */
export interface AgentDecision {
  action: 'continue_conversation' | 'switch_mode' | 'use_tool' | 'end_conversation';
  reasoning: string;
  targetMode?: ConversationMode;
  toolName?: string;
  toolInput?: Record<string, any>;
  confidence: number; // 0-1
}

/**
 * Tool definition for agent
 */
export interface AgentTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  execute: (input: Record<string, any>) => Promise<string>;
}

/**
 * Create initial agent state
 */
export function createInitialState(
  conversationId: string,
  mode: ConversationMode = 'conversation',
  userId?: string,
): AgentState {
  return {
    conversationId,
    userId,
    mode,
    messages: [],
    context: {},
    shouldContinue: true,
    tokens: {
      input: 0,
      output: 0,
      total: 0,
    },
    startedAt: new Date(),
    lastUpdatedAt: new Date(),
  };
}

/**
 * Add message to state
 */
export function addMessage(
  state: AgentState,
  message: AgentMessage,
): AgentState {
  // Estimate tokens: roughly 1 token per 4 characters
  const estimatedTokens = Math.ceil(message.content.length / 4);
  const tokenCount = message.metadata?.tokens || estimatedTokens;

  return {
    ...state,
    messages: [...state.messages, message],
    lastUpdatedAt: new Date(),
    tokens: {
      input: state.tokens.input + (message.role === 'user' ? tokenCount : 0),
      output: state.tokens.output + (message.role === 'assistant' ? tokenCount : 0),
      total: state.tokens.total + tokenCount,
    },
  };
}

/**
 * Update conversation mode
 */
export function updateMode(state: AgentState, mode: ConversationMode): AgentState {
  return {
    ...state,
    mode,
    lastUpdatedAt: new Date(),
  };
}

/**
 * Update context
 */
export function updateContext(
  state: AgentState,
  contextUpdate: Partial<AgentState['context']>,
): AgentState {
  return {
    ...state,
    context: {
      ...state.context,
      ...contextUpdate,
    },
    lastUpdatedAt: new Date(),
  };
}

/**
 * End conversation
 */
export function endConversation(state: AgentState): AgentState {
  return {
    ...state,
    shouldContinue: false,
    lastUpdatedAt: new Date(),
  };
}

/**
 * Get conversation summary
 */
export function getConversationSummary(state: AgentState) {
  return {
    conversationId: state.conversationId,
    userId: state.userId,
    mode: state.mode,
    messageCount: state.messages.length,
    tokens: state.tokens,
    duration: new Date().getTime() - state.startedAt.getTime(),
    active: state.shouldContinue,
  };
}
