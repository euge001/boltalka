/**
 * Agent Module Index
 *
 * Exports all agent functionality and provides
 * agent factory for creating conversation agents.
 *
 * Day 6: LangGraph Agents
 */

import { AgentState } from './state';

export {
  AgentState,
  AgentMessage,
  AgentDecision,
  AgentTool,
  ConversationMode,
  createInitialState,
  addMessage,
  updateMode,
  updateContext,
  endConversation,
  getConversationSummary,
} from './state';

export { executeAgentWorkflow, processTurns, generateConversationResponse } from './workflow';

export { availableTools, getTool, listAvailableTools } from './tools';

/**
 * Agent Factory
 * 
 * Creates and manages agent instances
 */
export class AgentFactory {
  private static agents: Map<string, AgentState> = new Map();

  /**
   * Create a new agent/conversation
   */
  static createAgent(conversationId: string, userId?: string) {
    const { createInitialState } = require('./state');
    const state = createInitialState(conversationId, 'conversation', userId);
    this.agents.set(conversationId, state);
    return state;
  }

  /**
   * Get agent state
   */
  static getAgent(conversationId: string) {
    return this.agents.get(conversationId);
  }

  /**
   * Update agent state
   */
  static updateAgent(conversationId: string, state: AgentState) {
    this.agents.set(conversationId, state);
    return state;
  }

  /**
   * Delete agent
   */
  static deleteAgent(conversationId: string) {
    return this.agents.delete(conversationId);
  }

  /**
   * List all active agents
   */
  static listAgents() {
    return Array.from(this.agents.keys());
  }

  /**
   * Get agent count
   */
  static getAgentCount() {
    return this.agents.size;
  }

  /**
   * Clear all agents
   */
  static clearAll() {
    this.agents.clear();
  }
}
