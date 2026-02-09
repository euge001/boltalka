/**
 * Conversation Chain for Voice-to-Voice Mode
 *
 * This chain handles bi-directional voice conversations with memory,
 * context understanding, and natural language generation.
 *
 * Day 5: LangChain Integration
 * Day 7: Langfuse Integration
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate, ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { traceLLMChain } from '../../config/langfuse';

/**
 * Initialize OpenAI LLM for conversation
 */
export const initConversationLLM = () => {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    // Temperature for more natural conversations
    temperature: 0.7,
    topP: 0.95,
    maxTokens: 1024,
    apiKey: process.env.OPENAI_API_KEY,
  });

  return model;
};

/**
 * Create conversation system prompt
 */
const createConversationPrompt = () => {
  return ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are Boltalka, a friendly AI assistant that engages in natural voice conversations.

Your personality:
- Friendly and approachable
- Helpful and informative
- Natural speaking style suitable for voice
- Concise responses (prefer short, natural sentences)
- Emotionally intelligent

Guidelines:
- Respond naturally to questions and statements
- Remember conversation context
- Ask clarifying questions when needed
- Provide useful information when asked
- Keep responses conversational and engaging
- Use simple language for better voice synthesis`,
    ],
    ['human', '{input}'],
  ]);
};

/**
 * Create the conversation chain
 */
export const createConversationChain = () => {
  const llm = initConversationLLM();
  const prompt = createConversationPrompt();

  // Chain: prompt -> LLM -> string output
  const chain = RunnableSequence.from([
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  return chain;
};

/**
 * Execute conversation chain
 */
export const executeConversationChain = async (userMessage: string) => {
  const chain = createConversationChain();
  const startTime = Date.now();

  try {
    const response = await chain.invoke({
      input: userMessage,
    });

    const duration = Date.now() - startTime;
    const tokens = {
      input: Math.ceil(userMessage.length / 4),
      output: Math.ceil(response.length / 4),
    };

    // Trace LLM execution with Langfuse
    await traceLLMChain('conversation', userMessage, response, {
      tokens,
      duration,
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
    });

    return {
      success: true,
      response,
      tokens,
    };
  } catch (error) {
    console.error('Conversation chain error:', error);
    throw error;
  }
};
