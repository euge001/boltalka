/**
 * LLM Chain Factory and Initialization
 *
 * Centralizes all LLM chain creation and configuration.
 * Integrates with Langfuse for observability and evaluation.
 */

import {
  createConversationChain,
  executeConversationChain,
} from './conversation-chain';
import {
  createCodeExpertChain,
  executeCodeExpertChain,
  CodeGenerationOptions,
} from './code-expert-chain';

/**
 * Chain types
 */
export type ChainType = 'conversation' | 'code_expert';

/**
 * Chain execution context
 */
export interface ChainExecutionContext {
  chainType: ChainType;
  userId?: string;
  conversationId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Chain execution result
 */
export interface ChainExecutionResult {
  success: boolean;
  response: string;
  chainType: ChainType;
  tokens: {
    input: number;
    output: number;
  };
  duration: number;
  error?: string;
}

/**
 * LLM Chain Factory
 */
export class LLMChainFactory {
  /**
   * Execute chain based on type
   */
  static async executeChain(
    chainType: ChainType,
    input: string,
    context?: ChainExecutionContext,
    options?: CodeGenerationOptions,
  ): Promise<ChainExecutionResult> {
    const startTime = Date.now();

    try {
      let response: any;

      switch (chainType) {
        case 'conversation':
          response = await executeConversationChain(input);
          break;

        case 'code_expert':
          response = await executeCodeExpertChain(input, options);
          break;

        default:
          throw new Error(`Unknown chain type: ${chainType}`);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        response: response.response,
        chainType,
        tokens: response.tokens,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(
        `Chain execution failed [${chainType}]:`,
        error instanceof Error ? error.message : String(error),
      );

      return {
        success: false,
        response: '',
        chainType,
        tokens: { input: 0, output: 0 },
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Create chain instance (for advanced usage)
   */
  static createChain(chainType: ChainType) {
    switch (chainType) {
      case 'conversation':
        return createConversationChain();

      case 'code_expert':
        return createCodeExpertChain();

      default:
        throw new Error(`Unknown chain type: ${chainType}`);
    }
  }

  /**
   * Validate chain configuration
   */
  static validateConfiguration(): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!process.env.OPENAI_API_KEY) {
      errors.push('OPENAI_API_KEY environment variable is not set');
    }

    if (!process.env.OPENAI_API_KEY?.startsWith('sk-')) {
      errors.push('OPENAI_API_KEY does not have valid OpenAI format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Initialize LLM chains (setup & validation)
   */
  static initialize(): {
    success: boolean;
    message: string;
    debug?: Record<string, any>;
  } {
    console.log('[LLM] Initializing LLM chains...');

    const validation = this.validateConfiguration();

    if (!validation.isValid) {
      return {
        success: false,
        message: `LLM configuration error: ${validation.errors.join(', ')}`,
        debug: { errors: validation.errors },
      };
    }

    // Test chain creation
    try {
      this.createChain('conversation');
      this.createChain('code_expert');

      console.log('[LLM] ✓ All LLM chains initialized successfully');

      return {
        success: true,
        message: 'LLM chains initialized successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to initialize LLM chains: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

/**
 * Export chain types for convenience
 */
export { createConversationChain, executeConversationChain };
export {
  createCodeExpertChain,
  executeCodeExpertChain,
  type CodeGenerationOptions,
};
