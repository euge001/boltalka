import { Message, Conversation } from '@boltalka/shared';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    name?: string;
  };
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name?: string;
}

export interface CreateConversationRequest {
  title?: string;
  mode?: string;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    // Load token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('authToken');
    }
  }

  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${path}`;
      const options: RequestInit = {
        method,
        headers: this.getHeaders(),
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json();
        return {
          error: error.message || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        data: data as T,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Auth endpoints
  async login(req: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('POST', '/auth/login', req);
  }

  async register(req: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return this.request<LoginResponse>('POST', '/auth/register', req);
  }

  async logout(): Promise<void> {
    this.clearToken();
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.request<{ status: string }>('GET', '/health');
  }

  // Conversation endpoints
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.request<Conversation[]>('GET', '/conversations');
  }

  async getConversation(id: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>('GET', `/conversations/${id}`);
  }

  async createConversation(req: CreateConversationRequest): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>('POST', '/conversations', req);
  }

  async deleteConversation(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>('DELETE', `/conversations/${id}`);
  }

  // Message endpoints
  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return this.request<Message[]>('GET', `/conversations/${conversationId}/messages`);
  }

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<ApiResponse<Message>> {
    return this.request<Message>('POST', `/conversations/${conversationId}/messages`, {
      content,
    });
  }

  async deleteMessage(conversationId: string, messageId: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<{ success: boolean }>(
      'DELETE',
      `/conversations/${conversationId}/messages/${messageId}`,
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
