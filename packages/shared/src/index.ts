// Types & constants shared between backend and frontend
export const API_VERSION = '2.0.0';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  userId: string;
  mode: 'voice' | 'code_expert';
  messages: Message[];
  title?: string;
  createdAt: Date;
  updatedAt: Date;
}
