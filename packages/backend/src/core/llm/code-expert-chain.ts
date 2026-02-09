/**
 * Code Expert Chain for Voice-to-Code Mode
 *
 * This chain specializes in code generation, explanations, and debugging
 * based on voice input transcriptions.
 *
 * Day 5: LangChain Integration
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

/**
 * Initialize OpenAI LLM for code expertise
 */
export const initCodeExpertLLM = () => {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    // Lower temperature for more deterministic code generation
    temperature: 0.3,
    topP: 0.9,
    maxTokens: 2048,
    apiKey: process.env.OPENAI_API_KEY,
  });

  return model;
};

/**
 * Create code expert system prompt
 */
const createCodeExpertPrompt = () => {
  return ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are an expert programming assistant that helps with code generation, debugging, and explanations.

Your expertise areas:
- All major programming languages
- Web development (React, Node.js, etc.)
- Full-stack development
- Database design
- Best practices and architecture patterns

Your approach:
1. Understand the user's requirement from spoken context
2. Generate clean, well-documented code
3. Explain the logic and design decisions clearly
4. Provide alternative approaches when relevant
5. Include usage examples and edge case handling

Output format:
- Start with a brief explanation
- Provide code blocks with language specification
- Add comments explaining complex logic
- End with usage examples or important notes

Always:
- Write production-quality code
- Include error handling
- Follow language conventions
- Suggest testing approaches`,
    ],
    ['human', '{input}'],
  ]);
};

/**
 * Code generation options
 */
export interface CodeGenerationOptions {
  language?: string;
  framework?: string;
  additionalContext?: string;
}

/**
 * Create the code expert chain
 */
export const createCodeExpertChain = () => {
  const llm = initCodeExpertLLM();
  const prompt = createCodeExpertPrompt();

  // Chain: prompt -> LLM -> string output
  const chain = RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
};

/**
 * Execute code expert chain
 */
export const executeCodeExpertChain = async (
  userMessage: string,
  options?: CodeGenerationOptions,
) => {
  const chain = createCodeExpertChain();

  // Enhance the message with context if provided
  let enhancedMessage = userMessage;
  if (options?.language) {
    enhancedMessage += `\nLanguage: ${options.language}`;
  }
  if (options?.framework) {
    enhancedMessage += `\nFramework: ${options.framework}`;
  }
  if (options?.additionalContext) {
    enhancedMessage += `\n\nAdditional context:\n${options.additionalContext}`;
  }

  try {
    const response = await chain.invoke({
      input: enhancedMessage,
    });

    return {
      success: true,
      response,
      language: options?.language || 'unspecified',
      tokens: {
        input: Math.ceil(enhancedMessage.length / 4),
        output: Math.ceil(response.length / 4),
      },
    };
  } catch (error) {
    console.error('Code expert chain error:', error);
    throw error;
  }
};
