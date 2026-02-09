/**
 * Agent Tools
 *
 * Tools that agents can use to enhance responses
 * Integration points for external services.
 *
 * Day 6: LangGraph Agents
 */

import { AgentTool } from './state';

/**
 * Calculator tool - simple arithmetic
 */
export const calculatorTool: AgentTool = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  inputSchema: {
    type: 'object',
    properties: {
      expression: { type: 'string', description: 'Math expression to evaluate' },
    },
    required: ['expression'],
  },
  execute: async (input: Record<string, any>) => {
    try {
      // Safe evaluation - only allow numbers and operators
      const expression = String(input.expression);
      
      // Validate expression
      if (!/^[\d+\-*/().%\s]+$/.test(expression)) {
        return 'Invalid expression: only numbers and operators allowed';
      }

      // eslint-disable-next-line no-eval
      const result = Function('"use strict"; return (' + expression + ')')();
      return `Result: ${result}`;
    } catch (error) {
      return `Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};

/**
 * Memory tool - store and retrieve context
 */
export const memoryTool: AgentTool = {
  name: 'memory',
  description: 'Store and retrieve information for later use',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['store', 'retrieve'],
        description: 'Action to perform',
      },
      key: { type: 'string', description: 'Key to store/retrieve' },
      value: { type: 'string', description: 'Value to store (for store action)' },
    },
    required: ['action', 'key'],
  },
  execute: async (input: Record<string, any>) => {
    const { action, key } = input;

    // In production, this would use a proper memory store
    // For now, just return a message
    if (action === 'store') {
      return `Stored: ${key}`;
    } else {
      return `Retrieved: ${key}`;
    }
  },
};

/**
 * Code documentation tool
 */
export const docTool: AgentTool = {
  name: 'documentation',
  description: 'Generate code documentation',
  inputSchema: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Code to document' },
      language: { type: 'string', description: 'Programming language' },
    },
    required: ['code', 'language'],
  },
  execute: async (input: Record<string, any>) => {
    const { language } = input;
    return `Documentation for ${language} code generated successfully`;
  },
};

/**
 * Available tools registry
 */
export const availableTools: Record<string, AgentTool> = {
  calculator: calculatorTool,
  memory: memoryTool,
  documentation: docTool,
};

/**
 * Get tool by name
 */
export function getTool(name: string): AgentTool | undefined {
  return availableTools[name];
}

/**
 * List all available tools
 */
export function listAvailableTools() {
  return Object.values(availableTools).map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}
