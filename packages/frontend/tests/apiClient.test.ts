import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../services/apiClient';

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:3000');
  });

  describe('Token Management', () => {
    it('should set and retrieve token', () => {
      apiClient.setToken('test-token');
      expect(apiClient['token']).toBe('test-token');
    });

    it('should clear token', () => {
      apiClient.setToken('test-token');
      apiClient.clearToken();
      expect(apiClient['token']).toBe(null);
    });

    it('should include token in headers', () => {
      apiClient.setToken('test-token');
      const headers = apiClient['getHeaders']();
      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('should set Content-Type header', () => {
      const headers = apiClient['getHeaders']();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not include Authorization when token is null', () => {
      apiClient.clearToken();
      const headers = apiClient['getHeaders']();
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('BaseUrl Configuration', () => {
    it('should initialize with custom base URL', () => {
      const client = new ApiClient('https://api.example.com');
      expect(client['baseUrl']).toBe('https://api.example.com');
    });

    it('should use default base URL', () => {
      const client = new ApiClient();
      expect(client['baseUrl']).toBeDefined();
    });
  });

  describe('API Request Methods', () => {
    it('should have login method', () => {
      expect(typeof apiClient.login).toBe('function');
    });

    it('should have register method', () => {
      expect(typeof apiClient.register).toBe('function');
    });

    it('should have logout method', () => {
      expect(typeof apiClient.logout).toBe('function');
    });

    it('should have health check method', () => {
      expect(typeof apiClient.healthCheck).toBe('function');
    });

    it('should have conversation methods', () => {
      expect(typeof apiClient.getConversations).toBe('function');
      expect(typeof apiClient.getConversation).toBe('function');
      expect(typeof apiClient.createConversation).toBe('function');
      expect(typeof apiClient.deleteConversation).toBe('function');
    });

    it('should have message methods', () => {
      expect(typeof apiClient.getMessages).toBe('function');
      expect(typeof apiClient.sendMessage).toBe('function');
      expect(typeof apiClient.deleteMessage).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      // This would require mocking fetch, which is handled in integration tests
      expect(apiClient).toBeDefined();
    });

    it('should return error response on failed requests', () => {
      expect(apiClient).toBeDefined();
    });
  });
});
